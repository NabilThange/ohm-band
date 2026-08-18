'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { showAgentChangeToast, showToolCallToast } from '@/lib/agents/toast-notifications';
import { ExecutionStep } from '@/components/ai_chat/AgentExecutionFlow';

export interface ChatMessage {
    id: string;
    chat_id?: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    reasoning?: string;
    tools?: any[];
    agent_name?: string;
    created_at?: string;
    metadata?: Record<string, any>;
}

// Consolidate consecutive assistant messages into a single unified turn card
function consolidateTurnMessages(rawMessages: any[], chatId: string): ChatMessage[] {
    const consolidated: ChatMessage[] = [];

    for (const m of rawMessages) {
        let text = '';
        let reasoning = '';
        const tools: any[] = [];
        const executionSteps: ExecutionStep[] = [];

        for (const p of m.parts || []) {
            if (p.type === 'text') {
                text += p.text || '';
            } else if (p.type === 'reasoning') {
                const rText = p.text || '';
                reasoning += (reasoning ? '\n\n' : '') + rText;
                executionSteps.push({
                    id: p.id || `reasoning-${executionSteps.length}`,
                    type: 'reasoning',
                    text: rText,
                    state: 'completed'
                });
            } else if (p.type === 'tool' || p.tool) {
                const toolName = p.tool || p.name;
                const status = typeof p.state === 'string' ? p.state : (p.state?.status || 'completed');
                const args = p.args || (typeof p.state === 'object' ? p.state?.input : null) || {};
                const result = p.result || (typeof p.state === 'object' ? p.state?.output : null);

                const toolObj = {
                    id: p.id || `tool-${tools.length}`,
                    tool: toolName,
                    toolName,
                    state: status,
                    args,
                    result
                };
                tools.push(toolObj);
                executionSteps.push({
                    id: toolObj.id,
                    type: 'tool',
                    toolName,
                    state: status as any,
                    args,
                    result
                });
            }
        }

        const lastMsg = consolidated[consolidated.length - 1];

        // If both this message and the previous message are 'assistant', merge them into 1 unified card!
        if (m.role === 'assistant' && lastMsg && lastMsg.role === 'assistant') {
            lastMsg.content = (lastMsg.content ? lastMsg.content + '\n\n' : '') + text;
            if (reasoning) {
                lastMsg.reasoning = (lastMsg.reasoning ? lastMsg.reasoning + '\n\n' : '') + reasoning;
            }
            if (tools.length > 0) {
                lastMsg.tools = [...(lastMsg.tools || []), ...tools];
            }
            if (executionSteps.length > 0) {
                lastMsg.metadata = {
                    ...(lastMsg.metadata || {}),
                    executionSteps: [...(lastMsg.metadata?.executionSteps || []), ...executionSteps]
                };
            }
        } else {
            consolidated.push({
                id: m.id || crypto.randomUUID(),
                chat_id: chatId,
                role: m.role,
                content: text,
                reasoning: reasoning || undefined,
                tools: tools.length > 0 ? tools : undefined,
                metadata: executionSteps.length > 0 ? { executionSteps } : undefined,
                created_at: m.created_at || new Date().toISOString()
            });
        }
    }

    return consolidated;
}

export function useChat(chatId: string) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [forceAgent, setForceAgent] = useState<string | null>(null);

    const activeTempMessageIdRef = useRef<string | null>(null);
    const currentStreamedContentRef = useRef<string>('');
    const currentStreamedReasoningRef = useRef<string>('');
    const currentStreamedToolsRef = useRef<any[]>([]);
    const currentStreamedStepsRef = useRef<ExecutionStep[]>([]);

    // Get or initialize persistent OpenCode session ID from localStorage
    const getSessionId = useCallback(() => {
        if (!chatId) return '';
        if (typeof window !== 'undefined') {
            return localStorage.getItem(`ohm_session_${chatId}`) || '';
        }
        return '';
    }, [chatId]);

    const setSessionId = useCallback((sId: string) => {
        if (!chatId || !sId) return;
        if (typeof window !== 'undefined') {
            localStorage.setItem(`ohm_session_${chatId}`, sId);
        }
    }, [chatId]);

    // Load message history from local project store or directly from OpenCode daemon
    const loadMessages = useCallback(async () => {
        if (!chatId) return;

        const isRemote = typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
        const opencodeUrl = process.env.NEXT_PUBLIC_OPENCODE_URL || 'http://127.0.0.1:4096';

        try {
            // 1. Try local Next.js project endpoint
            const res = await fetch(`/api/projects/${chatId}/messages`);
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data) && data.length > 0) {
                    setMessages(data);
                    return;
                }
            }

            // 2. Fallback for Vercel: read directly from local OpenCode daemon session
            if (isRemote) {
                const sId = getSessionId() || chatId;
                const ocRes = await fetch(`${opencodeUrl}/session/${sId}/message`);
                if (ocRes.ok) {
                    const ocData = await ocRes.json();
                    if (Array.isArray(ocData) && ocData.length > 0) {
                        const consolidated = consolidateTurnMessages(ocData, chatId);
                        setMessages(consolidated);
                    }
                }
            }
        } catch (err: any) {
            console.error('[useChat] Failed to load messages:', err);
        }
    }, [chatId, getSessionId]);

    useEffect(() => {
        if (!chatId) {
            setMessages([]);
            return;
        }
        loadMessages();
    }, [chatId, loadMessages]);

    // Connect to OpenCode SSE stream for real-time tokens and tool events
    useEffect(() => {
        if (!chatId) return;

        const opencodeUrl = process.env.NEXT_PUBLIC_OPENCODE_URL || 'http://127.0.0.1:4096';
        const isRemote = typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
        const sseUrl = isRemote ? `${opencodeUrl}/event` : '/api/opencode/events';

        const es = new EventSource(sseUrl);

        es.onmessage = (e) => {
            try {
                const evt = JSON.parse(e.data);
                const tempId = activeTempMessageIdRef.current;

                // 1. Text & Reasoning token deltas
                if (evt.type === 'message.part.delta' && evt.properties?.delta) {
                    const delta = evt.properties.delta;
                    const field = evt.properties?.field;

                    if (field === 'reasoning') {
                        currentStreamedReasoningRef.current += delta;
                        
                        // Update or append live reasoning step
                        const lastStep = currentStreamedStepsRef.current[currentStreamedStepsRef.current.length - 1];
                        if (lastStep && lastStep.type === 'reasoning') {
                            lastStep.text = (lastStep.text || '') + delta;
                        } else {
                            currentStreamedStepsRef.current.push({
                                id: `reasoning-${Date.now()}`,
                                type: 'reasoning',
                                text: delta,
                                state: 'running'
                            });
                        }
                    } else {
                        currentStreamedContentRef.current += delta;
                    }

                    if (tempId) {
                        setMessages((prev) =>
                            prev.map((m) =>
                                m.id === tempId
                                    ? {
                                          ...m,
                                          content: currentStreamedContentRef.current,
                                          reasoning: currentStreamedReasoningRef.current,
                                          tools: [...currentStreamedToolsRef.current],
                                          metadata: {
                                              ...(m.metadata || {}),
                                              executionSteps: [...currentStreamedStepsRef.current]
                                          }
                                      }
                                    : m
                            )
                        );
                    }
                }

                // 2. Tool executions & Reasoning part updates
                if (evt.type === 'message.part.updated' && evt.properties?.part) {
                    const part = evt.properties.part;

                    if (part.type === 'reasoning' && part.text) {
                        currentStreamedReasoningRef.current = part.text;
                    } else if (part.type === 'tool' || part.tool) {
                        const toolName = part.tool || part.name;
                        if (toolName) {
                            showToolCallToast(toolName);
                        }

                        const toolStatus = typeof part.state === 'string' ? part.state : (part.state?.status || 'completed');
                        const toolArgs = part.args || (typeof part.state === 'object' ? part.state?.input : null) || {};
                        const toolOutput = part.result || (typeof part.state === 'object' ? part.state?.output : null);

                        const normalizedTool = {
                            id: part.id || Math.random().toString(36).slice(2),
                            tool: toolName,
                            toolName,
                            state: toolStatus,
                            args: toolArgs,
                            result: toolOutput
                        };

                        const idx = currentStreamedToolsRef.current.findIndex((p) => p.id === normalizedTool.id);
                        if (idx >= 0) {
                            currentStreamedToolsRef.current[idx] = normalizedTool;
                        } else {
                            currentStreamedToolsRef.current.push(normalizedTool);
                        }

                        // Add to chronological execution steps
                        const stepIdx = currentStreamedStepsRef.current.findIndex(s => s.id === normalizedTool.id);
                        if (stepIdx >= 0) {
                            currentStreamedStepsRef.current[stepIdx] = {
                                id: normalizedTool.id,
                                type: 'tool',
                                toolName,
                                state: toolStatus as any,
                                args: toolArgs,
                                result: toolOutput
                            };
                        } else {
                            currentStreamedStepsRef.current.push({
                                id: normalizedTool.id,
                                type: 'tool',
                                toolName,
                                state: toolStatus as any,
                                args: toolArgs,
                                result: toolOutput
                            });
                        }
                    }

                    if (tempId) {
                        setMessages((prev) =>
                            prev.map((m) =>
                                m.id === tempId
                                    ? {
                                          ...m,
                                          content: currentStreamedContentRef.current,
                                          reasoning: currentStreamedReasoningRef.current,
                                          tools: [...currentStreamedToolsRef.current],
                                          metadata: {
                                              ...(m.metadata || {}),
                                              executionSteps: [...currentStreamedStepsRef.current]
                                          }
                                      }
                                    : m
                            )
                        );
                    }
                }

                // 3. Turn complete
                if (evt.type === 'session.idle') {
                    setMessages((prev) =>
                        prev.map((m) =>
                            m.metadata?.isStreaming ? { ...m, metadata: { ...m.metadata, isStreaming: false } } : m
                        )
                    );
                    activeTempMessageIdRef.current = null;
                    currentStreamedContentRef.current = '';
                    currentStreamedReasoningRef.current = '';
                    currentStreamedToolsRef.current = [];
                    currentStreamedStepsRef.current = [];
                    setIsLoading(false);
                    // Reload clean message history without wiping state if empty
                    loadMessages();
                }
            } catch (err) {
                console.error('[useChat SSE] Parse error:', err);
            }
        };

        return () => {
            es.close();
        };
    }, [chatId, loadMessages]);

    const sendMessage = useCallback(
        async (content: string) => {
            if (!chatId || !content.trim()) return;

            const userTempId = crypto.randomUUID();
            const aiTempId = crypto.randomUUID();
            activeTempMessageIdRef.current = aiTempId;
            currentStreamedContentRef.current = '';
            currentStreamedReasoningRef.current = '';
            currentStreamedToolsRef.current = [];
            currentStreamedStepsRef.current = [];

            const userMsg: ChatMessage = {
                id: userTempId,
                chat_id: chatId,
                role: 'user',
                content,
                created_at: new Date().toISOString(),
            };

            const aiMsg: ChatMessage = {
                id: aiTempId,
                chat_id: chatId,
                role: 'assistant',
                content: '',
                reasoning: '',
                tools: [],
                metadata: { isStreaming: true, executionSteps: [] },
                agent_name: forceAgent || 'orchestrator',
                created_at: new Date().toISOString(),
            };

            // Optimistic update
            setMessages((prev) => [...prev, userMsg, aiMsg]);
            setIsLoading(true);

            if (forceAgent) {
                showAgentChangeToast(forceAgent);
            }

            try {
                let res = await fetch('/api/agents/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        message: content,
                        chatId,
                        forceAgent,
                    }),
                });

                if (!res.ok) {
                    const opencodeUrl = process.env.NEXT_PUBLIC_OPENCODE_URL || 'http://127.0.0.1:4096';
                    console.warn('[useChat] Cloud API failed, trying direct browser-to-daemon dispatch on:', opencodeUrl);

                    // Direct client-side dispatch from browser to local OpenCode (1 Project = 1 Persistent Session)
                    let sessionId = getSessionId();

                    if (!sessionId) {
                        try {
                            const sRes = await fetch(`${opencodeUrl}/session`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ title: content.slice(0, 35) })
                            });
                            if (sRes.ok) {
                                const sData = await sRes.json();
                                sessionId = sData.id || chatId;
                                setSessionId(sessionId);
                            }
                        } catch {
                            sessionId = chatId;
                        }
                    }

                    res = await fetch(`${opencodeUrl}/session/${sessionId}/message`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            parts: [{ type: 'text', text: content }],
                            agent: forceAgent || undefined
                        }),
                    });
                }
            } catch (err: any) {
                console.error('[useChat] Error sending message:', err);
                setError(err.message);
                setIsLoading(false);
            }
        },
        [chatId, forceAgent, getSessionId, setSessionId]
    );

    return {
        messages,
        isLoading,
        error,
        sendMessage,
        loadMessages,
        forceAgent,
        setForceAgent,
    };
}
