# Provider & Model Selection Implementation Plan

## Executive Summary

This plan adds **user-selectable LLM provider and model** to the /build/{id} page, replacing the hardcoded `LLM_PROVIDER` environment variable with runtime configuration.

**Current State:**
- Provider selected via `LLM_PROVIDER` env var (default: openrouter)
- Single free model per provider in `modelMappings`
- Good abstraction layer already exists (`provider-config.ts`, `key-manager.ts`)

**Target State:**
- Users select provider + model via UI dropdown on /build/{id}
- Selection persisted per chat session in database
- Backend dynamically uses selected provider/model
- Extensible architecture for adding new providers/models

---

## Part 1: Current Implementation Analysis

### 1.1 Request Flow (Confirmed)

```
User Message (AIAssistantUI.jsx)
  ↓
POST /api/agents/chat (route.ts)
  ↓
AssemblyLineOrchestrator.chat() (orchestrator.ts)
  ↓
AgentRunner.runAgent(agentType, messages)
  ↓
executeWithRetry() → wraps API call with failover
  ↓
ProviderClient.getInstance() → creates OpenAI client
  ↓
KeyManager.getCurrentKey() → fetches API key
  ↓
getProviderConfig() → reads from PROVIDER_CONFIGS[LLM_PROVIDER]
  ↓
getModelForAgent(agentType) → maps agent → modelRole → actual model
  ↓
client.chat.completions.create({ model, messages, ... })
```

### 1.2 Key Files Identified

**Frontend:**
- `components/ai_chat/AIAssistantUI.jsx` - Main chat interface
- `components/text_area/ProjectCreator.tsx` - Initial project form
- `lib/hooks/use-chat.ts` - Chat state management

**Backend:**
- `app/api/agents/chat/route.ts` - Chat API endpoint (SSE)
- `lib/agents/orchestrator.ts` - AgentRunner + ProviderClient
- `lib/agents/provider-config.ts` - Provider configurations
- `lib/agents/key-manager.ts` - API key rotation
- `lib/agents/config.ts` - Agent definitions + model roles

**Database:**
- `lib/db/chat.ts` - Chat/message CRUD operations
- `lib/supabase/types.ts` - Database schema types

**Current Provider Config (`lib/agents/provider-config.ts`):**
```typescript
PROVIDER_CONFIGS = {
  openrouter: {
    baseURL: 'https://openrouter.ai/api/v1',
    defaultModel: 'nvidia/nemotron-3-ultra-550b-a55b:free',
    modelMappings: { fast: '...', reasoning: '...', code: '...', vision: '...' }
  },
  groq: {
    baseURL: 'https://api.groq.com/openai/v1',
    defaultModel: 'openai/gpt-oss-120b',
    // ...
  },
  aiml: {
    baseURL: 'https://api.aimlapi.com/v1',
    defaultModel: 'alibaba/qwen3.6-flash',
    // ...
  }
}
```

### 1.3 Current Limitations

1. **Provider selection:** Hardcoded in `.env.local` (`LLM_PROVIDER=openrouter`)
2. **Model selection:** All `modelRole` values map to same model per provider
3. **No user choice:** Users cannot override provider/model at runtime
4. **No persistence:** No database field to store user's provider/model preference

---

## Part 2: Database Schema Changes

### 2.1 Add Provider/Model Fields to `chat_sessions` Table

**Migration Required:**
```sql
ALTER TABLE chat_sessions 
  ADD COLUMN selected_provider TEXT DEFAULT 'openrouter',
  ADD COLUMN selected_model TEXT,
  ADD COLUMN provider_metadata JSONB DEFAULT '{}'::jsonb;

-- Index for faster lookups
CREATE INDEX idx_chat_sessions_provider ON chat_sessions(selected_provider);
```

**TypeScript Type Updates (`lib/supabase/types.ts`):**
```typescript
export interface ChatSession {
  // ... existing fields
  selected_provider: 'openrouter' | 'groq' | 'aiml' | null;
  selected_model: string | null;
  provider_metadata: Record<string, any>;
}
```


**Rationale:**
- `selected_provider`: User's choice of LLM provider (defaults to 'openrouter')
- `selected_model`: Specific model string (e.g., 'nvidia/nemotron-3-ultra-550b-a55b:free')
- `provider_metadata`: Future extensibility (pricing tiers, custom endpoints, etc.)

---

## Part 3: Backend Architecture Changes

### 3.1 Extend Provider Configurations

**File:** `lib/agents/provider-config.ts`

**Add Model Definitions:**
```typescript
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
      id: 'openai/gpt-oss-120b',
      name: 'GPT OSS 120B',
      provider: 'groq',
      capabilities: { streaming: true, vision: false, tools: true },
      contextWindow: 32000,
      pricing: { inputPerMToken: 0, outputPerMToken: 0, free: true }
    }
  ],
  aiml: [
    {
      id: 'alibaba/qwen3.6-flash',
      name: 'Qwen 3.6 Flash',
      provider: 'aiml',
      capabilities: { streaming: true, vision: false, tools: true },
      contextWindow: 32000,
      pricing: { inputPerMToken: 0, outputPerMToken: 0, free: true }
    }
  ]
}
```


**Add Helper Functions:**
```typescript
// Get all available models across all providers
export function getAllAvailableModels(): ModelOption[] {
  return Object.values(AVAILABLE_MODELS).flat();
}

// Get models for a specific provider
export function getModelsForProvider(provider: ProviderType): ModelOption[] {
  return AVAILABLE_MODELS[provider] || [];
}

// Get model details by ID
export function getModelById(modelId: string): ModelOption | undefined {
  return getAllAvailableModels().find(m => m.id === modelId);
}

// Validate provider + model combination
export function isValidProviderModel(provider: ProviderType, modelId: string): boolean {
  const models = getModelsForProvider(provider);
  return models.some(m => m.id === modelId);
}
```

### 3.2 Modify `getProviderConfig()` to Accept Dynamic Provider

**Current:**
```typescript
export function getProviderConfig(): ProviderConfig {
  const provider = process.env.LLM_PROVIDER as ProviderType || 'openrouter';
  return PROVIDER_CONFIGS[provider];
}
```

**New:**
```typescript
export function getProviderConfig(overrideProvider?: ProviderType): ProviderConfig {
  const provider = overrideProvider || (process.env.LLM_PROVIDER as ProviderType) || 'openrouter';
  const config = PROVIDER_CONFIGS[provider];
  if (!config) {
    console.warn(`Invalid provider: ${provider}, falling back to openrouter`);
    return PROVIDER_CONFIGS['openrouter'];
  }
  return config;
}
```

### 3.3 Update `getModelForAgent()` to Support Override Model

**Current:**
```typescript
export function getModelForAgent(agentType: AgentType): string {
  const agent = AGENTS[agentType];
  const providerConfig = getProviderConfig();
  return providerConfig.modelMappings[agent.modelRole] || providerConfig.defaultModel;
}
```

**New:**
```typescript
export function getModelForAgent(
  agentType: AgentType, 
  overrideProvider?: ProviderType,
  overrideModel?: string
): string {
  // If explicit model override provided, use it
  if (overrideModel) {
    const modelOption = getModelById(overrideModel);
    if (modelOption && modelOption.provider === (overrideProvider || getActiveProvider())) {
      return overrideModel;
    }
    console.warn(`Invalid model override: ${overrideModel}, falling back to default`);
  }

  // Otherwise use provider's model mapping
  const agent = AGENTS[agentType];
  const providerConfig = getProviderConfig(overrideProvider);
  return providerConfig.modelMappings[agent.modelRole] || providerConfig.defaultModel;
}
```


### 3.4 Update KeyManager to Support Dynamic Provider Loading

**File:** `lib/agents/key-manager.ts`

**Current:** `loadKeys()` is private and called once in constructor

**Change:** Make it support dynamic provider switching at runtime

```typescript
/**
 * Reload keys for a specific provider (public method)
 */
public reloadKeysForProvider(provider: ProviderType): void {
  this.loadKeys(provider);
}

/**
 * Get current provider being used
 */
public getCurrentProvider(): string {
  return this.currentProvider;
}
```

### 3.5 Update AgentRunner to Accept Provider/Model Overrides

**File:** `lib/agents/orchestrator.ts`

**Modify `runAgent()` signature:**
```typescript
async runAgent(
  agentType: AgentType,
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>,
  options?: {
    onStream?: (chunk: string) => void;
    stream?: boolean;
    onToolCall?: (toolCall: ToolCall) => Promise<any>;
    chatId?: string;
    // NEW: Runtime provider/model overrides
    overrideProvider?: ProviderType;
    overrideModel?: string;
  }
): Promise<{ response: string; toolCalls?: ToolCall[] }>
```

**Update implementation to use overrides:**
```typescript
// Inside runAgent()
const agentConfig = AGENTS[agentType];
const actualModel = getModelForAgent(
  agentType, 
  options?.overrideProvider, 
  options?.overrideModel
);
const providerConfig = getProviderConfig(options?.overrideProvider);

// Ensure KeyManager has correct provider keys loaded
const keyManager = KeyManager.getInstance();
if (options?.overrideProvider && keyManager.getCurrentProvider() !== options.overrideProvider) {
  keyManager.reloadKeysForProvider(options.overrideProvider);
}

// ... rest of implementation
```

### 3.6 Update Orchestrator to Load Session Provider/Model

**File:** `lib/agents/orchestrator.ts`

**Modify `chat()` method to:**
1. Load `chat_sessions` record to get `selected_provider` and `selected_model`
2. Pass them as overrides to `runAgent()`

```typescript
async chat(
  message: string,
  onStream?: (chunk: string) => void,
  forceAgent?: AgentType,
  // ... other callbacks
): Promise<OrchestrationResult> {
  // Step 1: Load chat session preferences
  const { data: session } = await supabase
    .from('chat_sessions')
    .select('selected_provider, selected_model')
    .eq('chat_id', this.chatId)
    .single();

  const overrideProvider = session?.selected_provider as ProviderType | undefined;
  const overrideModel = session?.selected_model || undefined;

  // Step 2: Run agents with overrides
  const result = await this.agentRunner.runAgent(agentType, messages, {
    onStream,
    chatId: this.chatId,
    overrideProvider,
    overrideModel
  });

  // ... rest of implementation
}
```


---

## Part 4: API Contract Changes

### 4.1 New API Endpoint: Get Available Providers/Models

**File:** `app/api/agents/providers/route.ts` (NEW)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getAllAvailableModels, PROVIDER_CONFIGS, type ProviderType } from '@/lib/agents/provider-config';

export async function GET(req: NextRequest) {
  try {
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

    const models = getAllAvailableModels();

    return NextResponse.json({ 
      providers, 
      models,
      defaultProvider: process.env.LLM_PROVIDER || 'openrouter'
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

### 4.2 New API Endpoint: Update Session Provider/Model

**File:** `app/api/chat/[chatId]/provider/route.ts` (NEW)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import { isValidProviderModel, type ProviderType } from '@/lib/agents/provider-config';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { chatId: string } }
) {
  try {
    const { provider, model } = await req.json();

    // Validation
    if (!provider || !['openrouter', 'groq', 'aiml'].includes(provider)) {
      return NextResponse.json({ error: 'Invalid provider' }, { status: 400 });
    }

    if (model && !isValidProviderModel(provider as ProviderType, model)) {
      return NextResponse.json({ 
        error: 'Invalid model for selected provider' 
      }, { status: 400 });
    }

    // Update chat_sessions
    const { data, error } = await supabase
      .from('chat_sessions')
      .update({ 
        selected_provider: provider,
        selected_model: model || null
      })
      .eq('chat_id', params.chatId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ 
      success: true, 
      session: data 
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { chatId: string } }
) {
  try {
    const { data, error } = await supabase
      .from('chat_sessions')
      .select('selected_provider, selected_model')
      .eq('chat_id', params.chatId)
      .single();

    if (error) throw error;

    return NextResponse.json({ 
      provider: data.selected_provider || 'openrouter',
      model: data.selected_model
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```


---

## Part 5: Frontend UI Changes

### 5.1 Create Provider/Model Selector Component

**File:** `components/ai_chat/ProviderSelector.tsx` (NEW)

```tsx
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
  const [selectedProvider, setSelectedProvider] = useState<string>('openrouter');
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // Load available providers and models
  useEffect(() => {
    fetch('/api/agents/providers')
      .then(res => res.json())
      .then(data => {
        setProviders(data.providers);
        setModels(data.models);
        setSelectedProvider(data.defaultProvider);
      });
  }, []);

  // Load current session preferences
  useEffect(() => {
    if (chatId) {
      fetch(`/api/chat/${chatId}/provider`)
        .then(res => res.json())
        .then(data => {
          setSelectedProvider(data.provider || 'openrouter');
          setSelectedModel(data.model || '');
        });
    }
  }, [chatId]);

  const handleProviderChange = async (newProvider: string) => {
    setSelectedProvider(newProvider);
    setSelectedModel(''); // Reset model when provider changes
    await updateSession(newProvider, '');
  };

  const handleModelChange = async (newModel: string) => {
    setSelectedModel(newModel);
    await updateSession(selectedProvider, newModel);
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
        onProviderChange?.(provider, model);
      }
    } finally {
      setLoading(false);
    }
  };

  const filteredModels = models.filter(m => m.provider === selectedProvider);

  return (
    <div className="flex gap-4 items-end">
      <div className="flex-1">
        <Label htmlFor="provider">LLM Provider</Label>
        <Select value={selectedProvider} onValueChange={handleProviderChange} disabled={loading}>
          <SelectTrigger id="provider">
            <SelectValue placeholder="Select provider" />
          </SelectTrigger>
          <SelectContent>
            {providers.map(p => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex-1">
        <Label htmlFor="model">Model</Label>
        <Select value={selectedModel} onValueChange={handleModelChange} disabled={loading || !filteredModels.length}>
          <SelectTrigger id="model">
            <SelectValue placeholder="Auto-select" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Auto-select (Default)</SelectItem>
            {filteredModels.map(m => (
              <SelectItem key={m.id} value={m.id}>
                <div className="flex items-center gap-2">
                  {m.name}
                  {m.pricing.free && <Badge variant="secondary" className="text-xs">Free</Badge>}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
```


### 5.2 Integrate ProviderSelector into AIAssistantUI

**File:** `components/ai_chat/AIAssistantUI.jsx`

**Add to imports:**
```javascript
import { ProviderSelector } from './ProviderSelector';
```

**Add state for provider selection notification:**
```javascript
const [providerChanged, setProviderChanged] = useState(false);
```

**Add ProviderSelector to UI (near chat input area):**
```jsx
{/* Add above or near the ChatInput component */}
<div className="mb-4 p-4 bg-muted/30 rounded-lg">
  <ProviderSelector 
    chatId={chatId} 
    onProviderChange={(provider, model) => {
      console.log('Provider changed:', provider, model);
      setProviderChanged(true);
      // Optionally show toast notification
    }}
  />
  {providerChanged && (
    <p className="text-xs text-muted-foreground mt-2">
      Provider settings updated. Changes apply to new messages.
    </p>
  )}
</div>
```

**Placement Recommendation:**
- Position above the `ChatInput` component
- Or in a collapsible "Settings" panel in the header
- Or as a dropdown in the top navigation bar

---

## Part 6: Data Persistence & Migration

### 6.1 Database Migration Script

**File:** `migrations/add_provider_selection.sql` (NEW)

```sql
-- Add provider/model selection fields to chat_sessions
ALTER TABLE chat_sessions 
  ADD COLUMN IF NOT EXISTS selected_provider TEXT DEFAULT 'openrouter',
  ADD COLUMN IF NOT EXISTS selected_model TEXT,
  ADD COLUMN IF NOT EXISTS provider_metadata JSONB DEFAULT '{}'::jsonb;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_chat_sessions_provider 
  ON chat_sessions(selected_provider);

-- Add comment for documentation
COMMENT ON COLUMN chat_sessions.selected_provider IS 
  'User-selected LLM provider (openrouter, groq, aiml)';
COMMENT ON COLUMN chat_sessions.selected_model IS 
  'Specific model ID (e.g., nvidia/nemotron-3-ultra-550b-a55b:free)';
COMMENT ON COLUMN chat_sessions.provider_metadata IS 
  'Additional provider-specific configuration (JSON)';

-- Backfill existing sessions with default provider
UPDATE chat_sessions 
  SET selected_provider = 'openrouter'
  WHERE selected_provider IS NULL;
```

### 6.2 Update ChatService to Initialize Provider Defaults

**File:** `lib/db/chat.ts`

**Modify `createChat()` and `createChatWithId()`:**
```typescript
// Create a companion session for multi-agent state WITH default provider
const { error: sessionError } = await supabase
  .from('chat_sessions')
  .insert({ 
    chat_id: chat.id,
    selected_provider: 'openrouter', // Default provider
    selected_model: null              // Will use provider's default model
  })
```


---

## Part 7: Validation & Error Handling

### 7.1 Provider/Model Validation

**Add to `lib/agents/provider-config.ts`:**

```typescript
export class ProviderValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ProviderValidationError';
  }
}

// Validate provider/model combination before API call
export function validateProviderModel(
  provider: ProviderType | undefined, 
  model: string | undefined
): { valid: boolean; error?: string; fallback?: { provider: ProviderType; model: string } } {
  // If no provider specified, use default
  if (!provider) {
    const defaultProvider = (process.env.LLM_PROVIDER as ProviderType) || 'openrouter';
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
```

### 7.2 Error Handling in Orchestrator

**Update `lib/agents/orchestrator.ts`:**

```typescript
async chat(...) {
  // ... load session preferences

  // Validate and apply fallback if needed
  const validation = validateProviderModel(
    session?.selected_provider as ProviderType | undefined,
    session?.selected_model || undefined
  );

  if (!validation.valid) {
    console.warn(`Provider validation failed: ${validation.error}, using fallback`);
    // Optionally notify user via SSE
    onStream?.(`[System: ${validation.error}, using fallback]\n\n`);
  }

  const finalProvider = validation.fallback?.provider || overrideProvider;
  const finalModel = validation.fallback?.model || overrideModel;

  // ... continue with validated provider/model
}
```

### 7.3 Handle Missing API Keys Gracefully

**Update `lib/agents/key-manager.ts`:**

```typescript
private loadKeys(provider?: string) {
  try {
    // ... existing key loading logic
  } catch (error) {
    // Instead of throwing immediately, try next provider in failover chain
    console.error(`Failed to load keys for ${provider}:`, error.message);
    const nextProvider = getNextProvider(provider as ProviderType);
    
    if (nextProvider) {
      console.log(`Attempting failover to ${nextProvider}...`);
      return this.loadKeys(nextProvider);
    }
    
    throw new Error(`No valid API keys found for any provider. Please configure at least one provider in .env.local`);
  }
}
```


---

## Part 8: Testing Strategy

### 8.1 Unit Tests

**Test Provider Configuration:**
```typescript
// tests/lib/agents/provider-config.test.ts
describe('Provider Configuration', () => {
  test('getModelsForProvider returns correct models', () => {
    const models = getModelsForProvider('openrouter');
    expect(models.length).toBeGreaterThan(0);
    expect(models[0].provider).toBe('openrouter');
  });

  test('isValidProviderModel validates correctly', () => {
    expect(isValidProviderModel('openrouter', 'nvidia/nemotron-3-ultra-550b-a55b:free')).toBe(true);
    expect(isValidProviderModel('groq', 'nvidia/nemotron-3-ultra-550b-a55b:free')).toBe(false);
    expect(isValidProviderModel('invalid' as any, 'any-model')).toBe(false);
  });

  test('validateProviderModel handles fallbacks', () => {
    const result = validateProviderModel('groq', 'invalid-model');
    expect(result.valid).toBe(false);
    expect(result.fallback).toBeDefined();
    expect(result.fallback?.provider).toBe('groq');
  });
});
```

**Test API Endpoints:**
```typescript
// tests/app/api/agents/providers.test.ts
describe('GET /api/agents/providers', () => {
  test('returns all providers and models', async () => {
    const res = await fetch('/api/agents/providers');
    const data = await res.json();
    
    expect(data.providers).toBeDefined();
    expect(data.models).toBeDefined();
    expect(data.defaultProvider).toBe('openrouter');
  });
});

describe('PATCH /api/chat/[chatId]/provider', () => {
  test('updates session provider/model', async () => {
    const res = await fetch('/api/chat/test-chat-id/provider', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider: 'groq', model: 'openai/gpt-oss-120b' })
    });
    
    expect(res.ok).toBe(true);
    const data = await res.json();
    expect(data.success).toBe(true);
  });

  test('rejects invalid provider', async () => {
    const res = await fetch('/api/chat/test-chat-id/provider', {
      method: 'PATCH',
      body: JSON.stringify({ provider: 'invalid' })
    });
    
    expect(res.status).toBe(400);
  });
});
```

### 8.2 Integration Tests

**Test End-to-End Flow:**
```typescript
describe('Provider Selection E2E', () => {
  test('User selects provider → stored in DB → used in next message', async () => {
    // 1. Create chat
    const chat = await ChatService.createChat('test-user-id');
    
    // 2. Update provider/model
    await fetch(`/api/chat/${chat.id}/provider`, {
      method: 'PATCH',
      body: JSON.stringify({ provider: 'groq', model: 'openai/gpt-oss-120b' })
    });
    
    // 3. Send message
    const res = await fetch('/api/agents/chat', {
      method: 'POST',
      body: JSON.stringify({ chatId: chat.id, message: 'Hello' })
    });
    
    // 4. Verify correct provider used (check logs or response metadata)
    // This would require adding provider info to response metadata
  });
});
```

### 8.3 Manual Testing Checklist

**UI Testing:**
- [ ] Provider dropdown shows all providers (OpenRouter, Groq, AIML)
- [ ] Model dropdown updates when provider changes
- [ ] Selected provider/model persists across page refreshes
- [ ] Loading states work correctly
- [ ] Error messages display when API calls fail

**Backend Testing:**
- [ ] Chat API uses session's selected provider/model
- [ ] Fallback to default provider when invalid selection
- [ ] Key rotation works across all providers
- [ ] Provider failover chain works (OpenRouter → Groq → AIML)
- [ ] Error messages are descriptive when all keys exhausted

**Database Testing:**
- [ ] Migration adds columns without data loss
- [ ] New chats get default provider
- [ ] Provider updates persist correctly
- [ ] Queries perform well with new indexes


---

## Part 9: Extensibility & Future Enhancements

### 9.1 Adding New Providers

**To add a new provider (e.g., Anthropic):**

1. **Add provider config** (`lib/agents/provider-config.ts`):
```typescript
export type ProviderType = 'openrouter' | 'groq' | 'aiml' | 'anthropic';

PROVIDER_CONFIGS.anthropic = {
  name: 'Anthropic',
  baseURL: 'https://api.anthropic.com/v1',
  authHeader: 'X-API-Key',
  authPrefix: '',
  defaultModel: 'claude-3-5-sonnet-20240620',
  modelMappings: {
    fast: 'claude-3-5-haiku-20241022',
    reasoning: 'claude-3-5-sonnet-20240620',
    code: 'claude-3-5-sonnet-20240620',
    vision: 'claude-3-5-sonnet-20240620'
  },
  supportsStreaming: true,
  supportsVision: true,
  supportsTools: true,
  rateLimit: { requestsPerMinute: 50, requestsPerDay: 10000 }
};

AVAILABLE_MODELS.anthropic = [
  {
    id: 'claude-3-5-sonnet-20240620',
    name: 'Claude 3.5 Sonnet',
    provider: 'anthropic',
    capabilities: { streaming: true, vision: true, tools: true },
    contextWindow: 200000,
    pricing: { inputPerMToken: 3, outputPerMToken: 15, free: false }
  }
];
```

2. **Add environment variables**:
```bash
ANTHROPIC_API_KEY_1=sk-ant-...
ANTHROPIC_API_KEY_2=sk-ant-...
```

3. **Update failover order** (optional):
```typescript
export const PROVIDER_FAILOVER_ORDER: ProviderType[] = 
  ['openrouter', 'groq', 'aiml', 'anthropic'];
```

### 9.2 Adding Cost Tracking

**Create cost tracking table:**
```sql
CREATE TABLE llm_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID REFERENCES chats(id) ON DELETE CASCADE,
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  input_tokens INT NOT NULL,
  output_tokens INT NOT NULL,
  estimated_cost_usd DECIMAL(10, 6),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_llm_usage_chat ON llm_usage(chat_id);
CREATE INDEX idx_llm_usage_provider ON llm_usage(provider);
```

**Track usage in AgentRunner:**
```typescript
// After successful API call
const usage = response.usage;
if (usage && modelOption?.pricing) {
  const cost = calculateCost(usage, modelOption.pricing);
  await trackUsage(chatId, messageId, provider, model, usage.prompt_tokens, usage.completion_tokens, cost);
}
```

### 9.3 Per-User Provider Preferences

**Add user-level defaults:**
```sql
CREATE TABLE user_preferences (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  default_provider TEXT DEFAULT 'openrouter',
  default_model TEXT,
  preferences JSONB DEFAULT '{}'::jsonb
);
```

**Load user defaults when creating new chat:**
```typescript
// In ChatService.createChat()
const { data: prefs } = await supabase
  .from('user_preferences')
  .select('default_provider, default_model')
  .eq('user_id', userId)
  .single();

await supabase.from('chat_sessions').insert({
  chat_id: chat.id,
  selected_provider: prefs?.default_provider || 'openrouter',
  selected_model: prefs?.default_model || null
});
```

### 9.4 Model Capability Detection

**Add capability checks before calling specific features:**
```typescript
function supportsVision(provider: ProviderType, model: string): boolean {
  const modelOption = getModelById(model);
  return modelOption?.capabilities.vision ?? false;
}

// Use in agent runner
if (hasImageAttachment && !supportsVision(overrideProvider, overrideModel)) {
  throw new Error('Selected model does not support vision. Please choose a vision-capable model.');
}
```


---

## Part 10: Implementation Roadmap

### Phase 1: Backend Infrastructure (3-4 hours)

**Files to create/modify:**
1. ✅ `migrations/add_provider_selection.sql` - Database migration
2. ✅ `lib/agents/provider-config.ts` - Add `AVAILABLE_MODELS`, helper functions, validation
3. ✅ `lib/agents/config.ts` - Update `getModelForAgent()` to accept overrides
4. ✅ `lib/agents/key-manager.ts` - Add `reloadKeysForProvider()`, `getCurrentProvider()`
5. ✅ `lib/agents/orchestrator.ts` - Update `runAgent()` and `chat()` for overrides
6. ✅ `lib/supabase/types.ts` - Add provider fields to ChatSession type
7. ✅ `lib/db/chat.ts` - Initialize provider defaults in `createChat()`

**Tasks:**
- [ ] Run database migration on Supabase
- [ ] Update TypeScript types
- [ ] Implement provider/model validation logic
- [ ] Update KeyManager for dynamic provider switching
- [ ] Modify Orchestrator to load session preferences
- [ ] Test backend with curl/Postman

**Acceptance Criteria:**
- Database migration succeeds without errors
- Backend can dynamically switch providers based on chat_sessions table
- Validation catches invalid provider/model combinations
- Fallback logic works correctly

---

### Phase 2: API Endpoints (1-2 hours)

**Files to create:**
1. ✅ `app/api/agents/providers/route.ts` - GET available providers/models
2. ✅ `app/api/chat/[chatId]/provider/route.ts` - GET/PATCH session provider

**Tasks:**
- [ ] Implement GET /api/agents/providers
- [ ] Implement PATCH /api/chat/[chatId]/provider
- [ ] Implement GET /api/chat/[chatId]/provider
- [ ] Add request validation and error handling
- [ ] Test endpoints with Postman/Thunder Client

**Acceptance Criteria:**
- GET /api/agents/providers returns all providers and models
- PATCH updates chat_sessions correctly
- Invalid requests return 400 with clear error messages
- All endpoints have proper TypeScript types

---

### Phase 3: Frontend UI (2-3 hours)

**Files to create/modify:**
1. ✅ `components/ai_chat/ProviderSelector.tsx` - Provider/model dropdown component
2. ✅ `components/ai_chat/AIAssistantUI.jsx` - Integrate ProviderSelector
3. ✅ `components/ui/select.tsx` - Shadcn Select component (if not exists)
4. ✅ `components/ui/badge.tsx` - Badge component for "Free" tags

**Tasks:**
- [ ] Create ProviderSelector component with Shadcn UI
- [ ] Add state management for provider/model selection
- [ ] Integrate into AIAssistantUI
- [ ] Add loading states and error handling
- [ ] Style component to match existing UI
- [ ] Add toast notifications for changes

**Acceptance Criteria:**
- Dropdown displays all providers and models
- Selection persists across page refresh
- UI shows loading state during updates
- Error messages display clearly
- Component is responsive and accessible

---

### Phase 4: Testing & Validation (2-3 hours)

**Tasks:**
- [ ] Write unit tests for provider-config.ts
- [ ] Write API endpoint tests
- [ ] Test manual provider switching via UI
- [ ] Test provider failover when keys exhausted
- [ ] Test with all 3 providers (OpenRouter, Groq, AIML)
- [ ] Test invalid provider/model combinations
- [ ] Test with missing API keys
- [ ] Performance test with large chat histories

**Acceptance Criteria:**
- All unit tests pass
- Manual testing checklist complete
- No console errors in browser
- Provider switching works reliably
- Failover chain functions correctly

---

### Phase 5: Documentation & Deployment (1 hour)

**Tasks:**
- [ ] Update README with provider selection instructions
- [ ] Document environment variables for all providers
- [ ] Add inline code comments
- [ ] Create user guide for provider selection
- [ ] Deploy to staging environment
- [ ] Verify production environment variables
- [ ] Deploy to production

**Deliverables:**
- Updated README.md with provider setup instructions
- User documentation with screenshots
- Environment variable template (.env.example)
- Deployment checklist

---

## Part 11: File-by-File Changes Summary

### New Files (7 files)

1. **`migrations/add_provider_selection.sql`** (30 lines)
   - Database migration for provider fields

2. **`app/api/agents/providers/route.ts`** (40 lines)
   - GET endpoint for available providers/models

3. **`app/api/chat/[chatId]/provider/route.ts`** (80 lines)
   - GET/PATCH endpoints for session provider

4. **`components/ai_chat/ProviderSelector.tsx`** (150 lines)
   - Provider/model dropdown component

5. **`tests/lib/agents/provider-config.test.ts`** (80 lines)
   - Unit tests for provider configuration

6. **`tests/app/api/agents/providers.test.ts`** (60 lines)
   - API endpoint tests

7. **`docs/PROVIDER_SELECTION_GUIDE.md`** (100 lines)
   - User documentation

### Modified Files (7 files)

1. **`lib/agents/provider-config.ts`** (+200 lines)
   - Add `AVAILABLE_MODELS` constant
   - Add helper functions: `getAllAvailableModels()`, `getModelsForProvider()`, `getModelById()`, `isValidProviderModel()`, `validateProviderModel()`
   - Update `getProviderConfig()` to accept override parameter

2. **`lib/agents/config.ts`** (+20 lines)
   - Update `getModelForAgent()` to accept provider/model overrides

3. **`lib/agents/key-manager.ts`** (+30 lines)
   - Add `reloadKeysForProvider()` public method
   - Add `getCurrentProvider()` method
   - Improve error handling with provider failover

4. **`lib/agents/orchestrator.ts`** (+60 lines)
   - Update `runAgent()` signature to accept overrides
   - Update `chat()` to load session preferences from DB
   - Add validation before agent execution
   - Pass overrides through execution chain

5. **`lib/supabase/types.ts`** (+10 lines)
   - Add `selected_provider`, `selected_model`, `provider_metadata` to ChatSession type

6. **`lib/db/chat.ts`** (+10 lines)
   - Initialize default provider in `createChat()` and `createChatWithId()`

7. **`components/ai_chat/AIAssistantUI.jsx`** (+30 lines)
   - Import and integrate ProviderSelector
   - Add state for provider change notifications
   - Add UI placement for selector

---

## Part 12: Environment Variables Required

### For OpenRouter (Current)
```bash
OPENROUTER_API_KEY_1=sk-or-v1-...
OPENROUTER_API_KEY_2=sk-or-v1-...
OPENROUTER_API_KEY_3=sk-or-v1-...
```

### For Groq (Required for new feature)
```bash
GROQ_API_KEY_1=gsk_...
GROQ_API_KEY_2=gsk_...
```

### For AIML (Required for new feature)
```bash
AIML_API_KEY_1=...
AIML_API_KEY_2=...
```

### Optional (for default behavior)
```bash
LLM_PROVIDER=openrouter  # Can be overridden per chat
```

---

## Part 13: Security & Performance Considerations

### Security

1. **API Key Exposure:**
   - ✅ Keys stored in `.env.local` (not committed)
   - ✅ Never send keys to frontend
   - ✅ Keys loaded server-side only

2. **Input Validation:**
   - ✅ Validate provider against whitelist
   - ✅ Validate model against provider's available models
   - ✅ Sanitize user inputs in API routes

3. **Rate Limiting:**
   - ⚠️ Consider adding rate limiting per user/chat
   - ⚠️ Track usage to prevent abuse

### Performance

1. **Database Queries:**
   - ✅ Add index on `selected_provider` column
   - ✅ Use single query to load session preferences
   - ⚠️ Consider caching provider configs in memory

2. **Frontend:**
   - ✅ Load provider list once on mount
   - ✅ Debounce provider selection updates
   - ✅ Show loading states during updates

3. **Backend:**
   - ✅ Reuse ProviderClient singleton
   - ✅ Lazy-load KeyManager for selected provider
   - ⚠️ Add monitoring for provider failover events

---

## Part 14: Rollback Plan

### If Issues Arise Post-Deployment

1. **Database Rollback:**
```sql
ALTER TABLE chat_sessions 
  DROP COLUMN IF EXISTS selected_provider,
  DROP COLUMN IF EXISTS selected_model,
  DROP COLUMN IF EXISTS provider_metadata;
```

2. **Code Rollback:**
   - Revert to previous commit: `git revert <commit-hash>`
   - Or feature flag: Add `ENABLE_PROVIDER_SELECTION=false` env var

3. **Fallback Behavior:**
   - All chats will use `LLM_PROVIDER` from `.env.local`
   - Existing provider selection logic remains functional

---

## Part 15: Success Metrics

### Technical Metrics
- [ ] Zero database migration errors
- [ ] API response time < 200ms for provider endpoints
- [ ] UI renders provider selector in < 100ms
- [ ] Provider switching success rate > 99%
- [ ] Failover chain triggers within 1 second on key exhaustion

### User Experience Metrics
- [ ] Users can select provider without refreshing page
- [ ] Provider selection persists across sessions
- [ ] Error messages are clear and actionable
- [ ] No console errors during normal operation

---

## Next Steps

1. **Review this plan** with team/stakeholders
2. **Confirm database migration** approach (manual SQL vs. migration tool)
3. **Set up API keys** for Groq and AIML in staging environment
4. **Begin Phase 1** (Backend Infrastructure)
5. **Schedule code review** after Phase 3 completion

**Estimated Total Time:** 9-13 hours (1-2 days)

**Risk Level:** Low (existing abstraction makes this a clean extension)

---

## Questions for Review

1. Should provider selection be **per-chat** (current plan) or **per-user**?
2. Do we want to add **cost tracking** in this iteration or defer?
3. Should we implement **model capability detection** (vision, tools) now?
4. Do we need **admin controls** to restrict which providers users can access?
5. Should we add **analytics** for provider usage patterns?

---

**End of Implementation Plan**

*Generated: Based on comprehensive codebase analysis*
*Status: Ready for Review and Approval*
