"use client"

import React, { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { 
    Brain, 
    ChevronDown, 
    ChevronRight, 
    CheckCircle2, 
    Loader2, 
    Terminal, 
    FileText, 
    Search, 
    FileCode, 
    Edit3, 
    Sparkles, 
    Wrench,
    ExternalLink
} from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

export interface ExecutionStep {
    id: string;
    type: 'reasoning' | 'tool';
    text?: string;
    toolName?: string;
    state?: 'running' | 'completed' | 'failed';
    args?: Record<string, any>;
    result?: any;
    duration?: number;
    timestamp?: string;
}

interface AgentExecutionFlowProps {
    steps?: ExecutionStep[];
    reasoning?: string;
    tools?: any[];
    isStreaming?: boolean;
    duration?: number;
    className?: string;
}

const TOOL_ICONS: Record<string, React.ElementType> = {
    read: FileText,
    write: FileCode,
    edit: Edit3,
    glob: Search,
    grep: Search,
    bash: Terminal,
    command: Terminal,
};

export function AgentExecutionFlow({
    steps = [],
    reasoning = "",
    tools = [],
    isStreaming = false,
    duration,
    className
}: AgentExecutionFlowProps) {
    // Construct chronological unified steps if not explicitly provided
    const timelineSteps: ExecutionStep[] = React.useMemo(() => {
        if (steps && steps.length > 0) return steps;

        const combined: ExecutionStep[] = [];

        if (reasoning && reasoning.trim()) {
            combined.push({
                id: 'reasoning-initial',
                type: 'reasoning',
                text: reasoning.trim(),
                state: isStreaming ? 'running' : 'completed'
            });
        }

        if (tools && tools.length > 0) {
            tools.forEach((t, idx) => {
                const toolName = t.tool || t.toolName || t.name || 'action';
                const status = typeof t.state === 'string' ? t.state : (t.state?.status || 'completed');
                const args = t.args || (typeof t.state === 'object' ? t.state?.input : null) || {};
                const result = t.result || (typeof t.state === 'object' ? t.state?.output : null);

                combined.push({
                    id: t.id || `tool-${idx}`,
                    type: 'tool',
                    toolName,
                    state: status as any,
                    args,
                    result
                });
            });
        }

        return combined;
    }, [steps, reasoning, tools, isStreaming]);

    // Open by default while streaming, auto-collapsed on completion
    const [isOpen, setIsOpen] = useState(isStreaming);
    const [expandedTools, setExpandedTools] = useState<Record<string, boolean>>({});

    useEffect(() => {
        if (isStreaming) {
            setIsOpen(true);
        }
    }, [isStreaming]);

    if (timelineSteps.length === 0 && !isStreaming) return null;

    const toolCount = timelineSteps.filter(s => s.type === 'tool').length;
    const hasReasoning = timelineSteps.some(s => s.type === 'reasoning');

    const toggleTool = (id: string) => {
        setExpandedTools(prev => ({ ...prev, [id]: !prev[id] }));
    };

    return (
        <div className={cn("w-full my-2 overflow-hidden rounded-xl border border-border/70 bg-card/60 backdrop-blur-sm transition-all duration-200", className)}>
            {/* Header Trigger Pill */}
            <button
                type="button"
                onClick={() => setIsOpen(prev => !prev)}
                className="w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors cursor-pointer select-none"
            >
                <div className="flex items-center gap-2">
                    {isStreaming ? (
                        <Loader2 className="h-3.5 w-3.5 text-primary animate-spin" />
                    ) : (
                        <Sparkles className="h-3.5 w-3.5 text-primary/80" />
                    )}

                    <span className="font-semibold text-foreground/90">
                        {isStreaming ? "Agent is working..." : "Execution & Thought Process"}
                    </span>

                    {/* Meta Pills */}
                    <div className="flex items-center gap-1.5 ml-1">
                        {duration !== undefined && duration > 0 && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-muted text-[10px] font-mono text-muted-foreground">
                                {duration}s
                            </span>
                        )}
                        {toolCount > 0 && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-primary/10 text-[10px] font-medium text-primary border border-primary/20">
                                ⚙️ {toolCount} action{toolCount > 1 ? 's' : ''}
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-1 text-[11px] text-muted-foreground/80">
                    <span>{isOpen ? "Hide" : "Show"}</span>
                    {isOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                </div>
            </button>

            {/* Collapsible Timeline Content */}
            {isOpen && (
                <div className="border-t border-border/50 bg-background/50 px-4 py-3 text-xs leading-relaxed space-y-3">
                    <div className="max-h-64 sm:max-h-72 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-border/70 scrollbar-track-transparent space-y-3">
                        {timelineSteps.map((step, idx) => {
                            if (step.type === 'reasoning') {
                                return (
                                    <div key={step.id || idx} className="space-y-1.5 border-l-2 border-primary/40 pl-3 py-0.5">
                                        <div className="flex items-center gap-1.5 font-mono text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                                            <Brain className="h-3 w-3 text-primary" />
                                            <span>Thinking Process</span>
                                        </div>
                                        <div className="prose prose-xs max-w-none text-muted-foreground/90 dark:prose-invert [&_*]:text-muted-foreground/90 [&_p]:my-1 [&_ul]:my-1 [&_li]:my-0.5 [&_code]:font-mono [&_code]:text-[11px] [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded">
                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                {step.text || (isStreaming ? "Analyzing hardware constraints and user profile..." : "")}
                                            </ReactMarkdown>
                                        </div>
                                    </div>
                                );
                            }

                            if (step.type === 'tool') {
                                const ToolIcon = step.toolName ? (TOOL_ICONS[step.toolName] || Wrench) : Wrench;
                                const isExpanded = !!expandedTools[step.id];
                                const isRunning = step.state === 'running';
                                const filePath = step.args?.path || step.args?.filePath || step.args?.file || step.args?.pattern || step.args?.command || '';

                                return (
                                    <div key={step.id || idx} className="rounded-lg border border-border/60 bg-card/80 p-2.5 space-y-2 transition-all">
                                        <div 
                                            onClick={() => toggleTool(step.id)}
                                            className="flex items-center justify-between cursor-pointer select-none"
                                        >
                                            <div className="flex items-center gap-2">
                                                <div className={cn(
                                                    "flex h-6 w-6 items-center justify-center rounded-md border",
                                                    isRunning ? "border-amber-500/30 bg-amber-500/10 text-amber-400" : "border-primary/30 bg-primary/10 text-primary"
                                                )}>
                                                    <ToolIcon className="h-3.5 w-3.5" />
                                                </div>

                                                <div className="flex flex-col">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="font-mono text-xs font-semibold text-foreground">
                                                            {step.toolName}
                                                        </span>
                                                        {filePath && (
                                                            <span className="font-mono text-[11px] text-muted-foreground truncate max-w-[260px] sm:max-w-[380px]">
                                                                {String(filePath)}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                {isRunning ? (
                                                    <span className="inline-flex items-center gap-1 text-[10px] font-mono text-amber-400">
                                                        <Loader2 className="h-3 w-3 animate-spin" /> running
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-400">
                                                        <CheckCircle2 className="h-3 w-3 text-emerald-400" /> completed
                                                    </span>
                                                )}
                                                {isExpanded ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
                                            </div>
                                        </div>

                                        {/* Expanded Details / Output */}
                                        {isExpanded && (
                                            <div className="mt-2 pt-2 border-t border-border/40 space-y-2 text-[11px] font-mono">
                                                {step.args && Object.keys(step.args).length > 0 && (
                                                    <div>
                                                        <p className="text-[10px] uppercase font-semibold text-muted-foreground mb-1">Inputs:</p>
                                                        <pre className="p-2 rounded bg-muted/60 overflow-x-auto text-muted-foreground">
                                                            {JSON.stringify(step.args, null, 2)}
                                                        </pre>
                                                    </div>
                                                )}
                                                {step.result && (
                                                    <div>
                                                        <p className="text-[10px] uppercase font-semibold text-muted-foreground mb-1">Output:</p>
                                                        <pre className="p-2 rounded bg-muted/60 overflow-x-auto text-muted-foreground max-h-40">
                                                            {typeof step.result === 'string' ? step.result : JSON.stringify(step.result, null, 2)}
                                                        </pre>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            }

                            return null;
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
