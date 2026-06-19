'use client';

import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

interface Provider {
    id: string;
    name: string;
    capabilities: { streaming: boolean; vision: boolean; tools: boolean };
}

interface Model {
    id: string;
    name: string;
    provider: string;
    capabilities: { streaming: boolean; vision: boolean; tools: boolean };
    contextWindow: number;
    pricing: { free: boolean };
}

interface ProviderSelectorProps {
    chatId: string;
    onProviderChange?: (provider: string, model: string) => void;
}

export function ProviderSelector({ chatId, onProviderChange }: ProviderSelectorProps) {
    const [providers, setProviders] = useState<Provider[]>([]);
    const [models, setModels] = useState<Model[]>([]);
    const [selectedProvider, setSelectedProvider] = useState<string>('AUTO');
    const [selectedModel, setSelectedModel] = useState<string>('');
    const [loading, setLoading] = useState(false);

    // Load available providers and models
    useEffect(() => {
        fetch('/api/agents/providers')
            .then(res => res.json())
            .then(data => {
                setProviders(data.providers);
                setModels(data.models);
            })
            .catch(err => console.error('Failed to load providers:', err));
    }, []);

    // Load current session preferences
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

    const handleProviderChange = async (newProvider: string) => {
        setSelectedProvider(newProvider);
        setSelectedModel(''); // Reset model when provider changes
        await updateSession(newProvider === 'AUTO' ? '' : newProvider, '');
    };

    const handleModelChange = async (newModel: string) => {
        setSelectedModel(newModel);
        await updateSession(selectedProvider === 'AUTO' ? '' : selectedProvider, newModel);
    };

    const updateSession = async (provider: string, model: string) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/chat/${chatId}/provider`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ provider, model })
            });
            
            if (res.ok) {
                console.log(`✅ Provider updated: ${provider}${model ? ` / ${model}` : ''}`);
                onProviderChange?.(provider, model);
            } else {
                const error = await res.json();
                console.error('Failed to update provider:', error);
            }
        } catch (error) {
            console.error('Error updating session:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredModels = selectedProvider === 'AUTO' ? [] : models.filter(m => m.provider === selectedProvider);

    return (
        <div className="flex gap-4 items-end">
            <div className="flex-1">
                <Label htmlFor="provider" className="text-xs font-medium text-muted-foreground">
                    LLM Provider
                </Label>
                <Select value={selectedProvider} onValueChange={handleProviderChange} disabled={loading}>
                    <SelectTrigger id="provider" className="h-9">
                        <SelectValue placeholder="Select provider" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="AUTO">
                            <div className="flex items-center gap-2">
                                <span>AUTO</span>
                                <Badge variant="secondary" className="text-[10px] px-1 py-0">
                                    Optimized per agent
                                </Badge>
                            </div>
                        </SelectItem>
                        <div className="h-px bg-border my-1" />
                        {providers.map(p => (
                            <SelectItem key={p.id} value={p.id}>
                                {p.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="flex-1">
                <Label htmlFor="model" className="text-xs font-medium text-muted-foreground">
                    Model
                </Label>
                <Select 
                    value={selectedModel || 'AUTO'} 
                    onValueChange={handleModelChange} 
                    disabled={loading || selectedProvider === 'AUTO' || !filteredModels.length}
                >
                    <SelectTrigger id="model" className="h-9">
                        <SelectValue placeholder="AUTO (per-agent defaults)" />
                    </SelectTrigger>
                    <SelectContent>
                        {selectedProvider === 'AUTO' ? (
                            <SelectItem value="AUTO">AUTO (per-agent defaults)</SelectItem>
                        ) : (
                            <>
                                <SelectItem value="">Auto-select (Default)</SelectItem>
                                {filteredModels.map(m => (
                                    <SelectItem key={m.id} value={m.id}>
                                        <div className="flex items-center gap-2">
                                            <span className="truncate">{m.name}</span>
                                            {m.pricing.free && (
                                                <Badge variant="secondary" className="text-[10px] px-1 py-0">
                                                    Free
                                                </Badge>
                                            )}
                                        </div>
                                    </SelectItem>
                                ))}
                            </>
                        )}
                    </SelectContent>
                </Select>
            </div>
        </div>
    );
}
