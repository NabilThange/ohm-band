# Model/Provider Selection Architecture - Root Cause Analysis

## Executive Summary

**Issue:** Users report seeing "Groq GPT-OSS 120B" as default when dropdowns are set to AUTO/AUTO mode.

**Root Cause:** Empty string `''` stored in database for "AUTO" model selection doesn't properly fallback to provider defaults. The system has multiple default resolution paths that conflict.

**Impact:** Frontend shows wrong defaults, database stores inconsistent states, and AUTO mode behaves unexpectedly.

---

## 1. Default Model Configuration - Current State

### Environment-Level Default
- **Location:** `.env` file
- **Variable:** `LLM_PROVIDER`
- **Code:** `lib/agents/provider-config.ts:getActiveProvider()`
- **Current Default:** `openrouter` (if not set or invalid)

### Database-Level Defaults
- **Location:** `lib/db/chat.ts:createChat()` and `createChatWithId()`
- **Fields:** `selected_provider`, `selected_model`
- **Hardcoded Values:**
  ```typescript
  selected_provider: 'groq'
  selected_model: 'openai/gpt-oss-120b'  // GPT OSS 120B
  ```
- **Problem:** These hardcoded defaults don't respect environment config or provider defaults

### Frontend Defaults
- **ProviderSelector:** Loads from API, defaults to `'openrouter'` if not found
- **ChatPromptInput:** Loads from API, defaults to `'groq'` if not found
- **Inconsistency:** Two components have different fallback defaults

### Provider-Specific Defaults
Each provider has its own `defaultModel` in `PROVIDER_CONFIGS`:
- **openrouter:** `'nex-agi/nex-n2-pro:free'`
- **groq:** `'llama-3.3-70b-versatile'`
- **aiml:** `'openai/gpt-4.1-nano-2025-04-14'`

---

## 2. AUTO Resolution Flow - Where It Breaks

### Current Flow (When Both Dropdowns = AUTO)

```
User Selects AUTO → Frontend (ProviderSelector/ChatPromptInput)
                                    ↓
                           Empty string '' stored
                                    ↓
                  Database: selected_provider = 'groq'
                           selected_model = ''
                                    ↓
                   Orchestrator reads session
                                    ↓
              overrideProvider = 'groq'
              overrideModel = '' (empty string!)
                                    ↓
                    getModelForAgent() called
                                    ↓
          If overrideModel is truthy → validate it
          If empty string → SKIPS validation
                                    ↓
         Falls through to modelMappings lookup
                                    ↓
      Returns: groq.modelMappings[agent.modelRole]
                                    ↓
           For most agents: 'llama-3.3-70b-versatile'
           BUT database initially had: 'openai/gpt-oss-120b'
```

### The Bug

**In `getModelForAgent()` (lib/agents/config.ts:814-833):**

```typescript
export function getModelForAgent(
    agentType: AgentType,
    overrideProvider?: ProviderType,
    overrideModel?: string
): string {
    // If explicit model override provided, validate and use it
    if (overrideModel) {  // ❌ Empty string '' is falsy!
        const modelOption = getModelById(overrideModel);
        const activeProvider = overrideProvider || getActiveProvider();
        if (modelOption && modelOption.provider === activeProvider) {
            return overrideModel;
        }
        console.warn(`Invalid model override: ${overrideModel}, falling back to default`);
    }

    // Otherwise use provider's model mapping based on agent role
    const agent = AGENTS[agentType];
    const providerConfig = getProviderConfig(overrideProvider);
    return providerConfig.modelMappings[agent.modelRole] || providerConfig.defaultModel;
}
```

**Problem:** Empty string `''` is falsy in JavaScript, so the validation block is skipped entirely. The function immediately uses provider defaults/mappings.

---

## 3. Why AUTO Shows Wrong Default

### Frontend Display Issue

**In `ChatPromptInput.tsx` (lines 64-65):**
```typescript
const [selectedProvider, setSelectedProvider] = useState<string>('groq');
const [selectedModel, setSelectedModel] = useState<string>('');
```

**In `ProviderSelector.tsx` (lines 33-34):**
```typescript
const [selectedProvider, setSelectedProvider] = useState<string>('openrouter');
const [selectedModel, setSelectedModel] = useState<string>('');
```

**Load from API (lines 89-96 in ChatPromptInput):**
```typescript
fetch(`/api/chat/${chatId}/provider`)
    .then(res => res.json())
    .then(data => {
        setSelectedProvider(data.provider || 'groq');  // ← Groq fallback!
        setSelectedModel(data.model || '');
    })
```

**What Happens:**
1. New chat created → Database gets `selected_provider='groq'`, `selected_model='openai/gpt-oss-120b'`
2. Frontend loads preferences → Gets `'groq'` and `'openai/gpt-oss-120b'`
3. User sees "Groq" and "GPT-OSS 120B" in dropdowns
4. User changes to AUTO → Frontend stores `''` for model
5. **But provider is still 'groq' in database!**
6. Display shows "Groq" + "Auto" which implies "Groq + default Groq model"
7. Backend actually uses `llama-3.3-70b-versatile` (Groq's true default)

---

## 4. Files Requiring Changes

### Primary Issues

| File | Issue | Fix Required |
|------|-------|--------------|
| `lib/db/chat.ts` | Hardcoded Groq + GPT-OSS-120B defaults | Use env-based defaults |
| `lib/agents/config.ts` | Empty string `''` skips validation | Explicitly check for undefined vs empty |
| `components/ai_chat/ProviderSelector.tsx` | Defaults to `'openrouter'` | Use API-provided default |
| `components/shared/ChatPromptInput.tsx` | Defaults to `'groq'` | Use API-provided default |
| `app/api/chat/[chatId]/provider/route.ts` | Returns empty string for null model | Should return `null` explicitly |

### Supporting Files (No Changes Needed)

✅ `lib/agents/orchestrator.ts` - Correctly passes overrides  
✅ `lib/agents/provider-config.ts` - Provider configs are correct  
✅ `app/api/agents/providers/route.ts` - Returns correct data  

---

## 5. Per-Agent Provider/Model Configuration

### Current State: ❌ NOT SUPPORTED

The system does NOT support per-agent provider/model assignments like:
- Orchestrator → Provider A, Model X
- Conversational → Provider B, Model Y
- Research Agent → Provider C, Model Z

### What EXISTS Today

**Agent-Role-Based Model Mapping:**
```typescript
// lib/agents/provider-config.ts
groq: {
    modelMappings: {
        'fast': 'llama-3.3-70b-versatile',
        'reasoning': 'llama-3.3-70b-versatile',
        'code': 'llama-3.3-70b-versatile',
        'vision': 'llama-3.3-70b-versatile'
    }
}
```

Each agent has a `modelRole` property:
```typescript
// lib/agents/config.ts
export const AGENTS = {
    orchestrator: {
        modelRole: 'reasoning',  // Uses reasoning model from provider
        ...
    },
    conversational: {
        modelRole: 'fast',  // Uses fast model from provider
        ...
    }
}
```

**This means:** When using Groq, all agents use the SAME model because Groq's mappings are uniform. But with OpenRouter, different agents could use different models.

### How to Implement Per-Agent Provider/Model

**Option A: Session-Level Overrides (Simplest)**

Store in `chat_sessions` table:
```sql
ALTER TABLE chat_sessions ADD COLUMN agent_provider_overrides JSONB;

-- Example data:
{
  "orchestrator": { "provider": "groq", "model": "llama-3.3-70b-versatile" },
  "conversational": { "provider": "openrouter", "model": "nex-agi/nex-n2-pro:free" }
}
```

**Option B: Agent-Level Defaults (Global)**

Extend `AGENTS` config:
```typescript
export const AGENTS = {
    orchestrator: {
        modelRole: 'reasoning',
        preferredProvider: 'groq',  // NEW
        preferredModel: 'llama-3.3-70b-versatile',  // NEW
        ...
    }
}
```

**Option C: Environment Variables (Infrastructure-Level)**

```env
AGENT_ORCHESTRATOR_PROVIDER=groq
AGENT_ORCHESTRATOR_MODEL=llama-3.3-70b-versatile
AGENT_CONVERSATIONAL_PROVIDER=openrouter
AGENT_CONVERSATIONAL_MODEL=nex-agi/nex-n2-pro:free
```

**Recommendation:** Option A (Session-Level) is best because:
- Allows per-project customization
- Doesn't require code changes for new agents
- Can be exposed in UI for user control
- Fallback to global defaults when not specified

---

## 6. Recommended Fixes

### Fix 1: Database Defaults (HIGH PRIORITY)

**File:** `lib/db/chat.ts`

**Current:**
```typescript
selected_provider: 'groq',
selected_model: 'openai/gpt-oss-120b'
```

**Fixed:**
```typescript
selected_provider: getActiveProvider(),  // Respects env config
selected_model: null  // Use provider's default
```

### Fix 2: AUTO Model Resolution (HIGH PRIORITY)

**File:** `lib/agents/config.ts:getModelForAgent()`

**Current:**
```typescript
if (overrideModel) {  // Empty string is falsy
```

**Fixed:**
```typescript
if (overrideModel !== undefined && overrideModel !== null && overrideModel !== '') {
```

OR better yet:
```typescript
// Normalize empty string to undefined
overrideModel = overrideModel || undefined;

if (overrideModel) {  // Now undefined, not empty string
```

### Fix 3: Frontend Dropdown Consistency (MEDIUM PRIORITY)

**Files:** 
- `components/ai_chat/ProviderSelector.tsx`
- `components/shared/ChatPromptInput.tsx`

**Issue:** Different components have different hardcoded defaults

**Fix:** Both should:
1. Load from API's `defaultProvider`
2. Show "AUTO" option that stores `null` in database (not empty string)
3. Display effective model in parentheses: "Auto (currently: Groq / Llama 3.3 70B)"

### Fix 4: API Response Normalization (LOW PRIORITY)

**File:** `app/api/chat/[chatId]/provider/route.ts`

**Current:**
```typescript
return NextResponse.json({ 
    provider: data?.selected_provider || 'openrouter',
    model: data?.selected_model || null  // Returns null
});
```

**Frontend receives `null` but stores `''` (empty string) → Inconsistent!**

**Fix:** Frontend should store `null`, not `''`

---

## 7. Testing Checklist

### After Fixes, Verify:

- [ ] New chat creation uses env-based provider default
- [ ] AUTO provider dropdown resolves to `LLM_PROVIDER` env value
- [ ] AUTO model dropdown resolves to provider's `defaultModel`
- [ ] Frontend displays correct effective model: "Auto (Groq / Llama 3.3 70B)"
- [ ] Database stores `NULL` for AUTO selections, not empty string
- [ ] Switching provider clears incompatible model selection
- [ ] Manual model selection overrides AUTO properly
- [ ] orchestrator.ts correctly passes session preferences to agents
- [ ] Different agents can use different model roles from same provider

---

## 8. Architecture Decision Records

### Why Not Global AUTO Mode?

The current design has AUTO at the **session level** (per-chat), not **global level**. This is correct because:
- Different projects may need different models
- Users may want to test/compare providers per-chat
- Session preferences are independent and isolated

### Why Empty String Instead of Null?

**Bug origin:** Frontend uses `''` (empty string) for "no selection" state, which is idiomatic in HTML forms. But the backend expects `null` for "use default."

**Fix:** Normalize frontend to use `null` for AUTO, or normalize backend to treat `''` as `null`.

### Why Groq Hardcoded in Database?

**Historical reason:** Likely the initial provider during development. Should have been parameterized from day one.

---

## 9. Blast Radius

### Components Affected by Fixes

1. **Database Seeds/Migrations:** Update default values
2. **Existing Chats:** May show different models after fix (expected behavior)
3. **Frontend Dropdowns:** Visual changes to show "Auto (effective: X)"
4. **Agent Routing:** No impact (already uses correct resolution)
5. **API Responses:** Normalize `null` vs `''` handling

### Breaking Changes

❌ None - all changes are backward compatible. Existing hardcoded values remain functional, new chats use improved defaults.

---

## 10. Future Enhancements

### Phase 1: Fix Current Issues (This PR)
- Normalize AUTO resolution
- Fix database defaults
- Consistent frontend behavior

### Phase 2: Per-Agent Configuration (Next Quarter)
- UI for per-agent provider/model overrides
- Session-level agent configuration storage
- Agent-specific model selection in dropdown

### Phase 3: Advanced Features (Future)
- Model performance analytics per agent
- Auto-switching based on quota/availability
- Cost optimization recommendations

---

## Appendix A: Resolution Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     User Selection                          │
│  Provider Dropdown: AUTO → '' or 'groq' or 'openrouter'    │
│  Model Dropdown: AUTO → '' or specific model ID            │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│              Frontend (ProviderSelector)                    │
│  updateSession(provider, model) → PATCH /api/chat/X/provider│
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│           Database (chat_sessions table)                    │
│  selected_provider: 'groq'                                  │
│  selected_model: '' (empty string)                          │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│        Orchestrator.chat() - Load Preferences               │
│  overrideProvider = 'groq'                                  │
│  overrideModel = '' (empty string)                          │
│  → Passes to runner.runAgent()                              │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│           AgentRunner.runAgent()                            │
│  getModelForAgent(agentType, 'groq', '')                    │
│    if (overrideModel) { ← '' is FALSY, skipped!            │
│    }                                                         │
│    → providerConfig.modelMappings[agent.modelRole]          │
│    → 'llama-3.3-70b-versatile' (Groq's default)             │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│              Actual API Call                                │
│  Model Used: 'llama-3.3-70b-versatile'                      │
│  Provider: Groq                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Appendix B: Database Schema

### Current `chat_sessions` Table

```sql
CREATE TABLE chat_sessions (
    chat_id UUID PRIMARY KEY REFERENCES chats(id),
    user_id UUID REFERENCES users(id),
    title TEXT,
    current_agent TEXT,
    last_active_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ,
    selected_provider TEXT,  -- 'openrouter' | 'groq' | 'aiml'
    selected_model TEXT,     -- Model ID or NULL for auto
    provider_metadata JSONB,
    project_stage TEXT,
    auto_orchestration BOOLEAN
);
```

### Proposed Addition (Phase 2)

```sql
ALTER TABLE chat_sessions 
ADD COLUMN agent_provider_overrides JSONB DEFAULT '{}'::jsonb;

-- Example content:
{
    "orchestrator": {
        "provider": "groq",
        "model": "llama-3.3-70b-versatile"
    },
    "conversational": {
        "provider": "openrouter", 
        "model": "nex-agi/nex-n2-pro:free"
    }
}
```

---

## Document Metadata

**Created:** 2025-06-19  
**Author:** Kiro Analysis Agent  
**Status:** Final  
**Version:** 1.0  
**Related Issues:** Frontend AUTO mode shows wrong defaults  
