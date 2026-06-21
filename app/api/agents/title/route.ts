import { NextRequest, NextResponse } from "next/server";
import { AssemblyLineOrchestrator } from "@/lib/agents/orchestrator";
import { ChatService } from "@/lib/db/chat";

export async function POST(req: NextRequest) {
    try {
        const { message, chatId } = await req.json();

        if (!message || !chatId) {
            return NextResponse.json({ error: "Message and chatId are required" }, { status: 400 });
        }

        // ============================================================
        // DEMO MODE: Return pre-scripted title without API call
        // ============================================================
        if (process.env.DEMO_MODE === 'true') {
            const normalizedMessage = message.toLowerCase().trim();
            
            // Match drone patrol prompt
            if (normalizedMessage.includes('autonomous drone') && normalizedMessage.includes('farm')) {
                const title = 'Farm Patrol Autonomous Drone Build';
                console.log('[DEMO MODE] 🎬 Returning scripted title:', title);
                
                // Update chat in DB
                await ChatService.updateChat(chatId, { title });
                
                return NextResponse.json({ title });
            }
            
            console.log('[DEMO MODE] ⚠️ No scripted title found, falling back to real API');
        }

        // ============================================================
        // REAL MODE: Normal title generation
        // ============================================================
        const orchestrator = new AssemblyLineOrchestrator(chatId);
        const title = await orchestrator.generateTitle(message);

        // Update chat in DB
        await ChatService.updateChat(chatId, { title });

        return NextResponse.json({ title });
    } catch (error: any) {
        console.error("Title generation API error:", error);
        return NextResponse.json({ error: error.message || "Failed to generate title" }, { status: 500 });
    }
}
