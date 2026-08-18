import { useEffect, useState, useCallback, useRef } from 'react';
import { showAgentChangeToast, showToolCallToast } from '@/lib/agents/toast-notifications';

export interface ChatMessage {
    id: string;
    chat_id: string;
    role: 'user' | 'assistant';
    content: string;
    reasoning?: string;
    tools?: any[];
    parts?: any[];
    sequence_number?: number;
    created_at?: string;
    agent_name?: string | null;
    agent_id?: string | null;
    metadata?: any;
}

export function useChat(chatId: string | null, onAgentChange?: (agent: any) => void) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [forceAgent, setForceAgent] = useState<string | null>(null);

    const activeTempMessageIdRef = useRef<string | null>(null);
    const currentStreamedContentRef = useRef<string>('');
    const currentStreamedReasoningRef = useRef<string>('');
    const currentStreamedToolsRef = useRef<any[]>([]);

    // Load message history from local project store
    const loadMessages = useCallback(async () => {
        if (!chatId) return;

        setIsLoading(true);
        try {
            const res = await fetch(`/api/projects/${chatId}/messages`);
            if (res.ok) {
                const data = await res.json();
                setMessages(data || []);
            }
        } catch (err: any) {
            console.error('[useChat] Failed to load messages:', err);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, [chatId]);

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
                                      }
                                    : m
                            )
                        );
                    }
                }

                // 3. Turn complete
                if (evt.type === 'session.idle') {
                    activeTempMessageIdRef.current = null;
                    currentStreamedContentRef.current = '';
                    currentStreamedReasoningRef.current = '';
                    currentStreamedToolsRef.current = [];
                    setIsLoading(false);
                    // Reload clean message history
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
                metadata: { isStreaming: true },
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

                    // Direct client-side dispatch from browser to local OpenCode
                    let sessionId = chatId;
                    try {
                        const sRes = await fetch(`${opencodeUrl}/session`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ title: content.slice(0, 30) })
                        });
                        if (sRes.ok) {
                            const sData = await sRes.json();
                            sessionId = sData.id || sessionId;
                        }
                    } catch {}

                    res = await fetch(`${opencodeUrl}/session/${sessionId}/message`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            parts: [{ type: 'text', text: content }],
                            agent: forceAgent || undefined
                        })
                    });

                    if (!res.ok) {
                        const errorData = await res.json().catch(() => ({}));
                        throw new Error(errorData.error || 'Failed to dispatch message to OpenCode');
                    }
                }
            } catch (err: any) {
                console.error('[useChat] Error sending message:', err);
                setError(err.message);
                setIsLoading(false);
            }
        },
        [chatId, forceAgent]
    );

    return {
        messages,
        isLoading,
        error,
        sendMessage,
        setForceAgent,
        refreshMessages: loadMessages,
    };
}
