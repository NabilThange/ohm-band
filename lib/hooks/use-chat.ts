import { useEffect, useState, useCallback, useRef } from 'react'
import { ChatService } from '@/lib/db/chat'
import { supabase } from '@/lib/supabase/client'
import { Database } from '@/lib/supabase/types'
import { showKeyFailureToast, showKeyRotationSuccessToast, showToolCallToast } from '@/lib/agents/toast-notifications'

type Message = Database['public']['Tables']['messages']['Row']
type ChatSession = Database['public']['Tables']['chat_sessions']['Row']

export function useChat(chatId: string | null, onAgentChange?: (agent: any) => void) {
    const [messages, setMessages] = useState<Message[]>([])
    const [session, setSession] = useState<ChatSession | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [forceAgent, setForceAgent] = useState<string | null>(null)
    const activeTempMessageIdRef = useRef<string | null>(null); // ponytail: useRef prevents stale closure issues

    // Load initial history
    const loadMessages = useCallback(async () => {
        if (!chatId) return

        console.log('[useChat] 📥 Loading messages for chatId:', chatId)
        setIsLoading(true)
        try {
            const [msgs, sess] = await Promise.all([
                ChatService.getMessages(chatId),
                ChatService.getSession(chatId)
            ])
            console.log('[useChat] ✅ Loaded messages:', msgs?.length || 0, 'messages')
            if (msgs && msgs.length > 0) {
                console.log('[useChat] 📝 First message:', { id: msgs[0].id, role: msgs[0].role, content: msgs[0].content?.substring(0, 50) })
                console.log('[useChat] 📝 Last message:', { id: msgs[msgs.length - 1].id, role: msgs[msgs.length - 1].role, content: msgs[msgs.length - 1].content?.substring(0, 50) })
            } else {
                console.warn('[useChat] ⚠️ No messages returned from database')
            }
            setMessages(msgs || [])
            setSession(sess || null)
        } catch (err: any) {
            console.error('[useChat] ❌ Failed to load chat:', err)
            setError(err.message)
        } finally {
            setIsLoading(false)
        }
    }, [chatId])

    useEffect(() => {
        if (!chatId) {
            setMessages([])
            setSession(null)
            return
        }
        loadMessages()
    }, [chatId, loadMessages])

    // Subscribe to realtime updates
    useEffect(() => {
        if (!chatId) return

        console.log('[useChat] Setting up realtime subscription for chatId:', chatId)

        const channel = supabase
            .channel(`chat:${chatId}`)
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'messages', filter: `chat_id=eq.${chatId}` },
                (payload) => {
                    console.log('[useChat] Realtime INSERT event received:', payload.new)
                    const newMsg = payload.new as Message
                    setMessages(prev => {
                        // Dedup based on ID
                        if (prev.some(m => m.id === newMsg.id)) {
                            console.log('[useChat] Message already exists, skipping:', newMsg.id)
                            return prev
                        }

                        // Dedup based on sequence number (for persisted messages)
                        if (newMsg.sequence_number && newMsg.sequence_number < 10000000 && prev.some(m => m.sequence_number === newMsg.sequence_number && m.role === newMsg.role)) {
                            console.log('[useChat] Message with same sequence number already exists, skipping:', newMsg.id)
                            return prev
                        }
                        
                        // ponytail: Replace optimistic user message with real DB message
                        if (newMsg.role === 'user') {
                            console.log('[useChat] 🔄 User message from DB, checking for optimistic duplicate...');
                            // ponytail: Use timestamp + content hash for reliable deduplication instead of exact content match
                            const contentHash = newMsg.content.trim().toLowerCase();
                            const hasOptimisticUser = prev.some(m => 
                                m.role === 'user' && 
                                m.content.trim().toLowerCase() === contentHash && 
                                m.id !== newMsg.id && // Different IDs (temp vs real)
                                Math.abs(new Date(m.created_at).getTime() - new Date(newMsg.created_at).getTime()) < 2000 // Within 2s
                            );
                            
                            if (hasOptimisticUser) {
                                console.log('[useChat] ✅ Replacing optimistic user message with real message from DB');
                                // Remove optimistic, add real
                                return prev
                                    .filter(m => !(
                                        m.role === 'user' && 
                                        m.content.trim().toLowerCase() === contentHash && 
                                        m.id !== newMsg.id &&
                                        Math.abs(new Date(m.created_at).getTime() - new Date(newMsg.created_at).getTime()) < 2000
                                    ))
                                    .concat([newMsg])
                                    .sort((a, b) => a.sequence_number - b.sequence_number);
                            }
                        }
                        
                        // If this is an assistant message, check if we have a temp message to replace
                        if (newMsg.role === 'assistant') {
                            console.log('[useChat] 🔄 Checking if we need to replace temp message...');
                            // ponytail: Use ref to avoid stale closure - reads current value
                            const tempId = activeTempMessageIdRef.current;
                            const hasTempMessage = tempId && prev.some(m => m.id === tempId);
                            
                            if (hasTempMessage) {
                                console.log('[useChat] ✅ Replacing temp message with real message from DB (ID:', tempId, ')');
                                // Clear the active temp ID since we're replacing it
                                activeTempMessageIdRef.current = null;
                                // Replace the temp message with the real one
                                return prev
                                    .filter(m => m.id !== tempId)  // Remove temp by ID
                                    .concat([newMsg])  // Add real
                                    .sort((a, b) => a.sequence_number - b.sequence_number);
                            }
                        }
                        
                        console.log('[useChat] Adding new message from realtime:', newMsg.id, newMsg.role)
                        return [...prev, newMsg].sort((a, b) => a.sequence_number - b.sequence_number)
                    })
                }
            )
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'chat_sessions', filter: `chat_id=eq.${chatId}` },
                (payload) => {
                    console.log('[useChat] Session update received:', payload.new)
                    setSession(payload.new as ChatSession)
                }
            )
            .subscribe((status) => {
                console.log('[useChat] Subscription status:', status, 'for chatId:', chatId)
            })

        return () => {
            console.log('[useChat] Unsubscribing from chatId:', chatId)
            supabase.removeChannel(channel)
        }
    }, [chatId])

    const sendMessage = useCallback(async (content: string) => {
        if (!chatId) return

        const tempId = crypto.randomUUID()
        console.log('[useChat] sendMessage called with:', { content, chatId })

        try {
            // Optimistic update
            const now = new Date().toISOString()
            const optimisticMsg: Message = {
                id: tempId,
                chat_id: chatId,
                role: 'user',
                content,
                sequence_number: Date.now(), // temporary
                created_at: now,
                agent_name: null,
                agent_model: null,
                intent: null,
                input_tokens: null,
                output_tokens: null,
                created_artifact_ids: null,
                metadata: null,
                content_search: null
            }

            console.log('[useChat] Adding optimistic user message:', optimisticMsg.id)
            setMessages(prev => {
                console.log('[useChat] Current messages before user add:', prev.length)
                return [...prev, optimisticMsg]
            })

            // Call API with forceAgent
            const res = await fetch('/api/agents/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: content,
                    chatId,
                    forceAgent
                })
            })

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Failed to send message');
            }

            // Handle Stream
            const reader = res.body?.getReader();
            if (!reader) throw new Error('No response body');

            const decoder = new TextDecoder();
            const aiTempId = crypto.randomUUID();
            let fullContent = "";
            let agentInfo: any = null;
            let accumulatedToolCalls: any[] = [];  // NEW: Accumulate tool calls
            let realMessageId: string | null = null;  // NEW: Track real message ID from DB

            // ponytail: Track this temp ID so realtime subscription can replace it
            activeTempMessageIdRef.current = aiTempId;

            // Add an empty AI message initially
            setMessages(prev => [
                ...prev,
                {
                    id: aiTempId,
                    chat_id: chatId,
                    role: 'assistant',
                    content: '',
                    sequence_number: Date.now() + 1,
                    created_at: new Date().toISOString(),
                    agent_name: 'thinking...',
                    agent_model: null,
                    intent: 'CHAT',
                    input_tokens: null,
                    output_tokens: null,
                    created_artifact_ids: null,
                    metadata: null,
                    content_search: null
                }
            ]);

            console.log('[useChat] 📝 Created temp message with ID:', aiTempId);

            console.log('[useChat] Starting to read stream...');
            while (true) {
                const { done, value } = await reader.read();
                if (done) {
                    console.log('[useChat] Stream finished');
                    break;
                }

                const chunk = decoder.decode(value);
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (!line.trim() || !line.startsWith('data: ')) continue;

                    try {
                        const data = JSON.parse(line.slice(6));
                        console.log('[useChat] Received stream data:', data.type, data.type === 'text' ? `(${data.content?.length || 0} chars)` : '');

                        if (data.type === 'text') {
                            fullContent += data.content;
                            // Update the AI message content in real-time
                            setMessages(prev => prev.map(m =>
                                m.id === aiTempId ? { ...m, content: fullContent } : m
                            ));
                        } else if (data.type === 'agent_selected') {
                            // EARLY agent notification - fires BEFORE response starts streaming
                            const eventReceivedTime = performance.now();
                            console.log('[useChat] ⚡ EARLY agent selection received at', eventReceivedTime.toFixed(2), 'ms:', data.agent);
                            agentInfo = data.agent;

                            // Immediately show toast for agent selection
                            console.log('[useChat] 🎯 Showing agent selection toast directly...');
                            import('@/lib/agents/toast-notifications').then(({ showAgentChangeToast }) => {
                                showAgentChangeToast(data.agent.id || data.agent.type);
                            }).catch(err => {
                                console.error('[useChat] ❌ Failed to show agent toast:', err);
                            });

                            // Immediately notify parent (triggers toast + dropdown update)
                            if (onAgentChange) {
                                console.log('[useChat] 🔔 Triggering immediate agent change callback...');
                                const callbackStartTime = performance.now();
                                onAgentChange(data.agent);
                                const callbackEndTime = performance.now();
                                console.log('[useChat] ✅ Agent change callback completed in', (callbackEndTime - callbackStartTime).toFixed(2), 'ms');
                            }

                            // Update the temporary AI message with agent info
                            setMessages(prev => prev.map(m =>
                                m.id === aiTempId ? {
                                    ...m,
                                    agent_name: data.agent.name,
                                    agent_id: data.agent.type || data.agent.id,  // NEW: Store the agent ID
                                    intent: data.agent.intent
                                } : m
                            ));
                        } else if (data.type === 'tool_call') {
                            // NEW: Tool call notification - fires BEFORE tool execution
                            const eventReceivedTime = performance.now();
                            console.log('[useChat] 🔧 Tool call notification received at', eventReceivedTime.toFixed(2), 'ms:', data.toolCall);
                            const toolName = data.toolCall.name;

                            // Accumulate tool calls for metadata
                            accumulatedToolCalls.push(data.toolCall);

                            // Update message with tool calls in metadata
                            setMessages(prev => prev.map(m =>
                                m.id === aiTempId ? {
                                    ...m,
                                    metadata: { ...(m.metadata as any || {}), toolCalls: accumulatedToolCalls }
                                } : m
                            ));

                            // 1. Show Toast
                            const toastStartTime = performance.now();
                            showToolCallToast(toolName);
                            const toastEndTime = performance.now();
                            console.log('[useChat] ✅ Tool call toast triggered in', (toastEndTime - toastStartTime).toFixed(2), 'ms');

                            // 2. Map tool to drawer and dispatch open event
                            const toolDrawerMap: Record<string, string> = {
                                // New simplified tools - these have drawer in arguments
                                'read': 'read',
                                'write': 'write',
                                'delete': 'delete',
                                
                                // Legacy drawer opening tools
                                'open_context_drawer': 'context',
                                'open_bom_drawer': 'bom',
                                'open_code_drawer': 'code',
                                'open_wiring_drawer': 'wiring',
                                'open_budget_drawer': 'budget',
                                
                                // Legacy update tools
                                'update_context': 'context',
                                'update_mvp': 'context',
                                'update_prd': 'context',
                                'update_bom': 'bom',
                                'add_code_file': 'code',
                                'update_wiring': 'wiring',
                                'update_budget': 'budget'
                            };

                            // ponytail: open_drawer passes drawer name in arguments, others use static mapping
                            let drawer = toolDrawerMap[toolName];
                            if (toolName === 'open_drawer') {
                                drawer = data.toolCall.arguments?.drawer;
                                if (!drawer) {
                                    console.warn('[useChat] ⚠️ open_drawer called without drawer argument:', data.toolCall);
                                }
                            }

                            if (drawer) {
                                const drawerOpenStartTime = performance.now();
                                console.log(`[useChat] 🔓 OPTIMISTIC OPENING: Dispatching drawer open event for ${drawer} at`, drawerOpenStartTime.toFixed(2), 'ms');
                                console.log(`[useChat] ⏱️ Tool call received → Drawer open dispatch: ${(drawerOpenStartTime - eventReceivedTime).toFixed(2)}ms`);

                                window.dispatchEvent(new CustomEvent('open-drawer', {
                                    detail: { drawer }
                                }));

                                const drawerOpenEndTime = performance.now();
                                console.log(`[useChat] ✅ Drawer open event dispatched in ${(drawerOpenEndTime - drawerOpenStartTime).toFixed(2)}ms`);
                                console.log(`[useChat] 📊 TOTAL: Tool notification → Drawer event = ${(drawerOpenEndTime - eventReceivedTime).toFixed(2)}ms`);
                            }
                        } else if (data.type === 'key_rotation') {
                            // NEW: Key rotation notification - fires when API key is rotated
                            const eventReceivedTime = performance.now();
                            console.log('[useChat] 🔑 Key rotation event received at', eventReceivedTime.toFixed(2), 'ms:', data.event);

                            const event = data.event;

                            // Show toast based on event type
                            if (event.type === 'key_rotated') {
                                // Successful rotation
                                const message = `Switched to backup key (${event.remainingKeys}/${event.totalKeys} available)`;
                                console.log('[useChat] 🔄 Showing key rotation toast:', message);

                                // Import and show toast
                                import('@/lib/agents/toast-notifications').then(({ showKeyRotationSuccessToast }) => {
                                    showKeyRotationSuccessToast(event.newKeyIndex || 0);
                                });
                            } else if (event.type === 'key_failed') {
                                // Key failure
                                const message = `API Key failed (${event.remainingKeys}/${event.totalKeys} remaining)`;
                                console.log('[useChat] ⚠️ Showing key failure toast:', message);

                                import('@/lib/agents/toast-notifications').then(({ showKeyFailureToast }) => {
                                    showKeyFailureToast(
                                        event.failedKeyIndex || 0,
                                        event.totalKeys || 0,
                                        `${event.remainingKeys} backup keys available`
                                    );
                                });
                            } else if (event.type === 'all_keys_exhausted') {
                                // All keys exhausted
                                console.log('[useChat] ❌ Showing all keys exhausted toast');

                                import('@/lib/agents/toast-notifications').then(({ showAllKeysExhaustedToast }) => {
                                    showAllKeysExhaustedToast(event.totalKeys || 0);
                                });
                            }
                        } else if (data.type === 'questions') {
                            // NEW: Questions notification - agent needs clarification
                            console.log('[useChat] ❓ Questions received:', data.questions);
                            
                            // Update message with questions in metadata
                            setMessages(prev => prev.map(m =>
                                m.id === aiTempId ? {
                                    ...m,
                                    metadata: { 
                                        ...(m.metadata as any || {}),
                                        questions: data.questions,
                                        hasQuestions: true
                                    }
                                } : m
                            ));
                        } else if (data.type === 'metadata') {
                            console.log('[useChat] Received final metadata:', data.agent);
                            // Final metadata - may contain additional info like key rotation
                            // Only update agent if we didn't get early notification
                            if (!agentInfo && data.agent && onAgentChange) {
                                console.log('[useChat] Calling onAgentChange callback (fallback)...');
                                onAgentChange(data.agent);
                            }

                            // Update message with final agent info and tool calls
                            setMessages(prev => prev.map(m =>
                                m.id === aiTempId ? {
                                    ...m,
                                    agent_name: data.agent.name,
                                    intent: data.agent.intent,
                                    metadata: {
                                        ...(m.metadata as any || {}), // Keep existing metadata like questions
                                        ...(data.toolCalls && data.toolCalls.length > 0 ? { toolCalls: data.toolCalls } : {})
                                    }
                                } : m
                            ));

                            // Handle Tool Calls - show toast notifications
                            if (data.toolCalls && data.toolCalls.length > 0) {
                                console.log('[useChat] Tool calls detected:', data.toolCalls);
                                data.toolCalls.forEach((toolCall: any) => {
                                    const toolName = toolCall.function?.name || toolCall.name;
                                    console.log('[useChat] Showing toast for tool:', toolName);
                                    showToolCallToast(toolName);
                                });

                                // Dispatch custom event for ChatPane to add drawer link buttons
                                window.dispatchEvent(new CustomEvent('tool-calls-executed', {
                                    detail: {
                                        toolCalls: data.toolCalls,
                                        messageId: aiTempId
                                    }
                                }));
                            }

                            // Handle Key Rotation Events
                            if (data.keyRotationEvent) {
                                console.log('[useChat] Key rotation event detected:', data.keyRotationEvent);
                                const event = data.keyRotationEvent;

                                if (event.type === 'key_failed') {
                                    console.log('[useChat] Calling showKeyFailureToast...');
                                    showKeyFailureToast(
                                        event.failedKeyIndex ?? 0,
                                        event.totalKeys ?? 1,
                                        event.message || 'Key exhausted'
                                    );
                                } else if (event.type === 'key_rotated') {
                                    console.log('[useChat] Calling showKeyRotationSuccessToast...');
                                    showKeyRotationSuccessToast(event.newKeyIndex ?? 0);
                                } else if (event.type === 'all_keys_exhausted') {
                                    console.log('[useChat] All keys exhausted!');
                                    // Could show a different toast or error state
                                    showKeyFailureToast(
                                        event.totalKeys ?? 1,
                                        event.totalKeys ?? 1,
                                        'All API keys exhausted'
                                    );
                                }
                            }
                        } else if (data.type === 'error') {
                            console.error('[useChat] Stream error:', data.message);
                            throw new Error(data.message);
                        }
                    } catch (e) {
                        console.error('[useChat] Error parsing stream chunk:', e, line);
                    }
                }
            }

            // Clear force agent after use
            setForceAgent(null);

        } catch (err: any) {
            console.error('[useChat] Send failed:', err)
            setError(err.message)
            // Remove optimistic message on error
            setMessages(prev => prev.filter(m => m.id !== tempId))
            // ponytail: Clear temp AI message ID if stream failed
            activeTempMessageIdRef.current = null;
        }
    }, [chatId, forceAgent, onAgentChange])

    return { messages, session, isLoading, error, sendMessage, setForceAgent, refreshMessages: loadMessages }
}
