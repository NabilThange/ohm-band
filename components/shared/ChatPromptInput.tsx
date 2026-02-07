'use client';

import { useState, useEffect, useRef } from 'react';
import { XIcon } from '@/components/ui/animated-icons'
import { Mic, Paperclip, Send } from 'lucide-react';
import ComposerActionsPopover from '@/components/ai_chat/ComposerActionsPopover';
import { cn as cls } from '@/lib/utils';

const COMMANDS = [
    { command: "/update-context", description: "Refresh MVP, PRD, and Context from chat history", icon: "📝" },
    { command: "/update-bom", description: "Regenerate the Bill of Materials from current design", icon: "📊" },
    { command: "/recheck-wiring", description: "Validate and update wiring connections", icon: "🔌" },
    { command: "/update-code", description: "Regenerate code based on latest specifications", icon: "💻" },
];

const PLACEHOLDER_OPTIONS = [
    "Enter / for commands",
    "Reply...",
    "Type your message...",
    "Send a message...",
    "What would you like to build?",
];

// Function to get a random placeholder
const getRandomPlaceholder = () => {
    return PLACEHOLDER_OPTIONS[Math.floor(Math.random() * PLACEHOLDER_OPTIONS.length)];
};

interface ChatPromptInputProps {
    onSendMessage: (message: string) => void;
    isLoading?: boolean;
}

export function ChatPromptInput({ onSendMessage, isLoading = false }: ChatPromptInputProps) {
    const [message, setMessage] = useState('');
    const [showCommands, setShowCommands] = useState(false);
    const [filteredCommands, setFilteredCommands] = useState(COMMANDS);
    const [activeIndex, setActiveIndex] = useState(0);
    const [helpOpen, setHelpOpen] = useState(false);
    const [placeholder, setPlaceholder] = useState(getRandomPlaceholder());
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Filter commands when user types
    useEffect(() => {
        const isCommand = message.trim().startsWith("/");
        if (isCommand) {
            const filtered = COMMANDS.filter(c =>
                c.command.toLowerCase().startsWith(message.trim().toLowerCase())
            );
            setFilteredCommands(filtered);
            setShowCommands(filtered.length > 0);
        } else {
            setShowCommands(false);
        }
        setActiveIndex(0);
    }, [message]);

    const handleSubmit = async () => {
        if (!message.trim() || isLoading) return;

        const userMessage = message.trim();
        setMessage('');
        onSendMessage(userMessage);
    };

    const selectCommand = (cmd: string) => {
        setMessage(cmd + " ");
        setShowCommands(false);
        textareaRef.current?.focus();
    };

    const handleFocus = () => {
        setPlaceholder(getRandomPlaceholder());
    };

    const handleBlur = () => {
        setPlaceholder(getRandomPlaceholder());
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (showCommands) {
            if (e.key === "ArrowDown") {
                e.preventDefault();
                setActiveIndex(i => (i + 1) % filteredCommands.length);
                return;
            }
            if (e.key === "ArrowUp") {
                e.preventDefault();
                setActiveIndex(i => (i - 1 + filteredCommands.length) % filteredCommands.length);
                return;
            }
            if (e.key === "Tab" || e.key === "Enter") {
                e.preventDefault();
                selectCommand(filteredCommands[activeIndex].command);
                return;
            }
            if (e.key === "Escape") {
                e.preventDefault();
                setShowCommands(false);
                return;
            }
        }

        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    return (
        <>
            {/* Commands Popover */}
            {showCommands && (
                <div
                    className="fixed z-[60] w-80 overflow-hidden rounded-lg border shadow-xl animate-in fade-in zoom-in-95 bg-card border-border"
                    style={{
                        bottom: 'calc(1.5rem + 120px)',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        transition: 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    }}
                >
                    <div className="p-2">
                        {filteredCommands.map((cmd, i) => (
                            <button
                                key={cmd.command}
                                onClick={() => selectCommand(cmd.command)}
                                className={cls(
                                    "flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm rounded-md transition-colors",
                                    i === activeIndex
                                        ? "bg-accent text-accent-foreground"
                                        : "hover:bg-accent/50 text-foreground"
                                )}
                            >
                                <span className="text-xl">{cmd.icon}</span>
                                <div className="flex-1">
                                    <div className="font-semibold">{cmd.command}</div>
                                    <div className="text-xs text-muted-foreground">{cmd.description}</div>
                                </div>
                            </button>
                        ))}
                        <div className="mt-2 border-t border-border pt-2 text-right px-2">
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setHelpOpen(true);
                                    setShowCommands(false);
                                }}
                                className="text-xs text-muted-foreground hover:text-foreground underline cursor-pointer transition-colors"
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

            {/* Sticky textarea at bottom */}
            <div
                className="sticky bottom-0 left-0 right-0 bg-background"
                style={{ viewTransitionName: 'prompt-input' } as React.CSSProperties}
            >
                <div className="mx-auto px-4 pt-0 pb-4" style={{ maxWidth: '800px' }}>
                    <div className="relative bg-card border border-[#3e3e38] rounded-lg hover:border-primary focus-within:border-primary transition-colors p-4">
                        <div className="flex flex-col">
                            <textarea
                                ref={textareaRef}
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                onKeyDown={handleKeyDown}
                                onFocus={handleFocus}
                                onBlur={handleBlur}
                                placeholder={placeholder}
                                rows={1}
                                className="w-full bg-transparent text-foreground placeholder:text-muted-foreground text-sm font-mono resize-none outline-none border-none focus:outline-none focus:ring-0 mb-2 min-h-[28px] px-2"
                                disabled={isLoading}
                            />
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <ComposerActionsPopover>
                                        <button
                                            className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors"
                                            title="Attach files"
                                            disabled={isLoading}
                                        >
                                            <Paperclip className="w-5 h-5" />
                                        </button>
                                    </ComposerActionsPopover>
                                    <button
                                        className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors"
                                        title="Voice input"
                                        disabled={isLoading}
                                    >
                                        <Mic className="w-5 h-5" />
                                    </button>
                                </div>
                                <button
                                    onClick={handleSubmit}
                                    disabled={!message.trim() || isLoading}
                                    className={cls(
                                        "rounded-lg p-2 transition-colors inline-flex items-center justify-center",
                                        message.trim() && !isLoading
                                            ? "bg-primary hover:bg-primary/90 text-primary-foreground"
                                            : "bg-primary/20 text-primary/40 cursor-not-allowed"
                                    )}
                                    title="Send message"
                                >
                                    {isLoading ? (
                                        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                    ) : (
                                        <Send className="w-4 h-4" />
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
