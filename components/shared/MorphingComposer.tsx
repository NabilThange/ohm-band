"use client"

import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { XIcon } from "@/components/ui/animated-icons"
import { Send, Mic, Paperclip } from "lucide-react"
import { AnimatedTextarea } from "@/components/ui/animated-textarea"
import ComposerActionsPopover from "@/components/ai_chat/ComposerActionsPopover"
import { cn as cls } from "@/lib/utils"

interface MorphingComposerProps {
    value: string
    onChange: (value: string) => void
    onSubmit: () => void
    onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void
    placeholder?: string
    placeholderExamples?: string[]
    disabled?: boolean
    variant?: "landing" | "build" | "chat"
    showCommands?: boolean
    filteredCommands?: Array<{ command: string; description: string }>
    activeIndex?: number
    onSelectCommand?: (cmd: string) => void
    helpOpen?: boolean
    onHelpOpenChange?: (open: boolean) => void
    className?: string
}

const COMMANDS = [
    { command: "/update-context", description: "Refresh MVP, PRD, and Context from chat history" },
    { command: "/update-bom", description: "Regenerate the Bill of Materials from current design" },
    { command: "/recheck-wiring", description: "Validate and update wiring connections" },
    { command: "/update-code", description: "Regenerate code based on latest specifications" },
]

export const MorphingComposer = forwardRef<HTMLTextAreaElement, MorphingComposerProps>(
    (
        {
            value,
            onChange,
            onSubmit,
            onKeyDown,
            placeholder = "How can I help you today?",
            placeholderExamples,
            disabled = false,
            variant = "chat",
            showCommands = false,
            filteredCommands = [],
            activeIndex = 0,
            onSelectCommand,
            helpOpen = false,
            onHelpOpenChange,
            className,
        },
        ref
    ) => {
        const textareaRef = useRef<HTMLTextAreaElement>(null)

        useImperativeHandle(ref, () => textareaRef.current!, [])

        const handleContainerClick = () => {
            textareaRef.current?.focus()
        }

        const hasContent = value.trim().length > 0

        // Variant-specific styles
        const containerStyles = {
            landing: "bg-card border border-[#3e3e38] p-6 hover:border-primary",
            build: "bg-black/40 backdrop-blur-sm border border-[#3e3e38] p-6 hover:border-primary/50 focus-within:border-primary transition-all duration-300 shadow-[0_0_20px_rgba(0,0,0,0.3)] focus-within:shadow-[0_0_25px_rgba(255,170,0,0.05)]",
            chat: "border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-sm rounded-3xl",
        }

        return (
            <motion.div
                layoutId="main-composer"
                onClick={handleContainerClick}
                className={cls(
                    "w-full cursor-text transition-all max-w-4xl mx-auto rounded-lg relative",
                    containerStyles[variant],
                    className
                )}
                style={{
                    viewTransitionName: "composer-morph",
                } as any}
                transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 30,
                }}
            >
                {/* Command Menu */}
                <AnimatePresence>
                    {showCommands && filteredCommands.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            transition={{ duration: 0.15 }}
                            className="absolute w-72 overflow-hidden rounded-lg border shadow-xl z-50 bg-[#4a4a4a] border-[#6b6b6b]"
                            style={{
                                bottom: "100%",
                                left: variant === "chat" ? "1rem" : "1.5rem",
                                marginBottom: "0.5rem",
                            }}
                        >
                            <div className="p-1">
                                {filteredCommands.map((cmd, i) => (
                                    <button
                                        key={cmd.command}
                                        onClick={() => onSelectCommand?.(cmd.command)}
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
                                            onHelpOpenChange?.(true)
                                        }}
                                        className="text-[10px] text-white/80 hover:text-white underline cursor-pointer"
                                    >
                                        More about commands
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Help Modal */}
                <AnimatePresence>
                    {helpOpen && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[100] flex items-center justify-center bg-foreground/50 p-4"
                            onClick={() => onHelpOpenChange?.(false)}
                        >
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                className="w-full max-w-md rounded-xl bg-card p-6 shadow-2xl border border-border"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-semibold text-card-foreground">Command Guide</h3>
                                    <button
                                        onClick={() => onHelpOpenChange?.(false)}
                                        className="text-muted-foreground hover:text-foreground"
                                    >
                                        <XIcon size={20} />
                                    </button>
                                </div>
                                <div className="space-y-4">
                                    {COMMANDS.map((cmd) => (
                                        <div key={cmd.command} className="rounded-lg bg-muted p-3">
                                            <code className="text-sm font-bold text-foreground">{cmd.command}</code>
                                            <p className="mt-1 text-sm text-muted-foreground">{cmd.description}</p>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-6 flex justify-end">
                                    <button
                                        onClick={() => onHelpOpenChange?.(false)}
                                        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                                    >
                                        Got it
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Textarea */}
                <motion.div layout className={variant === "chat" ? "px-4 pt-4 pb-2" : "mb-6"}>
                    <AnimatedTextarea
                        ref={textareaRef}
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        onKeyDown={onKeyDown}
                        // Only pass static placeholder if no examples are provided, otherwise let AnimatedTextarea handle it
                        placeholder={placeholderExamples && placeholderExamples.length > 0 ? undefined : placeholder}
                        placeholderExamples={placeholderExamples}
                        className={cls(
                            "min-h-[60px]",
                            variant === "build" && "font-mono"
                        )}
                        rows={variant === "chat" ? 1 : 2}
                        style={variant === "build" ? { fontFamily: "JetBrains Mono, ui-monospace, monospace" } : undefined}
                    />
                </motion.div>

                {/* Bottom toolbar */}
                <motion.div
                    layout
                    className={cls(
                        "flex items-center justify-between",
                        variant === "chat" ? "px-3 pb-3" : ""
                    )}
                >
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
                            onSubmit()
                        }}
                        disabled={!hasContent || disabled}
                        className={cls(
                            "transition disabled:opacity-50 disabled:cursor-not-allowed",
                            variant === "chat"
                                ? cls(
                                    "inline-flex shrink-0 items-center justify-center rounded-full p-2.5",
                                    hasContent
                                        ? "bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
                                        : "bg-zinc-200 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-600"
                                )
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <Send size={18} />
                    </button>
                </motion.div>
            </motion.div>
        )
    }
)

MorphingComposer.displayName = "MorphingComposer"
