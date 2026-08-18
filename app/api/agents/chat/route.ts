import { NextRequest, NextResponse } from "next/server";
import { ensureProjectDirectory } from "@/lib/workspace/project-fs";
import path from "node:path";
import fsp from "node:fs/promises";
import fs from "node:fs";

export const dynamic = 'force-dynamic';

const OPENCODE_URL = process.env.OPENCODE_URL || "http://127.0.0.1:4096";

export async function POST(req: NextRequest) {
    try {
        const { message, chatId, forceAgent } = await req.json();
        const effectiveChatId = chatId || crypto.randomUUID();

        if (!message || typeof message !== 'string' || !message.trim()) {
            return NextResponse.json({ error: "Valid non-empty message is required" }, { status: 400 });
        }

        // 1. Generate clean title if not set
        const cleanTitle = message
            .replace(/^#+\s*/, '')
            .split('\n')[0]
            .slice(0, 35)
            .trim() || "Hardware Project";

        // 2. Ensure project directory and starter files exist on disk
        const projectDir = await ensureProjectDirectory(effectiveChatId, cleanTitle);
        const stagePath = path.join(projectDir, 'stage.json');

        let stageData: any = {
            id: effectiveChatId,
            title: cleanTitle,
            stage: 'planning',
            updatedAt: new Date().toISOString(),
        };

        if (fs.existsSync(stagePath)) {
            try {
                stageData = JSON.parse(await fsp.readFile(stagePath, 'utf-8'));
                if (!stageData.title || stageData.title === 'New Project' || stageData.title === 'Hardware Project') {
                    stageData.title = cleanTitle;
                }
            } catch { }
        }

        // 3. Obtain or create OpenCode session ID
        let opencodeSessionId = stageData.opencode_session_id;

        if (!opencodeSessionId) {
            try {
                const sessionRes = await fetch(`${OPENCODE_URL}/session`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        title: stageData.title || cleanTitle,
                    }),
                });

                if (sessionRes.ok) {
                    const sessionInfo = await sessionRes.json();
                    opencodeSessionId = sessionInfo.id;
                    stageData.opencode_session_id = opencodeSessionId;
                }
            } catch (err: any) {
                console.error("[Chat API] ⚠️ Failed to create OpenCode session:", err.message);
            }
        }

        // Save updated stageData with title and opencode_session_id
        stageData.updatedAt = new Date().toISOString();
        await fsp.writeFile(stagePath, JSON.stringify(stageData, null, 2), 'utf-8');

        // 4. Append user message to messages.jsonl
        const messagesPath = path.join(projectDir, 'messages.jsonl');
        const userMsg = {
            id: crypto.randomUUID(),
            chat_id: effectiveChatId,
            role: 'user',
            content: message,
            created_at: new Date().toISOString(),
        };
        await fsp.appendFile(messagesPath, JSON.stringify(userMsg) + '\n', 'utf-8');

        if (!opencodeSessionId) {
            return NextResponse.json({
                error: "Failed to establish OpenCode session. Ensure `opencode serve` is running."
            }, { status: 502 });
        }

        // 5. Send prompt to OpenCode
        console.log(`[Chat API] 🚀 Dispatching to OpenCode session ${opencodeSessionId} (chatId: ${effectiveChatId})...`);
        const openCodeRes = await fetch(`${OPENCODE_URL}/session/${opencodeSessionId}/message`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                parts: [{ type: "text", text: message }],
                agent: forceAgent || undefined,
            }),
        });

        if (!openCodeRes.ok) {
            const errText = await openCodeRes.text();
            console.error(`[Chat API] ❌ OpenCode error (${openCodeRes.status}):`, errText);
            return NextResponse.json({
                error: `OpenCode daemon error (${openCodeRes.status}): ${errText || 'Failed to dispatch message'}`
            }, { status: openCodeRes.status });
        }

        const openCodeData = await openCodeRes.json().catch(() => ({}));

        // 6. Append assistant response to messages.jsonl if text exists
        if (openCodeData?.parts) {
            const textParts = openCodeData.parts
                .filter((p: any) => p.type === 'text' && p.text)
                .map((p: any) => p.text)
                .join('\n');

            const reasoningParts = openCodeData.parts
                .filter((p: any) => p.type === 'reasoning' && p.text)
                .map((p: any) => p.text)
                .join('\n\n');

            const toolParts = openCodeData.parts
                .filter((p: any) => p.type === 'tool' || p.tool);

            const reasoningPart = openCodeData.parts.find((p: any) => p.type === 'reasoning');
            const reasoningDuration = (reasoningPart?.time?.start && reasoningPart?.time?.end)
                ? (reasoningPart.time.end - reasoningPart.time.start)
                : undefined;

            if (textParts || reasoningParts || toolParts.length > 0) {
                const assistantMsg = {
                    id: crypto.randomUUID(),
                    chat_id: effectiveChatId,
                    role: 'assistant',
                    content: textParts,
                    reasoning: reasoningParts || undefined,
                    reasoningDuration,
                    tools: toolParts.length > 0 ? toolParts : undefined,
                    parts: openCodeData.parts,
                    agent_name: forceAgent || openCodeData.info?.agent || 'orchestrator',
                    created_at: new Date().toISOString(),
                };
                await fsp.appendFile(messagesPath, JSON.stringify(assistantMsg) + '\n', 'utf-8');
            }
        }

        return NextResponse.json({
            success: true,
            chatId: effectiveChatId,
            title: stageData.title,
            result: openCodeData,
        });

    } catch (error: any) {
        console.error("[Chat API] ❌ Handler error:", error);
        return NextResponse.json({ error: error.message || "Failed to process chat" }, { status: 500 });
    }
}
