export type ProviderType = 'openrouter' | 'groq' | 'aiml';

// Provider priority order for automatic failover
export const PROVIDER_FAILOVER_ORDER: ProviderType[] = ['openrouter', 'groq', 'aiml'];

export interface ProviderConfig {
    name: string;
    baseURL: string;
    authHeader: 'Authorization' | 'X-API-Key';
    authPrefix: 'Bearer' | ''; // Some APIs don't use "Bearer"
    defaultModel: string;
    modelMappings: Record<string, string>; // Map generic agent roles to provider models
    supportsStreaming: boolean;
    supportsVision: boolean;
    supportsTools: boolean;
    rateLimit: {
        requestsPerMinute: number;
        requestsPerDay: number;
    };
}

export const PROVIDER_CONFIGS: Record<ProviderType, ProviderConfig> = {
    openrouter: {
        name: 'OpenRouter',
        baseURL: 'https://openrouter.ai/api/v1',
        authHeader: 'Authorization',
        authPrefix: 'Bearer',
        defaultModel: 'nex-agi/nex-n2-pro:free',
        modelMappings: {
            'fast': 'nex-agi/nex-n2-pro:free',
            'reasoning': 'nvidia/nemotron-3-ultra-550b-a55b:free',
            'code': 'nex-agi/nex-n2-pro:free',
            'vision': 'nvidia/nemotron-3-ultra-550b-a55b:free'
        },
        supportsStreaming: true,
        supportsVision: true,
        supportsTools: true,
        rateLimit: { requestsPerMinute: 20, requestsPerDay: 50 }
    },
    groq: {
        name: 'Groq Cloud',
        baseURL: 'https://api.groq.com/openai/v1',
        authHeader: 'Authorization',
        authPrefix: 'Bearer',
        defaultModel: 'llama-3.3-70b-versatile',
        modelMappings: {
            'fast': 'llama-3.3-70b-versatile',
            'reasoning': 'llama-3.3-70b-versatile',
            'code': 'llama-3.3-70b-versatile',
            'vision': 'llama-3.3-70b-versatile'
        },
        supportsStreaming: true,
        supportsVision: false,
        supportsTools: true,
        rateLimit: { requestsPerMinute: 30, requestsPerDay: 1000 }
    },
    aiml: {
        name: 'AIML API',
        baseURL: 'https://api.aimlapi.com/v1',
        authHeader: 'Authorization',
        authPrefix: 'Bearer',
        defaultModel: 'openai/gpt-4.1-nano-2025-04-14',
        modelMappings: {
            'fast': 'openai/gpt-4.1-nano-2025-04-14',
            'reasoning': 'deepseek/deepseek-v4-flash',
            'code': 'openai/gpt-4.1-nano-2025-04-14',
            'vision': 'gpt-4o-mini'
        },
        supportsStreaming: true,
        supportsVision: true,
        supportsTools: true,
        rateLimit: { requestsPerMinute: 60, requestsPerDay: 10000 }
    }
};

// Helper to get active provider from environment
export function getActiveProvider(): ProviderType {
    const provider = process.env.LLM_PROVIDER as ProviderType;
    if (!provider || !PROVIDER_CONFIGS[provider]) {
        console.warn(`Invalid LLM_PROVIDER: ${provider}, defaulting to openrouter`);
        return 'openrouter';
    }
    return provider;
}

// NEW: Get next provider in failover chain
export function getNextProvider(currentProvider: ProviderType): ProviderType | null {
    const currentIndex = PROVIDER_FAILOVER_ORDER.indexOf(currentProvider);
    const nextIndex = currentIndex + 1;
    
    if (nextIndex >= PROVIDER_FAILOVER_ORDER.length) {
        return null; // No more providers to try
    }
    
    return PROVIDER_FAILOVER_ORDER[nextIndex];
}

// ============================================
// Model Options & Metadata
// ============================================

export interface ModelOption {
    id: string;               // e.g., 'nvidia/nemotron-3-ultra-550b-a55b:free'
    name: string;             // Display name: 'Nemotron Ultra 550B (Free)'
    provider: ProviderType;
    capabilities: {
        streaming: boolean;
        vision: boolean;
        tools: boolean;
    };
    contextWindow: number;
    pricing: {
        inputPerMToken: number;   // Input cost per million tokens
        outputPerMToken: number;  // Output cost per million tokens
        free: boolean;
    };
}

export const AVAILABLE_MODELS: Record<ProviderType, ModelOption[]> = {
    openrouter: [
        {
            id: 'nvidia/nemotron-3-ultra-550b-a55b:free',
            name: 'Nemotron Ultra 550B (Free)',
            provider: 'openrouter',
            capabilities: { streaming: true, vision: true, tools: true },
            contextWindow: 32000,
            pricing: { inputPerMToken: 0, outputPerMToken: 0, free: true }
        },
        {
            id: 'nex-agi/nex-n2-pro:free',
            name: 'Nex N2 Pro (Free)',
            provider: 'openrouter',
            capabilities: { streaming: true, vision: false, tools: true },
            contextWindow: 16000,
            pricing: { inputPerMToken: 0, outputPerMToken: 0, free: true }
        },
        {
            id: 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free',
            name: 'Nemotron Nano Omni 30B Reasoning (Free)',
            provider: 'openrouter',
            capabilities: { streaming: true, vision: false, tools: true },
            contextWindow: 8000,
            pricing: { inputPerMToken: 0, outputPerMToken: 0, free: true }
        }
    ],
    groq: [
        {
            id: 'llama-3.3-70b-versatile',
            name: 'Llama 3.3 70B Versatile',
            provider: 'groq',
            capabilities: { streaming: true, vision: false, tools: true },
            contextWindow: 32000,
            pricing: { inputPerMToken: 0, outputPerMToken: 0, free: true }
        },
        {
            id: 'openai/gpt-oss-120b',
            name: 'GPT OSS 120B',
            provider: 'groq',
            capabilities: { streaming: true, vision: false, tools: true },
            contextWindow: 32000,
            pricing: { inputPerMToken: 0, outputPerMToken: 0, free: true }
        },
        {
            id: 'openai/gpt-oss-20b',
            name: 'GPT OSS 20B',
            provider: 'groq',
            capabilities: { streaming: true, vision: false, tools: true },
            contextWindow: 32000,
            pricing: { inputPerMToken: 0, outputPerMToken: 0, free: true }
        }
    ],
    aiml: [
        {
            id: 'openai/gpt-4.1-nano-2025-04-14',
            name: 'GPT-4.1 Nano (Cheapest)',
            provider: 'aiml',
            capabilities: { streaming: true, vision: false, tools: true },
            contextWindow: 128000,
            pricing: { inputPerMToken: 0.10, outputPerMToken: 0.40, free: false }
        },
        {
            id: 'gpt-4o-mini',
            name: 'GPT-4o Mini (Best Conversation)',
            provider: 'aiml',
            capabilities: { streaming: true, vision: true, tools: true },
            contextWindow: 128000,
            pricing: { inputPerMToken: 0.15, outputPerMToken: 0.60, free: false }
        },
        {
            id: 'deepseek/deepseek-v4-flash',
            name: 'DeepSeek V4 Flash',
            provider: 'aiml',
            capabilities: { streaming: true, vision: false, tools: true },
            contextWindow: 128000,
            pricing: { inputPerMToken: 0.14, outputPerMToken: 0.28, free: false }
        },
        {
            id: 'alibaba/qwen3.6-flash',
            name: 'Qwen 3.6 Flash',
            provider: 'aiml',
            capabilities: { streaming: true, vision: false, tools: true },
            contextWindow: 32000,
            pricing: { inputPerMToken: 0, outputPerMToken: 0, free: true }
        }
    ]
};

// ============================================
// Helper Functions
// ============================================

/**
 * Get all available models across all providers
 */
export function getAllAvailableModels(): ModelOption[] {
    return Object.values(AVAILABLE_MODELS).flat();
}

/**
 * Get models for a specific provider
 */
export function getModelsForProvider(provider: ProviderType): ModelOption[] {
    return AVAILABLE_MODELS[provider] || [];
}

/**
 * Get model details by ID
 */
export function getModelById(modelId: string): ModelOption | undefined {
    return getAllAvailableModels().find(m => m.id === modelId);
}

/**
 * Validate provider + model combination
 */
export function isValidProviderModel(provider: ProviderType, modelId: string): boolean {
    const models = getModelsForProvider(provider);
    return models.some(m => m.id === modelId);
}

/**
 * Validation error class
 */
export class ProviderValidationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'ProviderValidationError';
    }
}

/**
 * Validate provider/model combination before API call
 * Returns validation result with fallback options if invalid
 */
export function validateProviderModel(
    provider: ProviderType | undefined,
    model: string | undefined
): { valid: boolean; error?: string; fallback?: { provider: ProviderType; model: string } } {
    // If no provider specified, use default
    if (!provider) {
        const defaultProvider = getActiveProvider();
        const defaultConfig = PROVIDER_CONFIGS[defaultProvider];
        return {
            valid: true,
            fallback: { provider: defaultProvider, model: defaultConfig.defaultModel }
        };
    }

    // Validate provider exists
    if (!PROVIDER_CONFIGS[provider]) {
        return {
            valid: false,
            error: `Invalid provider: ${provider}`,
            fallback: { provider: 'openrouter', model: PROVIDER_CONFIGS.openrouter.defaultModel }
        };
    }

    // If no model specified, use provider's default
    if (!model) {
        return {
            valid: true,
            fallback: { provider, model: PROVIDER_CONFIGS[provider].defaultModel }
        };
    }

    // Validate model exists for this provider
    const validModel = isValidProviderModel(provider, model);
    if (!validModel) {
        return {
            valid: false,
            error: `Model ${model} not available for provider ${provider}`,
            fallback: { provider, model: PROVIDER_CONFIGS[provider].defaultModel }
        };
    }

    return { valid: true };
}

export function getProviderConfig(provider?: ProviderType): ProviderConfig {
    const activeProvider = provider || getActiveProvider();
    const config = PROVIDER_CONFIGS[activeProvider];
    if (!config) {
        console.warn(`Invalid provider: ${activeProvider}, falling back to openrouter`);
        return PROVIDER_CONFIGS['openrouter'];
    }
    return config;
}
