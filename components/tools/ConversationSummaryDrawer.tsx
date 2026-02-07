'use client'

import { Splitter } from '@ark-ui/react/splitter'
import { XIcon } from '@/components/ui/animated-icons'
import { Clock, MessageSquare, Cpu, FileCode, Zap } from 'lucide-react'
import { useState, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { supabase } from '@/lib/supabase/client'
import type { ConversationSummary } from '@/lib/agents/summarizer'

interface ConversationSummaryDrawerProps {
    isOpen: boolean
    onClose: () => void
    chatId: string | null
}

export default function ConversationSummaryDrawer({
    isOpen,
    onClose,
    chatId
}: ConversationSummaryDrawerProps) {
    const [summary, setSummary] = useState<ConversationSummary | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Fetch summary on mount and when chatId changes
    useEffect(() => {
        if (!chatId || !isOpen) return

        const fetchSummary = async () => {
            try {
                setLoading(true)
                setError(null)

                // Get the summary artifact
                const { data: artifact } = await supabase
                    .from('artifacts')
                    .select('id, current_version')
                    .eq('chat_id', chatId)
                    .eq('type', 'conversation_summary')
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .single()

                if (!artifact) {
                    // No summary yet - show empty state
                    setSummary({
                        summary: 'No summary available yet. Summaries are generated automatically every 5 messages.',
                        lastProcessedMessageId: null,
                        lastProcessedSequenceNumber: 0,
                        messageCount: 0,
                        projectSnapshot: {
                            components: [],
                            decisions: [],
                            codeFiles: [],
                            openQuestions: []
                        },
                        updatedAt: new Date().toISOString()
                    })
                    setLoading(false)
                    return
                }

                // Get latest version
                const { data: version, error: versionError } = await supabase
                    .from('artifact_versions')
                    .select('content')
                    .eq('artifact_id', artifact.id)
                    .order('version_number', { ascending: false })
                    .limit(1)
                    .single()

                if (versionError) throw versionError

                // Parse JSON content - it's stored as JSONB
                if (version?.content) {
                    setSummary(version.content as unknown as ConversationSummary)
                }
                setLoading(false)
            } catch (err) {
                console.error('[SummaryDrawer] Failed to fetch summary:', err)
                setError('Failed to load conversation summary')
                setLoading(false)
            }
        }

        fetchSummary()

        // Subscribe to real-time updates
        if (!chatId) return

        const channel = supabase
            .channel(`summary:${chatId}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'artifact_versions',
                filter: `artifact_id=eq.${chatId}` // This needs to be the artifact ID, not chat ID
            }, (payload) => {
                console.log('[SummaryDrawer] Real-time update:', payload)
                if (payload.new && 'content' in payload.new) {
                    setSummary(payload.new.content as ConversationSummary)
                }
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [chatId, isOpen])

    // Close on Escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose()
            }
        }
        window.addEventListener('keydown', handleEscape)
        return () => window.removeEventListener('keydown', handleEscape)
    }, [isOpen, onClose])

    if (!isOpen) return null

    const formatTimestamp = (timestamp: string) => {
        const date = new Date(timestamp)
        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
        })
    }

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] animate-in fade-in duration-200"
                onClick={onClose}
            />

            {/* Resizable Drawer */}
            <div className="fixed inset-0 z-[70] pointer-events-none">
                <Splitter.Root
                    className="h-full w-full pointer-events-none"
                    panels={[
                        { id: 'main', minSize: 30 },
                        { id: 'drawer', minSize: 30, maxSize: 70 }
                    ]}
                    defaultSize={[40, 60]}
                >
                    {/* Main content area (invisible) */}
                    <Splitter.Panel id="main" className="pointer-events-none" />

                    {/* Resize Trigger */}
                    <Splitter.ResizeTrigger
                        id="main:drawer"
                        aria-label="Resize drawer"
                        className="w-1 bg-border hover:bg-primary transition-colors cursor-col-resize relative pointer-events-auto"
                    >
                        <div className="absolute inset-y-0 -left-2 -right-2" />
                    </Splitter.ResizeTrigger>

                    {/* Drawer Panel */}
                    <Splitter.Panel
                        id="drawer"
                        className="h-full bg-background border-l border-border shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 pointer-events-auto"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between border-b border-border px-6 py-4 shrink-0">
                            <div className="space-y-1">
                                <h2 className="text-lg font-semibold leading-none flex items-center gap-2">
                                    📝 Conversation Summary
                                </h2>
                                <p className="text-sm text-muted-foreground">
                                    Auto-generated project context and progress tracking
                                </p>
                            </div>
                            <button
                                onClick={onClose}
                                className="h-8 w-8 inline-flex items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                            >
                                <XIcon size={16} />
                                <span className="sr-only">Close</span>
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-6">
                            {loading ? (
                                <div className="flex items-center justify-center h-full">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                                </div>
                            ) : error ? (
                                <div className="flex items-center justify-center h-full">
                                    <div className="text-center space-y-2">
                                        <p className="text-muted-foreground">{error}</p>
                                        <button
                                            onClick={() => window.location.reload()}
                                            className="text-sm text-primary hover:underline"
                                        >
                                            Retry
                                        </button>
                                    </div>
                                </div>
                            ) : summary ? (
                                <div className="space-y-6">
                                    {/* Status Bar */}
                                    <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg border border-border">
                                        <div className="flex items-center gap-2">
                                            <MessageSquare className="w-4 h-4 text-primary" />
                                            <span className="text-sm font-medium">
                                                {summary.messageCount} messages
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Clock className="w-4 h-4 text-muted-foreground" />
                                            <span className="text-xs text-muted-foreground">
                                                Updated {formatTimestamp(summary.updatedAt)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Main Summary */}
                                    <div className="prose prose-sm dark:prose-invert max-w-none">
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                            {summary.summary}
                                        </ReactMarkdown>
                                    </div>

                                    {/* Project Snapshot */}
                                    {summary.projectSnapshot && (
                                        <div className="space-y-4 pt-4 border-t border-border">
                                            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                                                Quick Snapshot
                                            </h3>

                                            {/* Components */}
                                            {summary.projectSnapshot.components.length > 0 && (
                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-2 text-sm font-medium">
                                                        <Cpu className="w-4 h-4 text-blue-500" />
                                                        Components
                                                    </div>
                                                    <div className="flex flex-wrap gap-2">
                                                        {summary.projectSnapshot.components.map((comp, idx) => (
                                                            <span
                                                                key={idx}
                                                                className="px-2 py-1 bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs rounded-md border border-blue-500/20"
                                                            >
                                                                {comp}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Code Files */}
                                            {summary.projectSnapshot.codeFiles.length > 0 && (
                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-2 text-sm font-medium">
                                                        <FileCode className="w-4 h-4 text-green-500" />
                                                        Code Files
                                                    </div>
                                                    <div className="flex flex-wrap gap-2">
                                                        {summary.projectSnapshot.codeFiles.map((file, idx) => (
                                                            <span
                                                                key={idx}
                                                                className="px-2 py-1 bg-green-500/10 text-green-600 dark:text-green-400 text-xs rounded-md border border-green-500/20 font-mono"
                                                            >
                                                                {file}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Open Questions */}
                                            {summary.projectSnapshot.openQuestions.length > 0 && (
                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-2 text-sm font-medium">
                                                        <Zap className="w-4 h-4 text-amber-500" />
                                                        Open Questions
                                                    </div>
                                                    <ul className="space-y-1 text-sm text-muted-foreground">
                                                        {summary.projectSnapshot.openQuestions.map((q, idx) => (
                                                            <li key={idx} className="flex items-start gap-2">
                                                                <span className="text-amber-500 mt-0.5">•</span>
                                                                <span>{q}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Empty state hint */}
                                    {summary.messageCount === 0 && (
                                        <div className="text-center p-8 text-muted-foreground text-sm">
                                            Summaries are generated automatically every 5 messages.
                                            <br />
                                            Keep chatting to build your project context!
                                        </div>
                                    )}
                                </div>
                            ) : null}
                        </div>
                    </Splitter.Panel>
                </Splitter.Root>
            </div>
        </>
    )
}
