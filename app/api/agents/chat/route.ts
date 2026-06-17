import { NextRequest } from "next/server";
import { AssemblyLineOrchestrator } from "@/lib/agents/orchestrator";

export async function POST(req: NextRequest) {
    try {
        const { message, chatId, forceAgent } = await req.json();

        const effectiveChatId = chatId || "default_ephemeral_session";

        if (!message || typeof message !== 'string' || !message.trim()) {
            return new Response(JSON.stringify({ error: "Valid non-empty message is required" }), {
                status: 400,
                headers: { "Content-Type": "application/json" }
            });
        }

        const orchestrator = new AssemblyLineOrchestrator(effectiveChatId);
        const encoder = new TextEncoder();

        const stream = new ReadableStream({
            async start(controller) {
                try {
                    // Start the chat with EARLY agent notification callback
                    const result = await orchestrator.chat(
                        message,
                        (chunk) => {
                            // Send text chunks as they arrive
                            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'text', content: chunk })}\n\n`));
                        },
                        forceAgent,
                        // NEW: Early agent notification - fires IMMEDIATELY when agent is determined
                        (agent) => {
                            console.log('[API Route] 🚀 Sending early agent notification:', agent.name);
                            controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                                type: 'agent_selected',
                                agent: agent
                            })}\n\n`));
                        },
                        // NEW: Tool call notification - fires when tool is ABOUT to be executed
                        (toolCall) => {
                            console.log('[API Route] 🔧 Sending tool call notification:', toolCall.name);
                            controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                                type: 'tool_call',
                                toolCall: toolCall
                            })}\n\n`));
                        },
                        // NEW: Key rotation notification - fires when API key is rotated
                        (keyRotationEvent) => {
                            console.log('[API Route] 🔑 Sending key rotation event:', keyRotationEvent.type);
                            controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                                type: 'key_rotation',
                                event: keyRotationEvent
                            })}\n\n`));
                        }
                    );

                    // NEW: Parse and send questions if present
                    if (result.hasQuestions && result.questions) {
                        console.log('[API Route] ❓ Sending questions:', result.questions.questions.length);
                        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                            type: 'questions',
                            questions: result.questions
                        })}\n\n`));
                    }

                    // Send final metadata (with any additional info like key rotation and tool calls)
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                        type: 'metadata',
                        agent: {
                            type: result.agentType,
                            name: result.agentName,
                            icon: result.agentIcon,
                            intent: result.intent
                        },
                        isReadyToLock: result.isReadyToLock,
                        toolCalls: result.toolCalls || [], // NEW: Include tool calls
                        hasQuestions: result.hasQuestions, // NEW: Include questions flag
                        keyRotationEvent: result.keyRotationEvent
                    })}\n\n`));

                    controller.close();
                } catch (error: any) {
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', message: error.message })}\n\n`));
                    controller.close();
                }
            }
        });

        return new Response(stream, {
            headers: {
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
            },
        });

    } catch (error: any) {
        console.error("Chat API error:", error);
        return new Response(JSON.stringify({ error: error.message || "Failed to process chat" }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
}
