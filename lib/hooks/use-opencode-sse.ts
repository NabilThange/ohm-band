import { useEffect, useState, useRef } from 'react';

export interface OpenCodeToolPart {
    id: string;
    type: 'tool' | 'text' | 'reasoning';
    tool?: string;
    state?: 'running' | 'completed' | 'failed';
    args?: Record<string, any>;
    result?: any;
}

export function useOpenCodeSSE(activeChatId?: string | null) {
    const [streamedText, setStreamedText] = useState('');
    const [activeTools, setActiveTools] = useState<OpenCodeToolPart[]>([]);
    const [isStreaming, setIsStreaming] = useState(false);
    const [lastUpdatedArtifact, setLastUpdatedArtifact] = useState<{ type: string; path?: string } | null>(null);
    const eventSourceRef = useRef<EventSource | null>(null);

    useEffect(() => {
        const es = new EventSource('/api/opencode/events');
        eventSourceRef.current = es;

        es.onmessage = (e) => {
            try {
                const evt = JSON.parse(e.data);

                // 1. Text token streaming
                if (evt.type === 'message.part.delta' && evt.properties?.delta) {
                    setIsStreaming(true);
                    setStreamedText((prev) => prev + evt.properties.delta);
                }

                // 2. Tool call / file update events
                if (evt.type === 'message.part.updated' && evt.properties?.part) {
                    const part = evt.properties.part;
                    if (part.type === 'tool' || part.tool) {
                        setActiveTools((prev) => {
                            const idx = prev.findIndex((p) => p.id === part.id);
                            if (idx >= 0) {
                                const next = [...prev];
                                next[idx] = part;
                                return next;
                            }
                            return [...prev, part];
                        });

                        // Detect file writes and identify artifact type
                        const toolName = part.tool || part.name;
                        const args = part.args || {};
                        const filePath = args.path || args.file_path || args.filename || '';

                        if (toolName === 'write' || toolName === 'edit' || toolName === 'write_file') {
                            let artifactType = '';
                            if (filePath.includes('bom')) artifactType = 'bom';
                            else if (filePath.includes('wiring')) artifactType = 'wiring';
                            else if (filePath.includes('code') || filePath.includes('.cpp') || filePath.includes('.h')) artifactType = 'code';
                            else if (filePath.includes('enclosure') || filePath.includes('.scad')) artifactType = 'enclosure';
                            else if (filePath.includes('context') || filePath.includes('prd') || filePath.includes('mvp')) artifactType = 'context';
                            else if (filePath.includes('budget')) artifactType = 'budget';

                            if (artifactType) {
                                setLastUpdatedArtifact({ type: artifactType, path: filePath });
                                if (typeof window !== 'undefined') {
                                    window.dispatchEvent(new CustomEvent('ohm-artifact-updated', {
                                        detail: { type: artifactType, path: filePath, chatId: activeChatId }
                                    }));
                                }
                            }
                        }
                    }
                }

                // 3. Turn complete
                if (evt.type === 'session.idle' || evt.type === 'session.status') {
                    setIsStreaming(false);
                }
            } catch (err) {
                console.error('[OpenCode SSE] Parse error:', err);
            }
        };

        es.onerror = () => {
            // Reconnect handled automatically by browser EventSource
        };

        return () => {
            es.close();
            eventSourceRef.current = null;
        };
    }, [activeChatId]);

    const resetStream = () => {
        setStreamedText('');
        setActiveTools([]);
        setIsStreaming(false);
    };

    return {
        streamedText,
        activeTools,
        isStreaming,
        lastUpdatedArtifact,
        resetStream,
    };
}
