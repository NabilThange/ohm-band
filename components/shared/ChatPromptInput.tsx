'use client';

import { useState, useEffect, useRef } from 'react';
import { XIcon } from '@/components/ui/animated-icons'
import { Mic, Paperclip, Send, ChevronDown } from 'lucide-react';
import ComposerActionsPopover from '@/components/ai_chat/ComposerActionsPopover';
import { cn as cls } from '@/lib/utils';
import { ConversationBar } from '@/components/ui/conversation-bar';

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

interface Provider {
    id: string;
    name: string;
}

interface Model {
    id: string;
    name: string;
    provider: string;
    pricing: { free: boolean };
}

interface ChatPromptInputProps {
    onSendMessage: (message: string) => void;
    isLoading?: boolean;
    chatId?: string;
}

export function ChatPromptInput({ onSendMessage, isLoading = false, chatId }: ChatPromptInputProps) {
    const [message, setMessage] = useState('');
    const [showCommands, setShowCommands] = useState(false);
    const [filteredCommands, setFilteredCommands] = useState(COMMANDS);
    const [activeIndex, setActiveIndex] = useState(0);
    const [helpOpen, setHelpOpen] = useState(false);
    const [placeholder, setPlaceholder] = useState(getRandomPlaceholder());
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isVoiceMode, setIsVoiceMode] = useState(false);
    const isSubmittingRef = useRef(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Provider/Model state
    const [providers, setProviders] = useState<Provider[]>([]);
    const [models, setModels] = useState<Model[]>([]);
    const [selectedProvider, setSelectedProvider] = useState<string>('AUTO');
    const [selectedModel, setSelectedModel] = useState<string>('');
    const [showProviderMenu, setShowProviderMenu] = useState(false);
    const [showModelMenu, setShowModelMenu] = useState(false);
    const providerMenuRef = useRef<HTMLDivElement>(null);
    const modelMenuRef = useRef<HTMLDivElement>(null);

    // Load providers and models
    useEffect(() => {
        fetch('/api/agents/providers')
            .then(res => res.json())
            .then(data => {
                setProviders(data.providers);
                setModels(data.models);
            })
            .catch(err => console.error('Failed to load providers:', err));
    }, []);

    // Load session preferences
    useEffect(() => {
        if (chatId) {
            fetch(`/api/chat/${chatId}/provider`)
                .then(res => res.json())
                .then(data => {
                    setSelectedProvider(data.provider === '' ? 'AUTO' : (data.provider || 'AUTO'));
                    setSelectedModel(data.model || '');
                })
                .catch(err => console.error('Failed to load session preferences:', err));
        }
    }, [chatId]);

    // Close menus when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (providerMenuRef.current && !providerMenuRef.current.contains(e.target as Node)) {
                setShowProviderMenu(false);
            }
            if (modelMenuRef.current && !modelMenuRef.current.contains(e.target as Node)) {
                setShowModelMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const updateSessionProvider = async (provider: string, model: string) => {
        if (!chatId) return;
        try {
            await fetch(`/api/chat/${chatId}/provider`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ provider, model })
            });
        } catch (error) {
            console.error('Error updating provider:', error);
        }
    };

    const handleProviderChange = async (providerId: string) => {
        setSelectedProvider(providerId);
        setSelectedModel(''); // Reset model
        setShowProviderMenu(false);
        await updateSessionProvider(providerId === 'AUTO' ? '' : providerId, '');
    };

    const handleModelChange = async (modelId: string) => {
        setSelectedModel(modelId);
        setShowModelMenu(false);
        await updateSessionProvider(selectedProvider === 'AUTO' ? '' : selectedProvider, modelId);
    };

    const filteredModels = selectedProvider === 'AUTO' ? [] : models.filter(m => m.provider === selectedProvider);
    const currentProvider = selectedProvider === 'AUTO' ? { id: 'AUTO', name: 'AUTO' } : providers.find(p => p.id === selectedProvider);
    const currentModel = selectedProvider === 'AUTO' ? { id: '', name: 'AUTO' } : models.find(m => m.id === selectedModel);

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
        if (!message.trim() || isLoading || isSubmittingRef.current) return;

        isSubmittingRef.current = true;
        setIsSubmitting(true);
        const userMessage = message.trim();
        setMessage('');
        try {
            await onSendMessage(userMessage);
        } catch (e) {
            console.error('[ChatPromptInput] Send message failed:', e);
        } finally {
            isSubmittingRef.current = false;
            setIsSubmitting(false);
        }
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
                    {isVoiceMode ? (
                        <ConversationBar
                            onTranscriptionComplete={(text) => {
                                const newValue = message ? `${message} ${text}` : text;
                                setMessage(newValue);
                                setIsVoiceMode(false);
                                setTimeout(() => {
                                    textareaRef.current?.focus();
                                }, 100);
                            }}
                            onClose={() => {
                                setIsVoiceMode(false);
                                setTimeout(() => {
                                    textareaRef.current?.focus();
                                }, 100);
                            }}
                        />
                    ) : (
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
                                    disabled={isLoading || isSubmitting}
                                />
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        {/* Provider Selector */}
                                        <div className="relative" ref={providerMenuRef}>
                                            <button
                                                onClick={() => setShowProviderMenu(!showProviderMenu)}
                                                className="px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors flex items-center gap-1"
                                                title="Select LLM Provider"
                                                disabled={isLoading || isSubmitting}
                                            >
                                                <span className="font-medium">{selectedProvider === 'AUTO' ? 'AUTO' : (currentProvider?.name || 'Provider')}</span>
                                                <ChevronDown className="w-3 h-3" />
                                            </button>
                                            {showProviderMenu && (
                                                <div className="absolute bottom-full left-0 mb-2 w-48 bg-card border border-border rounded-lg shadow-lg z-50 py-1">
                                                    <button
                                                        onClick={() => handleProviderChange('AUTO')}
                                                        className={cls(
                                                            "w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors",
                                                            selectedProvider === 'AUTO' ? "bg-accent/50 font-medium" : ""
                                                        )}
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <span>AUTO</span>
                                                            <span className="text-[10px] px-1.5 py-0.5 bg-primary/20 text-primary rounded font-normal scale-90 origin-left">Optimized</span>
                                                        </div>
                                                    </button>
                                                    <div className="h-px bg-border my-1" />
                                                    {providers.map(p => (
                                                        <button
                                                            key={p.id}
                                                            onClick={() => handleProviderChange(p.id)}
                                                            className={cls(
                                                                "w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors",
                                                                selectedProvider === p.id ? "bg-accent/50 font-medium" : ""
                                                            )}
                                                        >
                                                            {p.name}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* Model Selector */}
                                        <div className="relative" ref={modelMenuRef}>
                                            <button
                                                onClick={() => setShowModelMenu(!showModelMenu)}
                                                className="px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors flex items-center gap-1"
                                                title="Select Model"
                                                disabled={isLoading || isSubmitting || selectedProvider === 'AUTO' || !filteredModels.length}
                                            >
                                                <span className="font-medium max-w-[120px] truncate">
                                                    {selectedProvider === 'AUTO' ? 'AUTO' : (currentModel?.name || 'Auto')}
                                                </span>
                                                <ChevronDown className="w-3 h-3" />
                                            </button>
                                            {showModelMenu && selectedProvider !== 'AUTO' && (
                                                <div className="absolute bottom-full left-0 mb-2 w-64 bg-card border border-border rounded-lg shadow-lg z-50 py-1 max-h-64 overflow-y-auto">
                                                    <button
                                                        onClick={() => handleModelChange('')}
                                                        className={cls(
                                                            "w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors",
                                                            !selectedModel ? "bg-accent/50 font-medium" : ""
                                                        )}
                                                    >
                                                        Auto-select (Default)
                                                    </button>
                                                    {filteredModels.map(m => (
                                                        <button
                                                            key={m.id}
                                                            onClick={() => handleModelChange(m.id)}
                                                            className={cls(
                                                                "w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors",
                                                                selectedModel === m.id ? "bg-accent/50 font-medium" : ""
                                                            )}
                                                        >
                                                            <div className="flex items-center justify-between">
                                                                <span className="truncate">{m.name}</span>
                                                                {m.pricing.free && (
                                                                    <span className="text-[10px] px-1.5 py-0.5 bg-primary/20 text-primary rounded">Free</span>
                                                                )}
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        <div className="w-px h-4 bg-border" />

                                        <ComposerActionsPopover>
                                            <button
                                                className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors"
                                                title="Attach files"
                                                disabled={isLoading || isSubmitting}
                                            >
                                                <Paperclip className="w-5 h-5" />
                                            </button>
                                        </ComposerActionsPopover>
                                        <button
                                            className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors"
                                            title="Voice input"
                                            disabled={isLoading || isSubmitting}
                                            onClick={() => setIsVoiceMode(true)}
                                        >
                                            <Mic className="w-5 h-5" />
                                        </button>
                                    </div>
                                    <button
                                        onClick={handleSubmit}
                                        disabled={!message.trim() || isLoading || isSubmitting}
                                        className={cls(
                                            "rounded-lg p-2 transition-colors inline-flex items-center justify-center",
                                            message.trim() && !isLoading && !isSubmitting
                                                ? "bg-primary hover:bg-primary/90 text-primary-foreground"
                                                : "bg-primary/20 text-primary/40 cursor-not-allowed"
                                        )}
                                        title="Send message"
                                    >
                                        {isLoading || isSubmitting ? (
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
                    )}
                </div>
            </div>
        </>
    );
}
