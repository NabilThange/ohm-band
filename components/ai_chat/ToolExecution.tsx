'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Check, Loader2, Wrench, FileCode, Folder, Search, AlertCircle } from 'lucide-react';

export interface ToolCallItem {
    id?: string;
    tool?: string;
    toolName?: string;
    state?: any;
    args?: any;
    result?: any;
}

interface ToolExecutionProps {
    tools: ToolCallItem[];
    isStreaming?: boolean;
}

export function ToolExecution({ tools, isStreaming = false }: ToolExecutionProps) {
    const [isOpen, setIsOpen] = useState(false);

    if (!tools || tools.length === 0) return null;

    const count = tools.length;
    const runningCount = tools.filter((t) => {
        const s = typeof t.state === 'string' ? t.state : t.state?.status;
        return s === 'running' || s === 'pending';
    }).length;
    const hasRunning = runningCount > 0 || isStreaming;

    const getToolIcon = (name: string = '') => {
        if (name === 'write' || name === 'edit' || name === 'read') return <FileCode className="h-3.5 w-3.5" />;
        if (name === 'glob' || name === 'list') return <Folder className="h-3.5 w-3.5" />;
        if (name === 'grep' || name === 'search') return <Search className="h-3.5 w-3.5" />;
        return <Wrench className="h-3.5 w-3.5" />;
    };

    return (
        <div className="my-2 overflow-hidden rounded-lg border border-border/60 bg-muted/20 text-xs transition-all">
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="flex w-full items-center justify-between px-3 py-2 text-left hover:bg-muted/40 transition-colors cursor-pointer"
            >
                <div className="flex items-center gap-2">
                    {hasRunning ? (
                        <div className="flex items-center gap-1.5 text-amber-500 font-medium">
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            <span>Executing {count} {count === 1 ? 'action' : 'actions'}...</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                            <Check className="h-3.5 w-3.5" />
                            <span>Executed {count} {count === 1 ? 'action' : 'actions'}</span>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-1 text-muted-foreground">
                    <span className="text-[11px]">{isOpen ? 'Hide' : 'Details'}</span>
                    {isOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                </div>
            </button>

            {isOpen && (
                <div className="border-t border-border/40 bg-background/50 divide-y divide-border/30">
                    {tools.map((t, idx) => {
                        const name = String(t.toolName || t.tool || 'tool');
                        const rawState = t.state;
                        const status = typeof rawState === 'string' ? rawState : (rawState?.status || 'completed');
                        const args = t.args || (typeof rawState === 'object' ? rawState?.input : null) || {};
                        const output = t.result || (typeof rawState === 'object' ? rawState?.output : null);
                        const path = args.path || args.file_path || args.filename || args.query || '';

                        return (
                            <div key={t.id || idx} className="p-2.5 font-mono text-[11px] space-y-1">
                                <div className="flex items-center justify-between text-foreground">
                                    <div className="flex items-center gap-1.5">
                                        {getToolIcon(name)}
                                        <span className="font-semibold text-foreground">{name}</span>
                                        {path && typeof path === 'string' && (
                                            <span className="text-muted-foreground truncate max-w-[220px]">
                                                {path}
                                            </span>
                                        )}
                                    </div>
                                    <span className="text-[10px] text-muted-foreground uppercase">
                                        {String(status)}
                                    </span>
                                </div>

                                {args && typeof args === 'object' && Object.keys(args).length > 0 && (
                                    <pre className="mt-1 max-h-32 overflow-auto rounded bg-muted/40 p-1.5 text-[10px] text-muted-foreground">
                                        {JSON.stringify(args, null, 2)}
                                    </pre>
                                )}

                                {output && (
                                    <pre className="mt-1 max-h-32 overflow-auto rounded bg-background/80 p-1.5 text-[10px] text-muted-foreground border border-border/30">
                                        {typeof output === 'string' ? output : JSON.stringify(output, null, 2)}
                                    </pre>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default ToolExecution;
