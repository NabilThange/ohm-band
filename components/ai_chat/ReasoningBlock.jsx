'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Sparkles, Brain } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function ReasoningBlock({ reasoning, isStreaming = false, durationMs }) {
    const [isOpen, setIsOpen] = useState(isStreaming);

    if (!reasoning && !isStreaming) return null;

    // Calculate display duration
    const formattedDuration = durationMs ? `${(durationMs / 1000).toFixed(1)}s` : null;

    return (
        <div className="my-2 overflow-hidden rounded-xl border border-border/60 bg-muted/30 backdrop-blur-sm transition-all">
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="flex w-full items-center justify-between px-3.5 py-2 text-left text-xs font-medium text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors"
            >
                <div className="flex items-center gap-2">
                    <div className={`flex h-5 w-5 items-center justify-center rounded-md ${isStreaming ? 'bg-primary/10 text-primary animate-pulse' : 'bg-muted text-muted-foreground'}`}>
                        <Brain className="h-3.5 w-3.5" />
                    </div>
                    <span className="font-semibold text-foreground/90">
                        {isStreaming ? 'Thinking...' : 'Reasoning Process'}
                    </span>
                    {formattedDuration && (
                        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground font-mono">
                            {formattedDuration}
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-1.5 text-muted-foreground">
                    <span className="text-[11px]">{isOpen ? 'Hide' : 'Show'}</span>
                    {isOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                </div>
            </button>

            {isOpen && (
                <div className="border-t border-border/40 bg-background/50 px-4 py-3 text-xs leading-relaxed text-muted-foreground">
                    <div className="prose prose-xs max-w-none text-muted-foreground dark:prose-invert [&_*]:text-muted-foreground [&_code]:font-mono [&_code]:text-[11px] [&_code]:bg-muted/80 [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {reasoning || (isStreaming ? '_Analyzing project constraints and selecting components..._' : '')}
                        </ReactMarkdown>
                    </div>
                </div>
            )}
        </div>
    );
}
