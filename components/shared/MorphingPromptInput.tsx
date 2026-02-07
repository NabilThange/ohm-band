"use client"

import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { XIcon } from '@/components/ui/animated-icons'
import { Mic, Paperclip, Send } from 'lucide-react'
import { AnimatedTextarea } from '@/components/ui/animated-textarea'
import ComposerActionsPopover from '@/components/ai_chat/ComposerActionsPopover'
import { cn as cls } from '@/lib/utils'

const COMMANDS = [
    { command: "/update-context", description: "Refresh MVP, PRD, and Context from chat history", icon: "📝" },
    { command: "/update-bom", description: "Regenerate the Bill of Materials from current design", icon: "📊" },
    { command: "/recheck-wiring", description: "Validate and update wiring connections", icon: "🔌" },
    { command: "/update-code", description: "Regenerate code based on latest specifications", icon: "💻" },
]

const PLACEHOLDER_EXAMPLES = [
    "I want to build a smart weather station with ESP32 and e-ink display.",
    "Create a gesture-controlled lamp with proximity sensors and RGB LEDs.",
    "Design an automated plant watering system with soil moisture sensors.",
    "Build a wireless temperature monitor for my home brewery.",
]

export function MorphingPromptInput() {
    const pathname = usePathname()
    const router = useRouter()
    const [message, setMessage] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [showCommands, setShowCommands] = useState(false)
    const [filteredCommands, setFilteredCommands] = useState(COMMANDS)
    const [activeIndex, setActiveIndex] = useState(0)
    const [helpOpen, setHelpOpen] = useState(false)
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    // Determine which mode we're in
    const isLanding = pathname === '/'
    const isBuild = pathname === '/build'
    const isChat = pathname.startsWith('/build/') && pathname !== '/build'

    // Hero mode = Landing or Build page
    const isHeroMode = isLanding || isBuild

    // Filter commands when user types
    useEffect(() => {
        const isCommand = message.trim().startsWith("/")
        if (isCommand && isChat) {
            const filtered = COMMANDS.filter(c =>
                c.command.toLowerCase().startsWith(message.trim().toLowerCase())
            )
            setFilteredCommands(filtered)
            setShowCommands(filtered.length > 0)
        } else {
            setShowCommands(false)
        }
        setActiveIndex(0)
    }, [message, isChat])

    // Get position styles based on route
    const getPositionStyles = () => {
        if (isLanding) {
            // Landing: Looks like it's in the hero section (absolute positioning)
            return {
                position: 'absolute' as const,
                bottom: '2rem',
                left: '50%',
                transform: 'translateX(-50%)',
                width: 'min(700px, 92vw)', // Increased width
            }
        }
        if (isBuild) {
            // Build: Looks like it's centered in page (absolute positioning)
            return {
                position: 'absolute' as const,
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: 'min(750px, 92vw)', // Increased width
            }
        }
        // Chat: Fixed at bottom, inside the footer area
        return {
            position: 'fixed' as const,
            bottom: '0',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '100%',
            maxWidth: '100%',
        }
    }

    // Handle submit
    const handleSubmit = async () => {
        if (!message.trim() || isSubmitting) return

        setIsSubmitting(true)
        const userMessage = message.trim()

        if (isLanding || isBuild) {
            // Generate proper UUID for chat ID
            const chatId = crypto.randomUUID()

            // Clear input immediately for better UX
            setMessage('')

            // 🚀 NAVIGATE IMMEDIATELY with the message
            // The chat page will create the session and send to AI
            router.push(`/build/${chatId}?initialPrompt=${encodeURIComponent(userMessage)}`)

            setIsSubmitting(false)
        } else {
            // Chat mode - send message
            // TODO: Send message to your backend/AI
            console.log('Sending message:', userMessage)
            setMessage('')
            setIsSubmitting(false)
        }
    }

    const selectCommand = (cmd: string) => {
        setMessage(cmd + " ")
        setShowCommands(false)
        textareaRef.current?.focus()
    }

    // Handle keyboard shortcuts
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (showCommands) {
            if (e.key === "ArrowDown") {
                e.preventDefault()
                setActiveIndex(i => (i + 1) % filteredCommands.length)
                return
            }
            if (e.key === "ArrowUp") {
                e.preventDefault()
                setActiveIndex(i => (i - 1 + filteredCommands.length) % filteredCommands.length)
                return
            }
            if (e.key === "Tab" || e.key === "Enter") {
                e.preventDefault()
                selectCommand(filteredCommands[activeIndex].command)
                return
            }
            if (e.key === "Escape") {
                e.preventDefault()
                setShowCommands(false)
                return
            }
        }

        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSubmit()
        }
    }

    // Don't show on marketplace or login pages
    if (pathname.startsWith('/marketplace') || pathname.startsWith('/login')) {
        return null
    }

    return (
        <>
            {/* Commands Popover - Only in Chat mode */}
            {showCommands && isChat && (
                <div
                    className="fixed z-[60] w-72 overflow-hidden rounded-lg border shadow-xl animate-in fade-in zoom-in-95 bg-[#4a4a4a] border-[#6b6b6b]"
                    style={{
                        bottom: 'calc(1.5rem + 120px)',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        transition: 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    }}
                >
                    <div className="p-1">
                        {filteredCommands.map((cmd, i) => (
                            <button
                                key={cmd.command}
                                onClick={() => selectCommand(cmd.command)}
                                className={cls(
                                    "flex w-full items-center gap-3 px-3 py-2 text-left text-sm rounded-md transition-colors",
                                    i === activeIndex
                                        ? "bg-white/20 text-white"
                                        : "hover:bg-white/10 text-white/90"
                                )}
                            >
                                <span className="text-xl">{cmd.icon}</span>
                                <div className="flex-1">
                                    <div className="font-semibold">{cmd.command}</div>
                                    <div className="text-xs text-white/70">{cmd.description}</div>
                                </div>
                            </button>
                        ))}
                        <div className="mt-1 border-t border-white/20 pt-1 text-right px-2">
                            <button
                                onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    setHelpOpen(true)
                                    setShowCommands(false)
                                }}
                                className="text-[10px] text-white/80 hover:text-white underline cursor-pointer"
                            >
                                More about commands
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Help Modal */}
            {helpOpen && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-foreground/50 p-4 animate-in fade-in"
                    onClick={() => setHelpOpen(false)}
                >
                    <div
                        className="w-full max-w-md rounded-xl bg-card p-6 shadow-2xl border border-border"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-card-foreground">Command Guide</h3>
                            <button onClick={() => setHelpOpen(false)} className="text-muted-foreground hover:text-foreground">
                                <XIcon size={20} />
                            </button>
                        </div>
                        <div className="space-y-4">
                            {COMMANDS.map(cmd => (
                                <div key={cmd.command} className="rounded-lg bg-muted p-3">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-lg">{cmd.icon}</span>
                                        <code className="text-sm font-bold text-foreground">{cmd.command}</code>
                                    </div>
                                    <p className="text-sm text-muted-foreground">{cmd.description}</p>
                                </div>
                            ))}
                        </div>
                        <div className="mt-6 flex justify-end">
                            <button
                                onClick={() => setHelpOpen(false)}
                                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                            >
                                Got it
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* The Morphing Textarea */}
            <div
                style={{
                    ...getPositionStyles(),
                    transition: 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    zIndex: 40,
                }}
            >
                {isChat ? (
                    // Chat mode: Full width footer container
                    <div className="w-full bg-background border-t border-border">
                        <div className="mx-auto max-w-3xl px-4 py-4">
                            <div className="relative bg-card border border-[#3e3e38] rounded-lg hover:border-primary focus-within:border-primary transition-colors pointer-events-auto p-4"
                                style={{ borderWidth: '1px' }}
                            >
                                <div className="flex flex-col">
                                    <AnimatedTextarea
                                        ref={textareaRef}
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        placeholderExamples={["Send a message... (Press / for commands)"]}
                                        typeSpeed={50}
                                        deleteSpeed={30}
                                        pauseDelay={2000}
                                        rows={1}
                                        className="w-full bg-transparent text-foreground placeholder:text-muted-foreground text-sm font-mono resize-none outline-none border-none focus:outline-none focus:ring-0 mb-3 min-h-[56px] px-2"
                                        disabled={isSubmitting}
                                    />
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <ComposerActionsPopover>
                                                <button
                                                    className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors"
                                                    title="Attach files"
                                                    disabled={isSubmitting}
                                                >
                                                    <Paperclip className="w-5 h-5" />
                                                </button>
                                            </ComposerActionsPopover>
                                            <button
                                                className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors"
                                                title="Voice input"
                                                disabled={isSubmitting}
                                            >
                                                <Mic className="w-5 h-5" />
                                            </button>
                                        </div>
                                        <button
                                            onClick={handleSubmit}
                                            disabled={!message.trim() || isSubmitting}
                                            className={cls(
                                                "rounded-xl px-4 py-2 transition-colors font-medium inline-flex items-center gap-2",
                                                message.trim() && !isSubmitting
                                                    ? "bg-primary hover:bg-primary/90 text-primary-foreground"
                                                    : "bg-muted text-muted-foreground cursor-not-allowed"
                                            )}
                                        >
                                            {isSubmitting ? (
                                                <>
                                                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                    Sending...
                                                </>
                                            ) : (
                                                <>
                                                    <Send className="w-4 h-4" />
                                                    Send
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="mx-auto max-w-3xl px-4 pb-4 text-center text-[11px] text-muted-foreground">

                        </div>
                    </div>
                ) : (
                    // Hero mode (Landing/Build)
                    <div className="relative bg-card border border-[#3e3e38] rounded-lg shadow-2xl hover:border-primary focus-within:border-primary transition-colors pointer-events-auto p-4"
                        style={{ borderWidth: '1px' }}
                    >
                        {isHeroMode ? (
                            // Hero Mode (Build page) - Use AnimatedTextarea
                            <div className="p-3">
                                <AnimatedTextarea
                                    ref={textareaRef}
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholderExamples={PLACEHOLDER_EXAMPLES}
                                    typeSpeed={50}
                                    deleteSpeed={30}
                                    pauseDelay={2000}
                                    rows={1}
                                    className="w-full bg-transparent text-foreground placeholder:text-muted-foreground text-sm font-mono resize-none outline-none border-none focus:outline-none focus:ring-0 mb-3 min-h-[32px]"
                                    disabled={isSubmitting}
                                />
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <ComposerActionsPopover>
                                            <button
                                                type="button"
                                                className="text-muted-foreground hover:text-foreground transition"
                                                disabled={isSubmitting}
                                            >
                                                <Paperclip size={16} />
                                            </button>
                                        </ComposerActionsPopover>
                                        <button
                                            type="button"
                                            className="text-muted-foreground hover:text-foreground transition"
                                            disabled={isSubmitting}
                                        >
                                            <Mic size={16} />
                                        </button>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleSubmit}
                                        disabled={!message.trim() || isSubmitting}
                                        className={cls(
                                            "rounded-lg px-4 py-1.5 transition-colors font-medium inline-flex items-center gap-2 text-sm",
                                            message.trim() && !isSubmitting
                                                ? "bg-primary hover:bg-primary/90 text-primary-foreground"
                                                : "bg-muted text-muted-foreground cursor-not-allowed"
                                        )}
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Creating...
                                            </>
                                        ) : (
                                            'Create'
                                        )}
                                    </button>
                                </div>

                            </div>
                        ) : null}
                    </div>
                )}
            </div>
        </>
    )
}
