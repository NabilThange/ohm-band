# AUTO Mode Implementation - Quick Start Guide

**Status:** Ready to Implement  
**Estimated Time:** 2-3 weeks  
**Risk Level:** Medium (breaking changes in Phase 2)

---

## What We're Building

**Before:** All chats hardcoded to Groq + GPT-OSS-120B, manual selection buggy  
**After:** Each of 12 agents uses optimized provider+model, automatic fallback on failure

---

## The 3 Phases

### Phase 1: Add Fallback (Week 1) ✅ Non-Breaking
- Add per-agent configs to `provider-config.ts`
- Implement retry logic with fallback
- Deploy to prod safely (no user-facing changes)

### Phase 2: Enable AUTO (Week 2) ⚠️ Breaking
- Change database defaults to NULL
- Add AUTO option to dropdowns
- Coordinate deployment

### Phase 3: Observability (Week 3-4) 📊 Enhancement
- Store fallback events in database
- Build analytics dashboard
- Optional: Toast notifications

---

## Key Design Decisions

### 1. Config Location: Static TypeScript Object
**Why:** Type-safe, fast, versionable, admin-only
**Where:** `lib/agents/provider-config.ts`

### 2. Failure Detection: In executeWithRetry()
**Triggers:**
- HTTP 429, 500, 502, 503, 504
- Quota/rate limit errors
- Timeouts > 30s
- Connection errors

**Does NOT trigger:**
- Auth errors (log critical)
- Validation errors (fail immediately)

### 3. AUTO Mode Semantics
- `selected_provider = NULL` → Use per-agent primary config
- `selected_provider = 'groq'` → Force Groq for all agents
- Manual override = no automatic fallback

---

## Per-Agent Model Assignments

| Agent | Primary | Fallback | Why |
|-------|---------|----------|-----|
| orchestrator | Groq / GPT-OSS 120B | AIML / DeepSeek Non-Reasoner | Zero tool calls, pure speed |
| projectInitializer | Groq / GPT-OSS 120B | AIML / DeepSeek Non-Reasoner | No tools, fast gen |
| conversational | AIML / DeepSeek Reasoner | AIML / GLM-4.6 | Thinking for parallel multi-tool |
| bomGenerator | AIML / DeepSeek Reasoner | AIML / DeepSeek Flash | Precision (voltage = critical) |
| codeGenerator | AIML / Grok Code Fast | AIML / GPT-5.1 Codex | Agentic tool reliability |
| wiringDiagram | AIML / DeepSeek Non-Reasoner | Groq / GPT-OSS 120B | Deterministic, precision |
| debugger | AIML / DeepSeek Reasoner | AIML / DeepSeek Flash | Cross-domain reasoning |
| datasheetAnalyzer | AIML / Qwen3-VL | AIML / GPT-4o Mini | Vision required |
| budgetOptimizer | AIML / DeepSeek Non-Reasoner | Groq / Llama 3.3 | 1 tool pair only |
| conversationSummarizer | Groq / GPT-OSS 120B | AIML / DeepSeek Non-Reasoner | Background, no tools |
| circuitVerifier | AIML / Qwen3-VL | AIML / GPT-4o Mini | Vision (circuit photos) |
| enclosureGenerator | AIML / Grok Code Fast | AIML / GPT-5.1 Codex | Stateful tool sequences |

---

## Files to Modify (8 total, ~302 lines)

### Critical Path (Phase 1 + 2)
1. `lib/agents/provider-config.ts` (+80 lines)
2. `lib/agents/config.ts` (~15 lines)
3. `lib/agents/orchestrator.ts` (~130 lines)
4. `lib/db/chat.ts` (4 lines)
5. `app/api/chat/[chatId]/provider/route.ts` (3 lines)
6. `components/ai_chat/ProviderSelector.tsx` (~40 lines)
7. `components/shared/ChatPromptInput.tsx` (~30 lines)

---

## Testing Requirements

### Must-Have Before Deploy
- [ ] New chat creates with NULL provider/model
- [ ] AUTO mode uses correct per-agent models
- [ ] Fallback triggers on rate limit
- [ ] Manual override prevents AUTO mode
- [ ] Existing chats unchanged

### Nice-to-Have
- [ ] Unit tests for config helpers
- [ ] E2E test for fallback flow
- [ ] Load test with fallback scenarios

---

## Rollback Plan

### If Phase 2 Breaks Production
1. Revert `lib/db/chat.ts` to hardcoded 'groq'
2. Deploy hotfix (15 min)
3. Investigate in staging

### If Fallback Causes Issues
1. Set `ENABLE_MODEL_FALLBACK=false` in env
2. No code deploy needed
3. Debug offline

---

## Success Metrics (30 days post-launch)

- ✅ Fallback rate < 5% of calls
- ✅ Error rate decreases by 20%
- ✅ Chat completion rate increases by 10%
- ✅ Zero "model unavailable" support tickets

---

## Next Steps

1. **Review full plan:** `AUTO-MODE-IMPLEMENTATION-PLAN.md`
2. **Create feature branch:** `feature/auto-mode-provider-selection`
3. **Start Phase 1:** Begin with provider-config.ts additions
4. **Daily standups:** Track progress against 3-week timeline

---

## Questions? See Full Plan

- Exact code diffs → Part 5
- Database migrations → Part 8
- Observability details → Part 6
- Cost analysis → Part 11
