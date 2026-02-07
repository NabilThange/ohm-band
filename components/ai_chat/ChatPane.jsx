"use client"

import { useState, forwardRef, useImperativeHandle, useRef, useEffect } from "react"
import { CheckIcon, RefreshCwIcon, XIcon } from "@/components/ui/animated-icons"
import { Pencil } from "lucide-react"
import Message from "./Message"
import { cn as cls, timeAgo } from "@/lib/utils"
import { useChat } from "@/lib/hooks/use-chat"
import { ChatService } from "@/lib/db/chat"
import { ChatPromptInput } from "@/components/shared/ChatPromptInput"

import OhmLoadingAnimation from "../ui/ohm-loading"

const ChatPane = forwardRef(function ChatPane(
    { chatId, onChatCreated, initialPrompt, chat, messages = [], isLoading = false, sendMessage }, // Added props
    ref,
) {
    // Hook Integration REMOVED - using props from parent
    // const { messages, isLoading, sendMessage: hookSendMessage } = useChat(chatId)

    const [editingId, setEditingId] = useState(null)
    const [busy, setBusy] = useState(false)
    const messagesEndRef = useRef(null)

    useImperativeHandle(
        ref,
        () => ({
            insertTemplate: (templateContent) => {
                // Template insertion is now handled by MorphingPromptInput
                // This is kept for backwards compatibility but does nothing
                console.log('Template insertion:', templateContent)
            },
        }),
        [],
    )

    // Handle sending (Create chat if needed)
    async function handleSend(content) {
        setBusy(true)
        try {
            let finalContent = content;

            // Intercept Slash Commands
            if (content.trim().startsWith("/update-context")) {
                finalContent = `SYSTEM_COMMAND: Please review the entire conversation history and REGENERATE the updated Project Context, MVP, and PRD based on the latest discussions. 
IMPORTANT: You MUST wrap your response in the standard artifact tags so the system can parse them:

CONTEXT_START
[Updated Context]
CONTEXT_END

MVP_START
[Updated MVP]
MVP_END

PRD_START
[Updated PRD]
PRD_END

Reflect any changes made during the chat in these documents.`;
            }

            if (!chatId) {
                // Create new chat first
                const newChat = await ChatService.createChat("00000000-0000-0000-0000-000000000000", content.slice(0, 30))

                // Send initial message BEFORE notifying parent, to avoid aborting fetch on navigation
                await fetch('/api/agents/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message: finalContent, chatId: newChat.id })
                })

                // Now update parent-selected chat (may trigger router.push in AIAssistantUI)
                onChatCreated?.(newChat.id)
            } else {
                await sendMessage(finalContent)
            }
        } catch (e) {
            console.error(e)
        } finally {
            setBusy(false)
            setTimeout(scrollToBottom, 100)
        }
    }

    // Auto-scroll on new messages
    useEffect(() => {
        console.log('[ChatPane] 📬 Messages updated:', messages.length, 'messages')
        if (messages.length > 0) {
            console.log('[ChatPane] 📝 Messages:', messages.map(m => ({ role: m.role, content: m.content?.substring(0, 30), id: m.id })))
        }
        scrollToBottom()
    }, [messages])

    // Auto-scroll function
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
    }

    return (
        <div className="flex h-full min-h-0 flex-1 flex-col">
            <div className="flex-1 space-y-5 overflow-y-auto px-4 py-6 pb-32">
                <div className="w-full mx-auto" style={{ maxWidth: '800px' }}>
                    <div className="mb-2 text-3xl font-serif tracking-tight sm:text-4xl md:text-5xl">
                        <span className="block leading-[1.05] font-sans text-2xl">{chat?.title || "New Project"}</span>
                    </div>
                    {/* 
                <div className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">
                    Updated {timeAgo(conversation.updatedAt)} · {count} messages
                </div>
                */}

                    <div className="mb-6 flex flex-wrap gap-2 border-b border-border pb-5">
                        {/* Tags could be passed as prop or fetched */}
                    </div>

                    {/* Combined Messages: Initial Prompt (if not yet in DB) + DB Messages */}
                    {(() => {
                        // Check if initialPrompt is already in messages
                        const hasInitial = initialPrompt && initialPrompt !== "New Project" &&
                            messages.some(m => m.content === initialPrompt && m.role === 'user');

                        const showFakeInitial = initialPrompt && initialPrompt !== "New Project" && !hasInitial;

                        // Always render the message container - never unmount
                        return (
                            <>
                                {messages.length === 0 && !showFakeInitial && (
                                    <div className="rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">
                                        {isLoading ? "Loading history..." : "No messages yet. Say hello to start."}
                                    </div>
                                )}

                                {showFakeInitial && (
                                    <div className="space-y-2 fade-in">
                                        <Message role="user">{initialPrompt}</Message>
                                    </div>
                                )}

                                {messages.map((m) => (
                                    <div key={m.id} className="space-y-2">
                                        <Message role={m.role} metadata={{ agent_name: m.agent_name, agentId: m.agent_id, ...m.metadata }}>
                                            {m.content}
                                        </Message>
                                    </div>
                                ))}
                            </>
                        )
                    })()}

                    {/* Scroll anchor */}
                    {(busy || isLoading || (messages.length === 0 && initialPrompt)) && <OhmLoadingAnimation />}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* Chat Input - now part of layout flow */}
            <ChatPromptInput onSendMessage={handleSend} isLoading={busy || isLoading} />
        </div >
    )
})

export default ChatPane
