import { NextRequest } from "next/server";
import { AssemblyLineOrchestrator } from "@/lib/agents/orchestrator";
import { getDemoResponse } from "@/lib/agents/demo-responses";
import { ChatService } from "@/lib/db/chat";
import { ToolExecutor } from "@/lib/agents/tool-executor";
import { randomUUID } from "crypto";

export async function POST(req: NextRequest) {
    try {
        const { message, chatId, forceAgent } = await req.json();

        // Generate a proper UUID if no chatId provided
        const effectiveChatId = chatId || randomUUID();

        if (!message || typeof message !== 'string' || !message.trim()) {
            return new Response(JSON.stringify({ error: "Valid non-empty message is required" }), {
                status: 400,
                headers: { "Content-Type": "application/json" }
            });
        }

        const encoder = new TextEncoder();

        // ============================================================
        // DEMO MODE: Return pre-scripted responses without API calls
        // ============================================================
        if (process.env.DEMO_MODE === 'true') {
            // Get existing messages for this chat to determine user message count
            const existingMessages = await ChatService.getMessages(effectiveChatId);
            const userMessageCount = existingMessages.filter((m: any) => m.role === 'user').length;

            const demoResponse = getDemoResponse(message, userMessageCount);
            
            if (demoResponse) {
                console.log('[DEMO MODE] 🎬 Returning scripted response for:', message.substring(0, 50));
                
                // Save user message to database
                const userSeq = await ChatService.getNextSequenceNumber(effectiveChatId);
                await ChatService.addMessage({
                    chat_id: effectiveChatId,
                    role: "user",
                    content: message,
                    sequence_number: userSeq,
                    agent_name: null,
                    agent_model: null,
                    intent: null,
                    input_tokens: null,
                    output_tokens: null,
                    metadata: null
                });

                const stream = new ReadableStream({
                    async start(controller) {
                        try {
                            // Send agent selection immediately
                            controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                                type: 'agent_selected',
                                agent: {
                                    type: demoResponse.agentType,
                                    name: demoResponse.agentName,
                                    icon: demoResponse.agentIcon
                                }
                            })}\n\n`));

                            // Stream text chunks with realistic delays (word by word)
                            let fullContent = '';
                            for (const chunk of demoResponse.textChunks) {
                                // Split chunk into words/spaces to simulate word-by-word generation
                                const words = chunk.split(/(\s+)/);
                                const bundles: string[] = [];
                                let currentBundle = '';
                                
                                for (let i = 0; i < words.length; i++) {
                                    currentBundle += words[i];
                                    // Bundle every 6 elements (~3 words + spaces) to keep streaming fast but natural
                                    if (i % 6 === 5 || i === words.length - 1) {
                                        bundles.push(currentBundle);
                                        currentBundle = '';
                                    }
                                }

                                for (const bundle of bundles) {
                                    fullContent += bundle;
                                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                                        type: 'text',
                                        content: bundle
                                    })}\n\n`));
                                    
                                    // 10-25ms delay per bundle for a nice typing effect
                                    await new Promise(resolve => setTimeout(resolve, 10 + Math.random() * 15));
                                }
                            }

                            // Parse questions from the full content
                            const { parseQuestions } = await import('@/lib/agents/question-parser');
                            const parsed = parseQuestions(fullContent);
                            
                            if (parsed.hasQuestions) {
                                console.log('[DEMO MODE] ❓ Questions detected:', parsed.questions);
                                // Send questions event
                                controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                                    type: 'questions',
                                    questions: parsed.questions
                                })}\n\n`));
                            }

                            // Send tool calls AND EXECUTE THEM
                            const toolExecutor = new ToolExecutor(effectiveChatId);
                            
                            for (const toolCall of demoResponse.toolCalls) {
                                controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                                    type: 'tool_call',
                                    toolCall: toolCall
                                })}\n\n`));
                                
                                // Execute the tool call (writes to database)
                                try {
                                    console.log(`[DEMO MODE] 🔧 Executing tool: ${toolCall.name}`);
                                    await toolExecutor.executeToolCall(toolCall);
                                    console.log(`[DEMO MODE] ✅ Tool executed: ${toolCall.name}`);
                                } catch (toolError: any) {
                                    console.error(`[DEMO MODE] ❌ Tool execution failed:`, toolError.message);
                                }
                                
                                // Delay logic: If opening a drawer, wait 1000ms to simulate realism
                                const isOpenDrawerTool = 
                                    toolCall.name === 'open_drawer' || 
                                    (toolCall.name.startsWith('open_') && toolCall.name.endsWith('_drawer'));
                                    
                                if (isOpenDrawerTool) {
                                    console.log('[DEMO MODE] ⏱️ Waiting 1000ms after opening drawer...');
                                    await new Promise(resolve => setTimeout(resolve, 1000));
                                } else {
                                    // Small delay between other tool calls
                                    await new Promise(resolve => setTimeout(resolve, 100));
                                }
                            }

                            // Send final metadata
                            controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                                type: 'metadata',
                                agent: {
                                    type: demoResponse.agentType,
                                    name: demoResponse.agentName,
                                    icon: demoResponse.agentIcon,
                                    intent: demoResponse.intent
                                },
                                isReadyToLock: false,
                                toolCalls: demoResponse.toolCalls,
                                hasQuestions: parsed.hasQuestions,
                                projectTitle: demoResponse.title // NEW: Send title update if present
                            })}\n\n`));

                            // Save assistant message to database
                            const assistantSeq = await ChatService.getNextSequenceNumber(effectiveChatId);
                            await ChatService.addMessage({
                                chat_id: effectiveChatId,
                                role: "assistant",
                                content: parsed.text, // Store clean text without question JSON
                                sequence_number: assistantSeq,
                                agent_name: demoResponse.agentName,
                                agent_model: 'demo-mode',
                                intent: demoResponse.intent,
                                metadata: {
                                    toolCalls: demoResponse.toolCalls,
                                    hasQuestions: parsed.hasQuestions,
                                    ...(parsed.hasQuestions ? { questions: parsed.questions } : {})
                                } as any,
                                input_tokens: 0,
                                output_tokens: 0
                            });

                            console.log('[DEMO MODE] ✅ Messages saved to database');

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
            }
            
            console.log('[DEMO MODE] ⚠️ No scripted response found, falling back to real API');
        }

        // ============================================================
        // REAL MODE: Normal orchestrator flow
        // ============================================================
        const orchestrator = new AssemblyLineOrchestrator(effectiveChatId);

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
