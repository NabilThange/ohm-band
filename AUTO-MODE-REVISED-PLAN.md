# AUTO Mode Implementation - REVISED PLAN (Post-Validation)

**Status:** Ready for Implementation (Conflict-Resolved)  
**Created:** 2025-06-19 (Revised after context-gatherer validation)  
**Type:** Minimal, Conflict-Aware Implementation

---

## What Changed After Validation?

### Issues Found by Context-Gatherer

1. ❌ **NULL vs Empty String:** Plan assumed NULL, reality uses `''`
2. ❌ **Multiple Defaults:** Migration='openrouter', Code='groq', API='openrouter' (3 conflicts)
3. ❌ **Overlapping Fallback:** Ponytail-mode already has robust fallback (lines 250-340)
4. ❌ **KeyManager Ignored:** Quota rotation already handled, need to integrate not replace
5. ❌ **Vision Agent Special Case:** Not mentioned in original plan

### Ponytail Philosophy Applied

**Lazy means efficient, not careless. The best code is the code never written.**

- **Don't replace** executeWithRetry → **Extend** it
- **Don't add** new fallback → **Merge** with existing ponytail logic
- **Don't normalize** to NULL → **Keep** empty string (already works)
- **Don't create** new KeyManager → **Use** existing rotation

---

## REVISED Phase 0: Fix Foundation (2 days)

### Task 0.1: Standardize Empty String Semantics

**Decision:** Keep `''` (empty string) as AUTO mode, not NULL.

**Why:** Frontend already uses it, database accepts it, less migration risk.

**Changes:**

```typescript
// lib/agents/config.ts - getModelForAgent()
export function getModelForAgent(
    agentType: AgentType,
    overrideProvider?: ProviderType,
    overrideModel?: string
): { provider: ProviderType; model: string; isAuto: boolean } {
    // Normalize: both undefined/null AND empty string = AUTO
    const isAutoProvider = !overrideProvider || overrideProvider === '';
    const isAutoModel = !overrideModel || overrideModel === '';
    
    // AUTO MODE: Use agent-specific config
    if (isAutoProvider && isAutoModel) {
        const autoConfig = getAgentAutoConfig(agentType);
        return {
            provider: autoConfig.primary.provider,
            model: autoConfig.primary.model,
            isAuto: true
        };
    }
    
    // ... rest of existing logic unchanged
}
```

**Files:** 1 file, ~5 lines modified  
**Risk:** Low (additive check, backward compatible)

---

### Task 0.2: Fix Database Default Conflicts

**Problem:** 3 different defaults in different places

**Solution:** Single source of truth in one place

**Changes:**

```typescript
// lib/db/chat.ts - BOTH functions
const DEFAULT_PROVIDER = ''; // Empty string = AUTO mode
const DEFAULT_MODEL = '';    // Empty string = AUTO mode

// In createChat()
.insert({ 
    chat_id: chat.id,
    selected_provider: DEFAULT_PROVIDER,
    selected_model: DEFAULT_MODEL
})

// In createChatWithId()
.insert({ 
    chat_id: chat.id,
    selected_provider: DEFAULT_PROVIDER,
    selected_model: DEFAULT_MODEL
})
```

**Files:** 1 file, 6 lines modified  
**Risk:** Medium (changes new chat behavior, but existing chats unchanged)

---

### Task 0.3: Document Failover Precedence

**Create:** `docs/FAILOVER-ARCHITECTURE.md`

```markdown
# Failover Architecture

## Precedence Order (First to Last)

1. **KeyManager Rotation** (EXISTING)
   - Rotates keys within same provider when quota hit
   - Handles: 429, quota errors
   - Location: `lib/agents/key-manager.ts`

2. **Ponytail Fallback** (EXISTING)
   - Falls back to reliable tool-calling models
   - Handles: Tool-calling failures, validation errors
   - Location: `lib/agents/orchestrator.ts` (lines 250-340)

3. **AUTO Mode Fallback** (NEW)
   - Falls back to agent's configured fallback provider+model
   - Handles: Provider unavailable, timeout, 5xx
   - Triggers: Only in AUTO mode (isAuto=true)
   - Location: `lib/agents/orchestrator.ts` - executeWithRetry()

## When Fallback Triggers

```
User Request
    ↓
Is AUTO mode? → NO → Use specified provider/model
    ↓ YES              ↓
Try Primary           KeyManager tries rotation
    ↓ FAIL              ↓ FAIL
KeyManager tries      Ponytail fallback (tool errors only)
    ↓ FAIL              ↓ FAIL
Ponytail (if tool)    ERROR to user (no silent fallback)
    ↓ FAIL
AUTO Fallback
    ↓ FAIL
ERROR to user
```

## Manual Override = No Silent Fallback

If user explicitly sets Groq + Llama:
- KeyManager can rotate Groq keys
- Ponytail CANNOT switch to OpenRouter
- AUTO fallback CANNOT activate
- Failure → Show error to user

```

**Files:** 1 new doc  
**Risk:** None (documentation only)

---

## REVISED Phase 1: Add Agent Configs (1 day)

### Task 1.1: Add AGENT_MODEL_CONFIGS

**Location:** `lib/agents/provider-config.ts` (END OF FILE)

**Add:**
```typescript
// ============================================
// Per-Agent AUTO Mode Configurations
// ============================================

export interface AgentModelConfig {
  provider: ProviderType;
  model: string;
  rationale?: string;
}

export interface AgentProviderMapping {
  primary: AgentModelConfig;
  fallback: AgentModelConfig;
}

export const AGENT_MODEL_CONFIGS: Record<AgentType, AgentProviderMapping> = {
  // ... (full config from original plan, lines 130-286)
};

export function getAgentAutoConfig(agentType: AgentType): AgentProviderMapping {
  const config = AGENT_MODEL_CONFIGS[agentType];
  if (!config) {
    console.warn(`No AUTO config for agent: ${agentType}, using orchestrator config`);
    return AGENT_MODEL_CONFIGS.orchestrator; // Safe fallback
  }
  return config;
}
```

**Files:** 1 file, +170 lines (pure addition)  
**Risk:** None (not called yet)

---

### Task 1.2: Update getModelForAgent() Return Type

**Location:** `lib/agents/config.ts`

**Change return from string to object:**

```typescript
// BEFORE (line 814):
export function getModelForAgent(
    agentType: AgentType,
    overrideProvider?: ProviderType,
    overrideModel?: string
): string {
    // ... returns just model string
}

// AFTER:
export function getModelForAgent(
    agentType: AgentType,
    overrideProvider?: ProviderType,
    overrideModel?: string
): { provider: ProviderType; model: string; isAuto: boolean } {
    // Normalize empty string to undefined for AUTO detection
    const isAutoProvider = !overrideProvider || overrideProvider === '';
    const isAutoModel = !overrideModel || overrideModel === '';
    
    // AUTO MODE: Use agent-specific config
    if (isAutoProvider && isAutoModel) {
        const autoConfig = getAgentAutoConfig(agentType);
        return {
            provider: autoConfig.primary.provider,
            model: autoConfig.primary.model,
            isAuto: true
        };
    }
    
    // MANUAL OVERRIDE: Explicit model provided
    if (overrideModel && !isAutoModel) {
        const modelOption = getModelById(overrideModel);
        const activeProvider = overrideProvider || getActiveProvider();
        if (modelOption && modelOption.provider === activeProvider) {
            return { provider: activeProvider, model: overrideModel, isAuto: false };
        }
        console.warn(`Invalid model override: ${overrideModel}, falling back to provider default`);
    }
    
    // PROVIDER-ONLY OVERRIDE: Use provider's model mapping
    const provider = overrideProvider || getActiveProvider();
    const agent = AGENTS[agentType];
    const providerConfig = getProviderConfig(provider);
    const model = providerConfig.modelMappings[agent.modelRole] || providerConfig.defaultModel;
    
    return { provider, model, isAuto: false };
}
```

**Files:** 1 file, ~20 lines modified  
**Risk:** Medium (changes function signature, all callers must update)

---

## REVISED Phase 2: Integrate Fallback (2 days)

### Task 2.1: Update AgentRunner.runAgent() Caller

**Location:** `lib/agents/orchestrator.ts` (around line 240)

**Change:**

```typescript
// BEFORE:
const actualModel = getModelForAgent(
    agentType,
    options?.overrideProvider,
    options?.overrideModel
);
console.log(`🤖 Running ${agent.name} (${actualModel} via ${providerName})...`);

// AFTER:
const modelConfig = getModelForAgent(
    agentType,
    options?.overrideProvider,
    options?.overrideModel
);
console.log(`🤖 Running ${agent.name} (${modelConfig.model} via ${modelConfig.provider})${modelConfig.isAuto ? ' [AUTO]' : ''}...`);
```

**Files:** 1 file, ~5 lines modified  
**Risk:** Low (simple variable rename)

---

### Task 2.2: Extend executeWithRetry() - NOT Replace

**Location:** `lib/agents/orchestrator.ts` (line 117)

**Current Signature:**
```typescript
async executeWithRetry<T>(
    operation: (client: OpenAI) => Promise<T>,
    operationName: string = "API Call",
    overrideProvider?: ProviderType
): Promise<T>
```

**NEW Signature:**
```typescript
async executeWithRetry<T>(
    operation: (client: OpenAI) => Promise<T>,
    operationName: string = "API Call",
    overrideProvider?: ProviderType,
    autoFallbackConfig?: { // NEW: only used if AUTO mode
        fallbackProvider: ProviderType;
        fallbackModel: string;
        allowFallback: boolean; // false for manual overrides
    }
): Promise<T>
```

**Extend Logic (DON'T replace existing 100 lines):**

```typescript
// Inside existing retry loop, AFTER existing ponytail fallback (around line 330)
// Add this block at the END, before final throw:

// NEW: AUTO mode provider-level fallback (runs LAST)
if (attempt === maxRetries && 
    autoFallbackConfig && 
    autoFallbackConfig.allowFallback && 
    this.isProviderLevelFailure(error)) {
    
    console.log(`🔄 [AgentRunner] AUTO mode: Trying fallback provider ${autoFallbackConfig.fallbackProvider}`);
    
    try {
        const fallbackConfig = getProviderConfig(autoFallbackConfig.fallbackProvider);
        const fallbackClient = getProviderClient(fallbackConfig);
        
        const result = await operation(fallbackClient);
        
        // Log successful fallback
        console.log(`✅ [Fallback Success] ${operationName}: ${autoFallbackConfig.fallbackProvider} / ${autoFallbackConfig.fallbackModel}`);
        
        return result;
        
    } catch (fallbackError: any) {
        console.error(`❌ [Fallback Failed] ${autoFallbackConfig.fallbackProvider} also failed:`, fallbackError.message);
        // Fall through to original error throw
    }
}

// ... existing throw lastError
```

**New Helper Method:**

```typescript
/**
 * Determine if error is provider-level (not tool/validation issue)
 * Provider-level = network, timeout, quota, 5xx
 * NOT provider-level = tool schema, validation, auth
 */
private isProviderLevelFailure(error: any): boolean {
    const errorMessage = error.message?.toLowerCase() || '';
    const statusCode = error.status || error.statusCode;
    
    // Provider-level failures
    if ([500, 502, 503, 504].includes(statusCode)) return true;
    if (errorMessage.includes('timeout')) return true;
    if (errorMessage.includes('connection')) return true;
    if (errorMessage.includes('network')) return true;
    if (errorMessage.includes('unavailable')) return true;
    
    // NOT provider-level (keep in same provider)
    if (errorMessage.includes('tool')) return false;
    if (errorMessage.includes('function')) return false;
    if (errorMessage.includes('schema')) return false;
    if (errorMessage.includes('validation')) return false;
    
    return false; // Default: don't switch providers
}
```

**Files:** 1 file, ~40 lines added (NOT 120 lines)  
**Risk:** Low (runs AFTER existing fallback, additive only)

---

### Task 2.3: Pass Fallback Config from runAgent()

**Location:** `lib/agents/orchestrator.ts` (around line 260)

**Change:**

```typescript
// Prepare AUTO fallback config (only if AUTO mode)
let autoFallbackConfig = undefined;
if (modelConfig.isAuto) {
    const fallbackConf = getAgentAutoConfig(agentType).fallback;
    autoFallbackConfig = {
        fallbackProvider: fallbackConf.provider,
        fallbackModel: fallbackConf.model,
        allowFallback: true
    };
}

// Pass to executeWithRetry
const result = await this.executeWithRetry(
    async (client) => {
        if (options?.stream) {
            return await this.runStreamingAgentWithTools(...);
        } else {
            return await this.runNonStreamingAgentWithTools(...);
        }
    },
    agent.name,
    modelConfig.provider,
    autoFallbackConfig // NEW parameter
);
```

**Files:** 1 file, ~15 lines modified  
**Risk:** Low (conditional parameter)

---

## REVISED Phase 3: Frontend Integration (1 day)

### Task 3.1: Add Provider-Level AUTO Option

**Location:** `components/ai_chat/ProviderSelector.tsx`

**Changes:**

```tsx
<Select 
    value={selectedProvider || 'AUTO'} 
    onValueChange={handleProviderChange} 
    disabled={loading}
>
    <SelectTrigger id="provider" className="h-9">
        <SelectValue placeholder="AUTO (per-agent defaults)" />
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
        <Separator className="my-1" />
        {providers.map(p => (
            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
        ))}
    </SelectContent>
</Select>
```

**Handle AUTO selection:**

```tsx
const handleProviderChange = async (newProvider: string) => {
    const actualProvider = newProvider === 'AUTO' ? '' : newProvider; // Empty string for AUTO
    setSelectedProvider(actualProvider);
    setSelectedModel(''); // Reset model
    await updateSession(actualProvider, '');
};
```

**Files:** 1 file, ~20 lines modified  
**Risk:** Low (UI only, backend already supports empty string)

---

### Task 3.2: Show Effective Model Tooltip

**Add API Endpoint:** `app/api/chat/[chatId]/effective-model/route.ts`

```typescript
export async function GET(req: NextRequest, { params }: { params: { chatId: string } }) {
    const { chatId } = params;
    const { searchParams } = new URL(req.url);
    const agentType = searchParams.get('agent') as AgentType;
    
    if (!agentType) {
        return NextResponse.json({ error: 'agent parameter required' }, { status: 400 });
    }
    
    const supabase = getSupabaseClient();
    const { data } = await supabase
        .from('chat_sessions')
        .select('selected_provider, selected_model')
        .eq('chat_id', chatId)
        .single();
    
    const modelConfig = getModelForAgent(
        agentType,
        data?.selected_provider as ProviderType,
        data?.selected_model
    );
    
    return NextResponse.json({
        agent: agentType,
        provider: modelConfig.provider,
        model: modelConfig.model,
        isAuto: modelConfig.isAuto
    });
}
```

**Use in Frontend:**

```tsx
// Show tooltip on provider dropdown
<TooltipProvider>
    <Tooltip>
        <TooltipTrigger asChild>
            <div className="text-xs text-muted-foreground">
                {selectedProvider || 'AUTO'}
            </div>
        </TooltipTrigger>
        <TooltipContent>
            <div className="text-xs space-y-1">
                <div>Current agent: conversational</div>
                <div>Using: AIML / DeepSeek Reasoner</div>
            </div>
        </TooltipContent>
    </Tooltip>
</TooltipProvider>
```

**Files:** 1 new API route, 1 component updated  
**Risk:** Low (enhancement, not critical path)

---

## Testing Strategy (Ponytail-Mode)

### Minimal Test Coverage (Pragmatic)

**Unit Tests:**
- [ ] `getAgentAutoConfig()` returns config for all 12 agents
- [ ] `getModelForAgent()` with AUTO (empty string) → returns primary
- [ ] `getModelForAgent()` with manual → returns specified
- [ ] `isProviderLevelFailure()` correctly categorizes errors

**Integration Test (ONE E2E scenario):**
- [ ] Create chat → Verify empty string in DB
- [ ] Send message → Verify correct model used
- [ ] Simulate provider failure → Verify fallback triggered
- [ ] Check logs → Verify fallback logged

**Manual Testing:**
- [ ] New chat defaults to AUTO
- [ ] Switch to Groq → All agents use Groq
- [ ] Switch back to AUTO → Per-agent configs resume

**No tests for:**
- Edge cases (ponytail: ship first, fix if breaks)
- All 12 agents individually (test orchestrator, assume rest work)
- UI components (visual QA sufficient)

---

## Migration & Rollback

### Migration

**None needed!** Existing chats already have explicit providers, new chats get empty string.

**Optional cleanup:**
```sql
-- If you want to migrate old NULL values (probably none exist)
UPDATE chat_sessions 
SET selected_provider = '', selected_model = ''
WHERE selected_provider IS NULL;
```

### Rollback Plan

**If Phase 2 fails:**
```typescript
// In executeWithRetry(), comment out the AUTO fallback block
/*
if (attempt === maxRetries && autoFallbackConfig && ...) {
    // ... AUTO fallback logic
}
*/
```

**If Phase 3 breaks frontend:**
- Revert ProviderSelector.tsx changes
- Keep backend (doesn't break anything)

---

## Timeline (Revised)

| Phase | Tasks | Days | Risk |
|-------|-------|------|------|
| Phase 0 | Fix foundation (3 tasks) | 2 | Low |
| Phase 1 | Add configs (2 tasks) | 1 | Low |
| Phase 2 | Integrate fallback (3 tasks) | 2 | Medium |
| Phase 3 | Frontend (2 tasks) | 1 | Low |
| **Total** | **10 tasks** | **6 days** | |

**Original plan:** 3 weeks (15 days)  
**Revised plan:** 6 days (60% reduction)

**Why faster?**
- Don't replace executeWithRetry (extend it)
- Don't add new KeyManager integration
- Don't normalize to NULL (keep empty string)
- Don't rewrite ponytail fallback (merge with it)

---

## Summary of Changes from Original Plan

| Aspect | Original Plan | Revised Plan |
|--------|---------------|--------------|
| NULL vs '' | Migrate to NULL | Keep '' (already works) |
| Fallback Logic | Replace executeWithRetry (120 lines) | Extend it (~40 lines) |
| KeyManager | Integrate/coordinate | Use existing (no changes) |
| Ponytail Fallback | Mention briefly | Respect precedence |
| Default Conflicts | Not addressed | Fixed in Phase 0 |
| Vision Agents | Generic approach | Acknowledged as special |
| Timeline | 3 weeks | 6 days |
| Lines Changed | ~302 | ~200 |
| Breaking Changes | Several | Minimal |

---

## Next Steps

1. **Review this revised plan** - Validate it addresses validation findings
2. **Create feature branch:** `feature/auto-mode-minimal`
3. **Start Phase 0, Task 0.1** - Standardize empty string semantics
4. **Daily check-ins** - Ensure no conflicts with parallel work

**Philosophy:** Ship incrementally, test in prod, fix when breaks (ponytail-mode).
