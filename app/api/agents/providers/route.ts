import { NextRequest, NextResponse } from 'next/server';
import { getAllAvailableModels, PROVIDER_CONFIGS, type ProviderType } from '@/lib/agents/provider-config';

/**
 * GET /api/agents/providers
 * 
 * Returns all available LLM providers and their models
 * Used by the ProviderSelector component to populate dropdowns
 */
export async function GET(req: NextRequest) {
    try {
        // Build provider list with relevant metadata
        const providers = Object.keys(PROVIDER_CONFIGS).map(key => {
            const config = PROVIDER_CONFIGS[key as ProviderType];
            return {
                id: key,
                name: config.name,
                baseURL: config.baseURL,
                capabilities: {
                    streaming: config.supportsStreaming,
                    vision: config.supportsVision,
                    tools: config.supportsTools
                },
                rateLimit: config.rateLimit
            };
        });

        // Get all available models across all providers
        const models = getAllAvailableModels();

        // Get default provider from environment
        const defaultProvider = process.env.LLM_PROVIDER || 'openrouter';

        return NextResponse.json({ 
            providers, 
            models,
            defaultProvider
        });
    } catch (error: any) {
        console.error('[GET /api/agents/providers] Error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch providers' }, 
            { status: 500 }
        );
    }
}
