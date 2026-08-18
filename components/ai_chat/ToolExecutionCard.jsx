'use client';

import React, { useState } from 'react';
import {
    Wrench,
    FileCode,
    Search,
    Folder,
    CheckCircle2,
    Loader2,
    AlertCircle,
    ChevronDown,
    ChevronRight,
    Terminal
} from 'lucide-react';

export default function ToolExecutionCard({ tool, state = 'completed', args = {}, result }) {
    const [isOpen, setIsOpen] = useState(false);

    const toolName = tool || 'tool';
    const filePath = args.path || args.file_path || args.filename || args.query || args.pattern || '';

    // Pick icon based on tool
    const getToolIcon = () => {
        if (toolName === 'write' || toolName === 'edit' || toolName === 'read') {
            return <FileCode className="h-3.5 w-3.5" />;
        }
        if (toolName === 'glob' || toolName === 'list') {
            return <Folder className="h-3.5 w-3.5" />;
        }
        if (toolName === 'grep' || toolName === 'search') {
            return <Search className="h-3.5 w-3.5" />;
        }
        if (toolName === 'bash' || toolName === 'terminal') {
            return <Terminal className="h-3.5 w-3.5" />;
        }
        return <Wrench className="h-3.5 w-3.5" />;
    };

    const isRunning = state === 'running';
    const isFailed = state === 'failed';

    return (
        <div className="my-1.5 overflow-hidden rounded-lg border border-border/70 bg-card/60 text-xs shadow-sm transition-all">
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="flex w-full items-center justify-between px-3 py-2 text-left hover:bg-muted/40 transition-colors"
            >
                <div className="flex items-center gap-2 min-w-0">
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-muted text-muted-foreground">
                        {getToolIcon()}
                    </div>

                    <span className="font-mono font-medium text-foreground">
                        {toolName}
                    </span>

                    {filePath && (
                        <span className="truncate font-mono text-[11px] text-muted-foreground max-w-[200px] sm:max-w-[300px]">
                            {filePath}
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    {isRunning && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-500">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            Running
                        </span>
                    )}

                    {isFailed && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-medium text-destructive">
                            <AlertCircle className="h-3 w-3" />
                            Error
                        </span>
                    )}

                    {!isRunning && !isFailed && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="h-3 w-3" />
                            Done
                        </span>
                    )}

                    {isOpen ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
                </div>
            </button>

            {isOpen && (
                <div className="border-t border-border/40 bg-muted/20 px-3.5 py-2.5 font-mono text-[11px] leading-relaxed text-muted-foreground space-y-2">
                    {Object.keys(args).length > 0 && (
                        <div>
                            <div className="text-[10px] uppercase tracking-wider text-muted-foreground/70 font-sans font-semibold mb-1">
                                Arguments
                            </div>
                            <pre className="max-h-40 overflow-auto rounded bg-background/80 p-2 text-foreground/90 border border-border/40">
                                {typeof args === 'string' ? args : JSON.stringify(args, null, 2)}
                            </pre>
                        </div>
                    )}

                    {result && (
                        <div>
                            <div className="text-[10px] uppercase tracking-wider text-muted-foreground/70 font-sans font-semibold mb-1">
                                Output
                            </div>
                            <pre className="max-h-40 overflow-auto rounded bg-background/80 p-2 text-foreground/90 border border-border/40">
                                {typeof result === 'string' ? result : JSON.stringify(result, null, 2)}
                            </pre>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
