import { NextRequest, NextResponse } from "next/server";
import { ensureProjectDirectory, slugifyProjectTitle } from "@/lib/workspace/project-fs";
import path from "path";
import fsp from "fs/promises";
import fs from "fs";

export const dynamic = 'force-dynamic';

const GROQ_API_KEY = process.env.GROQ_API_KEY_1 || process.env.GROQ_API_KEY;

export async function POST(req: NextRequest) {
    try {
        const { message, chatId: requestedChatId } = await req.json();

        if (!message || typeof message !== 'string' || !message.trim()) {
            return NextResponse.json({ error: "Message prompt is required" }, { status: 400 });
        }

        let generatedTitle = "";

        // 1. Fast Groq Title Generation (sub-second small model)
        if (GROQ_API_KEY) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 2000); // 2s timeout

                const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${GROQ_API_KEY}`
                    },
                    body: JSON.stringify({
                        model: "allam-2-7b",
                        messages: [
                            {
                                role: "system",
                                content: "You are a concise hardware project namer. Given a user prompt, respond with ONLY a clean 2 to 4 word title. No quotes, no markdown, no punctuation."
                            },
                            {
                                role: "user",
                                content: message.slice(0, 300)
                            }
                        ],
                        max_tokens: 25,
                        temperature: 0.2
                    }),
                    signal: controller.signal
                });

                clearTimeout(timeoutId);

                if (groqRes.ok) {
                    const data = await groqRes.json();
                    const raw = data.choices?.[0]?.message?.content?.trim();
                    if (raw && raw.length > 2 && raw.length < 50) {
                        generatedTitle = raw.replace(/["'#*]/g, '').trim();
                    }
                }
            } catch (err: any) {
                console.warn("[Title API] Groq title generation fallback:", err.message);
            }
        }

        // 2. Instant Local Fallback if Groq unavailable
        if (!generatedTitle) {
            const cleanedPrompt = message
                .replace(/^#+\s*/, '')
                .split('\n')[0]
                .replace(/^(i\s+want\s+to\s+build|i\s+want\s+to\s+make|i\s+need\s+to\s+build|help\s+me\s+build|build|create|design|make)?\s*(a|an|the)?\s+/i, '')
                .replace(/[^a-zA-Z0-9\s]/g, ' ')
                .trim();
            const words = cleanedPrompt.split(/\s+/).filter(Boolean).slice(0, 4);
            generatedTitle = words.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ') || "Hardware Project";
        }

        // 3. Generate clean slug for project folder name
        const slug = slugifyProjectTitle(generatedTitle);
        const effectiveChatId = requestedChatId || slug;

        // 4. Ensure project folder is created with this slug/name
        const projectDir = await ensureProjectDirectory(effectiveChatId, generatedTitle);
        const stagePath = path.join(projectDir, "stage.json");

        if (fs.existsSync(stagePath)) {
            try {
                const meta = JSON.parse(await fsp.readFile(stagePath, "utf-8"));
                meta.title = generatedTitle;
                meta.updatedAt = new Date().toISOString();
                await fsp.writeFile(stagePath, JSON.stringify(meta, null, 2), "utf-8");
            } catch { }
        }

        return NextResponse.json({
            title: generatedTitle,
            slug,
            chatId: effectiveChatId
        });

    } catch (error: any) {
        console.error("[Title API] Error:", error);
        return NextResponse.json({ error: error.message || "Failed to generate title" }, { status: 500 });
    }
}
