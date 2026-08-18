'use client';

import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    useRef,
    ReactNode,
} from 'react';
import { ChevronDown, ChevronRight, Brain, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';

// ─────────────────────────────────────────────
// Reasoning Context
// ─────────────────────────────────────────────

interface ReasoningContextType {
    isStreaming: boolean;
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    duration?: number;
}

const ReasoningContext = createContext<ReasoningContextType | null>(null);

export function useReasoning() {
    const context = useContext(ReasoningContext);
    if (!context) {
        throw new Error('useReasoning must be used within a <Reasoning /> container');
    }
    return context;
}

// ─────────────────────────────────────────────
// Root: <Reasoning />
// ─────────────────────────────────────────────

export interface ReasoningProps extends React.HTMLAttributes<HTMLDivElement> {
    isStreaming?: boolean;
    open?: boolean;
    defaultOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
    duration?: number;
    children?: ReactNode;
}

export function Reasoning({
    isStreaming = false,
    open: controlledOpen,
    defaultOpen,
    onOpenChange,
    duration: externalDuration,
    className,
    children,
    ...props
}: ReasoningProps) {
    const [internalOpen, setInternalOpen] = useState<boolean>(
        defaultOpen ?? isStreaming
    );
    const [duration, setDuration] = useState<number | undefined>(externalDuration);
    const startTimeRef = useRef<number | null>(null);

    const isControlled = controlledOpen !== undefined;
    const isOpen = isControlled ? controlledOpen : internalOpen;

    const setIsOpen = (nextOpen: boolean) => {
        if (!isControlled) {
            setInternalOpen(nextOpen);
        }
        onOpenChange?.(nextOpen);
    };

    // Auto-open when streaming starts, auto-close when finished
    useEffect(() => {
        if (isStreaming) {
            setIsOpen(true);
            startTimeRef.current = Date.now();
        } else if (startTimeRef.current && !externalDuration) {
            const elapsed = Math.round((Date.now() - startTimeRef.current) / 1000);
            setDuration(elapsed > 0 ? elapsed : 1);
            startTimeRef.current = null;
        }
    }, [isStreaming, externalDuration]);

    useEffect(() => {
        if (externalDuration !== undefined) {
            setDuration(externalDuration);
        }
    }, [externalDuration]);

    return (
        <ReasoningContext.Provider
            value={{
                isStreaming,
                isOpen,
                setIsOpen,
                duration,
            }}
        >
            <div
                className={cn(
                    'w-full my-2 overflow-hidden rounded-xl border border-border/70 bg-muted/20 backdrop-blur-sm transition-all',
                    className
                )}
                {...props}
            >
                {children}
            </div>
        </ReasoningContext.Provider>
    );
}

// ─────────────────────────────────────────────
// Trigger: <ReasoningTrigger />
// ─────────────────────────────────────────────

export interface ReasoningTriggerProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    getThinkingMessage?: (isStreaming: boolean, duration?: number) => ReactNode;
}

export function ReasoningTrigger({
    getThinkingMessage,
    className,
    children,
    ...props
}: ReasoningTriggerProps) {
    const { isStreaming, isOpen, setIsOpen, duration } = useReasoning();

    const defaultLabel = () => {
        if (isStreaming) return 'Thinking...';
        if (duration) return `Thought for ${duration}s`;
        return 'Thinking Process';
    };

    return (
        <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className={cn(
                'flex w-full items-center justify-between px-3.5 py-2.5 text-left text-xs font-medium text-muted-foreground hover:bg-muted/40 hover:text-foreground transition-colors cursor-pointer select-none',
                className
            )}
            {...props}
        >
            <div className="flex items-center gap-2">
                <div
                    className={cn(
                        'flex h-5 w-5 items-center justify-center rounded-md text-muted-foreground',
                        isStreaming && 'bg-primary/10 text-primary animate-pulse'
                    )}
                >
                    <Brain className="h-3.5 w-3.5" />
                </div>

                <span className="font-semibold text-foreground/90">
                    {children || (getThinkingMessage ? getThinkingMessage(isStreaming, duration) : defaultLabel())}
                </span>

                {duration && !isStreaming && (
                    <span className="rounded-full bg-muted/80 px-2 py-0.5 text-[10px] font-mono text-muted-foreground">
                        {duration}s
                    </span>
                )}
            </div>

            <div className="flex items-center gap-1 text-muted-foreground">
                <span className="text-[11px] font-sans">{isOpen ? 'Hide' : 'Show'}</span>
                {isOpen ? (
                    <ChevronDown className="h-3.5 w-3.5" />
                ) : (
                    <ChevronRight className="h-3.5 w-3.5" />
                )}
            </div>
        </button>
    );
}

// ─────────────────────────────────────────────
// Content: <ReasoningContent />
// ─────────────────────────────────────────────

export interface ReasoningContentProps
    extends React.HTMLAttributes<HTMLDivElement> {
    children?: ReactNode;
    maxHeightClass?: string;
}

export function ReasoningContent({
    children,
    maxHeightClass = 'max-h-64 sm:max-h-72',
    className,
    ...props
}: ReasoningContentProps) {
    const { isOpen, isStreaming } = useReasoning();

    if (!isOpen) return null;

    const rawText = typeof children === 'string' ? children : '';

    return (
        <div
            className={cn(
                'border-t border-border/40 bg-background/60 px-4 py-3 text-xs leading-relaxed text-muted-foreground',
                className
            )}
            {...props}
        >
            <div
                className={cn(
                    'overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent',
                    maxHeightClass
                )}
            >
                {rawText ? (
                    <div className="prose prose-xs max-w-none text-muted-foreground dark:prose-invert [&_*]:text-muted-foreground [&_p]:my-1.5 [&_ul]:my-1.5 [&_li]:my-0.5 [&_code]:font-mono [&_code]:text-[11px] [&_code]:bg-muted/80 [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {rawText}
                        </ReactMarkdown>
                    </div>
                ) : (
                    <div className="font-mono text-[11px] italic text-muted-foreground/70">
                        {isStreaming ? 'Analyzing project requirements and constraints...' : (typeof children === 'string' ? children : '')}
                    </div>
                )}
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────
// Direct Simple Wrapper (for backward-compatibility)
// ─────────────────────────────────────────────

export interface SimpleReasoningProps {
    text?: string;
    isStreaming?: boolean;
    durationMs?: number;
    duration?: number;
    className?: string;
}

export function SimpleReasoning({
    text,
    isStreaming = false,
    durationMs,
    duration: explicitDuration,
    className,
}: SimpleReasoningProps) {
    const calculatedDuration = explicitDuration ?? (durationMs ? Math.max(1, Math.round(durationMs / 1000)) : undefined);

    if (!text && !isStreaming) return null;

    return (
        <Reasoning
            isStreaming={isStreaming}
            duration={calculatedDuration}
            className={className}
        >
            <ReasoningTrigger />
            <ReasoningContent>{text || ''}</ReasoningContent>
        </Reasoning>
    );
}

export default SimpleReasoning;
