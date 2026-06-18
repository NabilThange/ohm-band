"use client"

export const dynamic = 'force-dynamic'

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useChatList } from "@/lib/hooks/use-chat-list"
import { Clock, MessageSquare, ChevronRight, Loader2, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"

// Default/System user ID for MVP
const DEFAULT_USER_ID = "00000000-0000-0000-0000-000000000000"

export default function ChatsPage() {
    const router = useRouter()
    const { chats, isLoading } = useChatList(DEFAULT_USER_ID)
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    const handleChatClick = (chatId: string) => {
        router.push(`/build/${chatId}`)
    }

    const handleNewChat = () => {
        router.push('/build')
    }

    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        const now = new Date()
        const diffMs = now.getTime() - date.getTime()
        const diffMins = Math.floor(diffMs / 60000)
        const diffHours = Math.floor(diffMs / 3600000)
        const diffDays = Math.floor(diffMs / 86400000)

        if (diffMins < 1) return "Just now"
        if (diffMins < 60) return `${diffMins}m ago`
        if (diffHours < 24) return `${diffHours}h ago`
        if (diffDays < 7) return `${diffDays}d ago`
        
        return date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric',
            year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
        })
    }

    if (!mounted) {
        return null
    }

    return (
        <div className="min-h-screen bg-background">
            {/* New Chat Button - Top Right */}
            <div className="fixed top-6 right-6 z-20">
                <Button
                    onClick={handleNewChat}
                    className="rounded-lg shadow-md"
                    size="sm"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    New Chat
                </Button>
            </div>

            <div className="container mx-auto px-6 py-12 max-w-4xl">
                {/* Header */}
                <div className="mb-12">
                    <h1 className="text-4xl font-bold text-foreground mb-2 tracking-tight">
                        Recent Chats
                    </h1>
                    <p className="text-muted-foreground">
                        View and manage all your hardware project conversations
                    </p>
                </div>

                {/* Loading State */}
                {isLoading && (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                )}

                {/* Empty State */}
                {!isLoading && chats.length === 0 && (
                    <div className="bg-card border border-border rounded-lg shadow-sm p-12 text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                            <MessageSquare className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-xl font-semibold text-foreground mb-2">
                            No conversations yet
                        </h3>
                        <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                            Start your first hardware project conversation to get started with Ohm
                        </p>
                        <Button
                            onClick={handleNewChat}
                            className="rounded-lg"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Create New Chat
                        </Button>
                    </div>
                )}

                {/* Chat List */}
                {!isLoading && chats.length > 0 && (
                    <div className="space-y-3">
                        {chats.map((chat) => (
                            <div
                                key={chat.id}
                                onClick={() => handleChatClick(chat.id)}
                                className="bg-card border border-border rounded-lg shadow-sm p-5 hover:shadow-md hover:border-primary/50 transition-all cursor-pointer group"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-lg font-semibold text-foreground mb-2 truncate group-hover:text-primary transition-colors">
                                            {chat.title || "Untitled Project"}
                                        </h3>
                                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                            <span className="flex items-center gap-1.5">
                                                <Clock className="h-4 w-4" />
                                                {formatDate(chat.last_message_at || chat.created_at)}
                                            </span>
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono bg-muted text-muted-foreground">
                                                {chat.id.slice(0, 8)}
                                            </span>
                                        </div>
                                    </div>
                                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0 mt-0.5" />
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Footer Stats */}
                {!isLoading && chats.length > 0 && (
                    <div className="mt-8 pt-8 border-t border-border text-center text-sm text-muted-foreground">
                        Showing {chats.length} conversation{chats.length !== 1 ? 's' : ''}
                    </div>
                )}
            </div>
        </div>
    )
}
