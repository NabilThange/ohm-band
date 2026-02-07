"use client"

import { useRef, useState, forwardRef, useImperativeHandle, useEffect } from "react"
import { flushSync } from "react-dom"
import { XIcon } from "@/components/ui/animated-icons"
import { Send, Loader2, Plus, Mic, Paperclip } from "lucide-react"
import ComposerActionsPopover from "./ComposerActionsPopover"
import { cn as cls } from "@/lib/utils"

import { motion } from "framer-motion"

const COMMANDS = [
    { command: "/update-context", description: "Refresh MVP, PRD, and Context from chat history" },
    { command: "/update-bom", description: "Regenerate the Bill of Materials from current design" },
    { command: "/recheck-wiring", description: "Validate and update wiring connections" },
    { command: "/update-code", description: "Regenerate code based on latest specifications" },
]

const PLACEHOLDER_EXAMPLES = [
    "I want to build a smart weather station with ESP32 and e-ink display.",
    "Create a gesture-controlled lamp with proximity sensors and RGB LEDs.",
    "Design an automated plant watering system with soil moisture sensors.",
    "Build a wireless temperature monitor for my home brewery.",
]

const Composer = forwardRef(function Composer({ onSend, busy }, ref) {
    const [value, setValue] = useState("")
    const [sending, setSending] = useState(false)
    const [showCommands, setShowCommands] = useState(false)
    const [helpOpen, setHelpOpen] = useState(false)
    const [activeIndex, setActiveIndex] = useState(0)
    const inputRef = useRef(null)

    const filteredCommands = COMMANDS.filter(c =>
        c.command.toLowerCase().startsWith(value.trim().toLowerCase())
    )

    useEffect(() => {
        const isCommand = value.trim().startsWith("/")
        if (isCommand && filteredCommands.length > 0) {
            setShowCommands(true)
        } else {
            setShowCommands(false)
        }
        setActiveIndex(0)
    }, [value])

    useImperativeHandle(
        ref,
        () => ({
            insertTemplate: (templateContent) => {
                setValue((prev) => {
                    const newValue = prev ? `${prev}\n\n${templateContent}` : templateContent
                    setTimeout(() => {
                        inputRef.current?.focus()
                        const length = newValue.length
                        inputRef.current?.setSelectionRange(length, length)
                    }, 0)
                    return newValue
                })
            },
            focus: () => {
                inputRef.current?.focus()
            },
        }),
        [],
    )

    async function handleSend() {
        if (!value.trim() || sending) return

        // Capture the message before clearing
        const messageToSend = value.trim()

        // Clear input IMMEDIATELY for better UX (before async operations)
        flushSync(() => {
            setValue("")
        })

        // Ensure the textarea DOM element is also cleared (fallback)
        if (inputRef.current) {
            inputRef.current.value = ''
        }

        setSending(true)

        try {
            // Call onSend AFTER clearing the input
            await onSend?.(messageToSend)
            inputRef.current?.focus()
        } catch (err) {
            console.error('Composer handleSend error:', err)
            // Don't restore text on error - user can use undo or retype
        } finally {
            setSending(false)
        }
    }

    const selectCommand = (cmd) => {
        setValue(cmd + " ")
        setShowCommands(false)
        inputRef.current?.focus()
    }

    const hasContent = value.trim().length > 0

    // Handle keyboard shortcuts
    const handleKeyDown = (e) => {
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

        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    // Handle container click to focus textarea
    const handleContainerClick = () => {
        inputRef.current?.focus()
    }

    return (
        <div className="border-t border-border bg-background p-4">
            <motion.div
                layoutId="main-composer"
                layout
                transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 30,
                }}
                onClick={handleContainerClick}
                className="bg-card border border-[#3e3e38] p-3 mb-2 w-full cursor-text hover:border-primary transition-all max-w-4xl mx-auto rounded-lg relative"
            >
                {/* Command Menu */}
                {showCommands && (
                    <div
                        className="absolute w-72 overflow-hidden rounded-lg border shadow-xl animate-in fade-in zoom-in-95 z-50 transition-all duration-75 bg-[#4a4a4a] border-[#6b6b6b]"
                        style={{
                            bottom: '100%',
                            left: '1.5rem',
                            marginBottom: '0.5rem',
                        }}
                    >
                        <div className="p-1">
                            {filteredCommands.map((cmd, i) => (
                                <button
                                    key={cmd.command}
                                    onClick={() => selectCommand(cmd.command)}
                                    className={cls(
                                        "flex w-full flex-col px-3 py-2 text-left text-sm rounded-md transition-colors",
                                        i === activeIndex
                                            ? "bg-white/20 text-white"
                                            : "hover:bg-white/10 text-white/90"
                                    )}
                                >
                                    <span className="font-semibold">{cmd.command}</span>
                                    <span className="text-xs text-white/70">{cmd.description}</span>
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
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-foreground/50 p-4 animate-in fade-in" onClick={() => setHelpOpen(false)}>
                        <div className="w-full max-w-md rounded-xl bg-card p-6 shadow-2xl border border-border" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-card-foreground">Command Guide</h3>
                                <button onClick={() => setHelpOpen(false)} className="text-muted-foreground hover:text-foreground">
                                    <XIcon size={20} />
                                </button>
                            </div>
                            <div className="space-y-4">
                                {COMMANDS.map(cmd => (
                                    <div key={cmd.command} className="rounded-lg bg-muted p-3">
                                        <code className="text-sm font-bold text-foreground">{cmd.command}</code>
                                        <p className="mt-1 text-sm text-muted-foreground">{cmd.description}</p>
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

                <textarea
                    ref={inputRef}
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask Ohm anything..."
                    className="w-full mb-2 min-h-[40px] text-sm font-mono placeholder:text-muted-foreground bg-transparent border-none outline-none focus:ring-0 resize-none"
                    rows={1}
                />

                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <ComposerActionsPopover>
                            <button
                                type="button"
                                className="text-muted-foreground hover:text-foreground transition"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <Paperclip size={18} />
                            </button>
                        </ComposerActionsPopover>
                        <button
                            type="button"
                            className="text-muted-foreground hover:text-foreground transition"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <Mic size={18} />
                        </button>
                    </div>
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation()
                            handleSend()
                        }}
                        disabled={sending || busy || !hasContent}
                        className="text-muted-foreground hover:text-foreground transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {sending || busy ? (
                            <Loader2 className="h-[18px] w-[18px] animate-spin" />
                        ) : (
                            <Send size={18} />
                        )}
                    </button>
                </div>
            </motion.div>

            {/* Footer text */}
            <div className="px-1 text-center text-[11px] text-muted-foreground">

            </div>
        </div >
    )
})

export default Composer
