# Implementation Decision Matrix

**Question:** Should we proceed with AUTO mode implementation?  
**Answer:** YES - Use revised plan (AUTO-MODE-REVISED-PLAN.md)

---

## Options Analysis

### Option A: Original Plan (AUTO-MODE-IMPLEMENTATION-PLAN.md)

**Pros:**
- ✅ Comprehensive and well-documented
- ✅ Clean NULL semantics
- ✅ Complete rewrite of fallback logic

**Cons:**
- ❌ Conflicts with existing ponytail fallback
- ❌ Ignores KeyManager integration
- ❌ 3 weeks timeline
- ❌ ~302 lines changed across 8 files
- ❌ Multiple breaking changes
- ❌ NULL migration complexity

**Risk:** HIGH - Would require resolving conflicts during implementation

---

### Option B: Revised Plan (AUTO-MODE-REVISED-PLAN.md)

**Pros:**
- ✅ Works WITH existing systems
- ✅ 6 days timeline (60% faster)
- ✅ ~200 lines changed
- ✅ Minimal breaking changes
- ✅ Keeps working empty string semantics
- ✅ Extends executeWithRetry instead of replacing
- ✅ Respects KeyManager and ponytail fallback

**Cons:**
- ⚠️ Empty string less "clean" than NULL
- ⚠️ More integration documentation needed
- ⚠️ Precedence rules to maintain

**Risk:** LOW - Additive changes, backward compatible

---

### Option C: Don't Implement (Status Quo)

**Pros:**
- ✅ Zero risk
- ✅ No development time
- ✅ Existing system works

**Cons:**
- ❌ Users confused by "Groq GPT-OSS 120B" default
- ❌ No per-agent optimization
- ❌ No automatic fallback on provider failure
- ❌ Manual provider selection error-prone
- ❌ Can't leverage reasoning models where needed

**Risk:** OPPORTUNITY COST - Missing substantial improvement

---

## Decision: Option B (Revised Plan)

### Why This Choice?

1. **Pragmatic** - Works with reality, not against it
2. **Fast** - 6 days vs 3 weeks
3. **Safe** - Extends existing systems
4. **Tested** - Leverages proven fallback patterns
5. **Ponytail-approved** - Follows "lazy senior dev" philosophy

### Success Criteria

**Technical:**
- [ ] New chats default to AUTO mode (empty string)
- [ ] Per-agent configs used in AUTO mode
- [ ] Fallback triggers on provider failure (not tool errors)
- [ ] KeyManager rotation happens first
- [ ] Manual overrides prevent silent fallback

**User Experience:**
- [ ] AUTO option visible in dropdowns
- [ ] Users can switch to manual mode
- [ ] Errors shown when manual mode fails
- [ ] No breaking changes for existing chats

**Operational:**
- [ ] Fallback events logged to console
- [ ] Phase 0-2 deployable to production
- [ ] Rollback plan tested
- [ ] Documentation updated

### Implementation Checklist

#### Phase 0: Foundation (2 days)
- [ ] Task 0.1: Standardize empty string semantics
- [ ] Task 0.2: Fix database default conflicts
- [ ] Task 0.3: Document failover precedence

#### Phase 1: Configs (1 day)
- [ ] Task 1.1: Add AGENT_MODEL_CONFIGS
- [ ] Task 1.2: Update getModelForAgent() return type

#### Phase 2: Integration (2 days)
- [ ] Task 2.1: Update AgentRunner.runAgent() caller
- [ ] Task 2.2: Extend executeWithRetry()
- [ ] Task 2.3: Pass fallback config from runAgent()

#### Phase 3: Frontend (1 day)
- [ ] Task 3.1: Add provider-level AUTO option
- [ ] Task 3.2: Show effective model tooltip

### Deployment Strategy

**Phase 0-1: Non-Breaking (Deploy Anytime)**
- Add configs (pure addition)
- Fix defaults (affects new chats only)
- Update return types (internal change)

**Phase 2: Careful (Deploy with Monitoring)**
- Extend executeWithRetry (new behavior)
- Watch logs for unexpected fallbacks
- Verify KeyManager still works

**Phase 3: Polish (Deploy Last)**
- Frontend changes (visible to users)
- Can be deployed separately
- Rollback doesn't affect backend

### Rollback Plan

**If Phase 2 breaks:**
```typescript
// Comment out AUTO fallback block in executeWithRetry
const ENABLE_AUTO_FALLBACK = false; // Killswitch

if (ENABLE_AUTO_FALLBACK && autoFallbackConfig && ...) {
    // Disabled
}
```

**If Phase 3 confuses users:**
- Revert frontend changes
- Keep backend (works fine)
- Add tooltip explaining AUTO

### Timeline

| Week | Days | Phase | Deliverable |
|------|------|-------|-------------|
| 1 | Mon-Tue | Phase 0 | Foundation fixed |
| 1 | Wed | Phase 1 | Configs added |
| 1 | Thu-Fri | Phase 2 | Fallback integrated |
| 2 | Mon | Phase 3 | Frontend polished |
| **Total** | **6 days** | | **Prod-ready** |

### Go/No-Go Criteria

**Before Phase 2 Deploy:**
- ✅ Phase 0-1 deployed to staging
- ✅ New chats use empty string
- ✅ getModelForAgent() returns correct configs
- ✅ No errors in staging logs

**Before Phase 3 Deploy:**
- ✅ Phase 2 in production for 24 hours
- ✅ Zero unexpected fallbacks
- ✅ KeyManager still rotates keys
- ✅ Manual overrides still work

**Before Public Announcement:**
- ✅ All phases deployed
- ✅ Documentation updated
- ✅ Support team trained
- ✅ Rollback tested

---

## Next Actions

1. **Get approval** - Review this decision with team
2. **Create branch** - `feature/auto-mode-minimal`
3. **Start Phase 0** - Fix foundation (Task 0.1)
4. **Daily standups** - 15-min check-ins
5. **Demo Friday** - Show working AUTO mode

---

## Stakeholder Communication

### For Engineers

> We're implementing per-agent model configs with automatic fallback. The plan extends existing systems (ponytail fallback, KeyManager) instead of replacing them. 6-day timeline, low risk, backward compatible.

### For Product

> Users will see "AUTO" as the default provider option. Behind the scenes, each agent gets optimized models (reasoning models for planning, fast models for routing). If primary fails, automatic fallback prevents errors.

### For Support

> AUTO mode means the system picks the best model per agent. Users can still manually override. If they report "wrong model," check if they're in AUTO or manual mode. Fallback events logged for debugging.

---

## Decision Rationale

**Why not Option A (original)?**
- Conflicts with existing code
- Longer timeline
- Higher risk of production issues

**Why not Option C (status quo)?**
- Users confused by current defaults
- Missing opportunity for optimization
- No fallback = more errors

**Why Option B?**
- Fast, safe, pragmatic
- Respects existing architecture
- Delivers value quickly
- Easy to rollback

---

## Sign-Off

**Decision:** Proceed with Option B (Revised Plan)  
**Timeline:** 6 days  
**Risk:** Low  
**ROI:** High (per-agent optimization + fallback)

**Approved by:** [Engineering Lead]  
**Date:** 2025-06-19

**Next Review:** After Phase 2 deploy (day 5)
