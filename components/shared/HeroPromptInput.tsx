'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Mic, Paperclip } from 'lucide-react';
import { AnimatedTextarea } from '@/components/ui/animated-textarea';
import ComposerActionsPopover from '@/components/ai_chat/ComposerActionsPopover';
import { cn as cls } from '@/lib/utils';

const PLACEHOLDER_EXAMPLES = [
    "I want to build a smart weather station with ESP32 and e-ink display.",
    "Create a gesture-controlled lamp with proximity sensors and RGB LEDs.",
    "Design an automated plant watering system with soil moisture sensors.",
    "Build a wireless temperature monitor for my home brewery.",
];

interface HeroPromptInputProps {
    variant?: 'landing' | 'build';
}

export function HeroPromptInput({ variant = 'landing' }: HeroPromptInputProps) {
    const router = useRouter();
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isPending, startTransition] = useTransition();

    const handleSubmit = async () => {
        if (!message.trim() || isSubmitting || isPending) return;

        setIsSubmitting(true);
        const userMessage = message.trim();
        
        try {
            const res = await fetch('/api/agents/title', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: userMessage })
            });

            if (res.ok) {
                const data = await res.json();
                const slug = data.slug || data.chatId;
                setMessage('');
                startTransition(() => {
                    router.push(`/build/${slug}?initialPrompt=${encodeURIComponent(userMessage)}`);
                });
                return;
            }
        } catch (err) {
            console.error("Failed to generate project title:", err);
        }

        // Fallback slug
        const fallbackSlug = userMessage
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .slice(0, 35) || 'hardware-project';

        setMessage('');
        startTransition(() => {
            router.push(`/build/${fallbackSlug}?initialPrompt=${encodeURIComponent(userMessage)}`);
        });
        
        setIsSubmitting(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    return (
        <div 
            className="w-full mx-auto px-4"
            style={{ viewTransitionName: 'prompt-input', maxWidth: '800px' } as React.CSSProperties}
        >
            <div className="relative bg-card border border-[#3e3e38] rounded-lg shadow-2xl hover:border-primary focus-within:border-primary transition-colors p-4">
                <div className="p-3">
                    <AnimatedTextarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholderExamples={variant === 'landing' ? PLACEHOLDER_EXAMPLES : ["Describe your project in detail..."]}
                        typeSpeed={50}
                        deleteSpeed={30}
                        pauseDelay={2000}
                        rows={variant === 'build' ? 3 : 1}
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
                            disabled={!message.trim() || isSubmitting || isPending}
                            className={cls(
                                "rounded-lg px-4 py-1.5 transition-colors font-medium inline-flex items-center gap-2 text-sm",
                                message.trim() && !isSubmitting && !isPending
                                    ? "bg-primary hover:bg-primary/90 text-primary-foreground"
                                    : "bg-muted text-muted-foreground cursor-not-allowed"
                            )}
                        >
                            {isSubmitting || isPending ? (
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
            </div>
            
            {variant === 'build' && (
                <p className="text-muted-foreground text-sm text-center mt-3">
                    Press Enter to create or click Create
                </p>
            )}
        </div>
    );
}
