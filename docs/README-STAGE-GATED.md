# Stage-Gated Agent Architecture - Documentation Index

## 📋 Documentation Overview

This directory contains all documentation for the OHM platform's stage-gated agent architecture implementation. Use this index to find what you need.

---

## 🎯 For Project Managers

### **START HERE**: Executive Summary
**File**: `STAGE-GATED-IMPLEMENTATION-PLAN.md` (Section: Executive Summary)

**What you need to know**:
- **Problem**: Orchestrator picks wrong agents too often (11 choices, confusing)
- **Solution**: Stage-gating limits choices to 2-3 relevant agents per project phase
- **Timeline**: 4 weeks (foundation → backend → frontend → polish)
- **Risk**: Low (fully backward compatible, staged rollout)
- **Review Score**: 9.5/10 after critical fixes

**Key Decision Points**:
- Budget optimization is now optional (users won't get stuck)
- Cross-stage artifact updates follow cascade policy
- Manual override available for power users

---

## 👨‍💻 For Developers

### **START HERE**: Developer Checklist
**File**: `STAGE-GATED-DEV-CHECKLIST.md`

**Use this for**:
- Day-by-day implementation guide
- Verification checklists per phase
- Unit test requirements
- Integration test scenarios
- Rollback procedures

### Quick Reference Card
**File**: `STAGE-GATED-QUICK-REFERENCE.md`

**Use this for**:
- One-page architecture overview
- Code snippets you'll use daily
- Common patterns
- Debugging tips
- Database schema quick ref

### Full Implementation Plan
**File**: `STAGE-GATED-IMPLEMENTATION-PLAN.md`

**Use this for**:
- Deep dive into architecture
- Understanding design decisions
- Risk analysis
- Performance considerations
- Complete code examples

---

## 📊 Documentation Map

```
docs/
├── README-STAGE-GATED.md              ← YOU ARE HERE (navigation)
├── STAGE-GATED-IMPLEMENTATION-PLAN.md  ← Complete implementation guide
├── STAGE-GATED-DEV-CHECKLIST.md       ← Day-by-day developer checklist
├── STAGE-GATED-QUICK-REFERENCE.md     ← One-page cheat sheet
├── CLAUDE-PLAN-STAGE-GATED.md         ← Original detailed specification
└── PLAN-stage-gated-agents.md         ← Earlier draft (for reference)
```

---

## 🚀 Getting Started

### If you're implementing this:

1. **Read** `STAGE-GATED-IMPLEMENTATION-PLAN.md` (30 min)
   - Focus on: Executive Summary, Architecture Overview, Critical Fixes Applied
   
2. **Review** `STAGE-GATED-DEV-CHECKLIST.md` (15 min)
   - Understand the 4 phases
   - Note verification requirements
   
3. **Bookmark** `STAGE-GATED-QUICK-REFERENCE.md`
   - Keep open while coding
   - Reference for common patterns

4. **Start Phase 1**: Database migration + core types
   - Follow checklist Day 1-5
   - Run tests after each day
   - Commit frequently

### If you're reviewing this:

1. **Read** `STAGE-GATED-IMPLEMENTATION-PLAN.md` sections:
   - Executive Summary
   - Architecture Overview
   - Critical Fixes Applied
   - Open Questions & Decisions
   
2. **Check** Phase 1-2 implementation details
   - Verify stage definitions make sense
   - Confirm orchestrator changes are minimal
   
3. **Review** Testing Strategy section
   - E2E scenario walkthrough
   - Edge cases covered

---

## 🎯 Key Concepts

### The 4 Stages

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│ Planning │ -> │  Design  │ -> │  Build   │ -> │   Fix    │
└──────────┘    └──────────┘    └──────────┘    └──────────┘
   3 artifacts     1 artifact     2 artifacts     0 artifacts
```

**Planning**: Understand project (context, mvp, prd)  
**Design**: Select components (bom only - budget optional!)  
**Build**: Generate wiring + code (wiring, code)  
**Fix**: Debug & verify (no gates, always accessible)

### Stage-Gating Benefits

**Before**:
```
User: "Write the code"
→ Orchestrator picks from 11 agents
→ Might pick codeGenerator (no context exists!)
→ Agent asks "what microcontroller?"
→ User frustrated
```

**After**:
```
User: "Write the code" (in Planning stage)
→ Orchestrator picks from 2 agents: projectInitializer, conversational
→ Picks conversational
→ conversational says: "Let's define requirements first, then I'll write code"
→ User guided through correct flow
```

### Artifact Cascade Policy

When upstream artifact changes, downstream artifacts marked as `stale`:

```
BOM updated
  ↓
Wiring marked stale (needs regeneration)
  ↓
Code marked stale (needs regeneration)
```

User can regenerate by asking relevant agent.

---

## 📐 Architecture at a Glance

### New Infrastructure (7 files, ~530 lines)

```
lib/stages/
  stage-config.ts      # Stage definitions + types
  project-state.ts     # Load/save/advance logic
  prompt-builder.ts    # Focused orchestrator prompts
  artifact-validator.ts # Validity + cascade logic

components/stages/
  StageProgressBar.tsx      # Visual progress indicator
  StageOverrideButton.tsx   # Manual override UI

app/api/agents/
  project-state/route.ts    # API endpoint
```

### Modified Files (4 files, ~85 lines)

```
lib/agents/orchestrator.ts
  Lines 631-664: Stage-aware routing
  After 730: Stage advancement check

lib/supabase/types.ts
  +3 fields to chat_sessions

components/ai_chat/AIAssistantUI.jsx
  Mount progress bar + realtime

lib/db/chat.ts
  Export stage helpers
```

### Database Changes (1 migration)

```sql
ALTER TABLE chat_sessions ADD COLUMN
  project_stage TEXT DEFAULT 'planning',
  stage_override BOOLEAN DEFAULT FALSE,
  auto_orchestration BOOLEAN DEFAULT TRUE,
  stage_history JSONB DEFAULT '[]';
```

---

## 🔧 Implementation Timeline

### Week 1: Foundation (Non-Breaking)
- Database migration
- TypeScript types
- Stage config + validator + project-state services
- **Deliverable**: Core infrastructure, zero impact on users

### Week 2: Backend Integration
- Orchestrator routing changes
- Stage advancement logic
- Integration tests
- **Deliverable**: Stage-gating works, feature-flagged

### Week 3: Frontend
- StageProgressBar component
- Realtime updates
- API endpoint
- **Deliverable**: Users see stage progress

### Week 4: Polish + Launch
- Manual override
- Auto-orchestration toggle
- E2E testing
- Staged rollout (10% → 100%)
- **Deliverable**: Full production launch

---

## ✅ Critical Fixes Applied

These issues from the 8.5/10 review have been resolved:

| Priority | Issue | Resolution |
|----------|-------|------------|
| 🔴 High | Budget mandatory gate | Made optional (only BOM required in Design) |
| 🔴 High | No regeneration policy | Cascade policy defined + implemented |
| 🟡 Medium | Import bug in prompt-builder | Fixed: calculate inline, no circular dependency |
| 🟡 Medium | stage_history unused | Now records all transitions |
| 🟡 Medium | datasheetAnalyzer unclear | Removed from routing (support-only) |
| 🟢 Low | No artifact validity check | Added isArtifactValid() with min length |
| 🟢 Low | No user-facing block messages | Stage-aware agent responses |

**Result**: Review score improved from 8.5/10 to 9.5/10

---

## 🧪 Testing Requirements

### Must Pass Before Merge

**Unit Tests**:
- [ ] Stage config exports correctly
- [ ] isArtifactValid() handles all cases
- [ ] checkAndAdvanceStage() logic correct
- [ ] Prompt builder only includes eligible agents

**Integration Tests**:
- [ ] New chat defaults to planning
- [ ] Stage advances when artifacts complete
- [ ] Stage doesn't advance when artifacts missing
- [ ] Terminal stage (fix) never advances
- [ ] LLM invalid selection triggers fallback

**E2E Test** (Soil Moisture Sensor):
- [ ] Full project flow from idea to code
- [ ] No agent runs before prerequisites exist
- [ ] Stage transitions automatic and correct

**Performance**:
- [ ] ProjectState load < 100ms
- [ ] Stage check adds < 50ms overhead
- [ ] Realtime updates < 500ms

---

## 🚨 Rollback Plan

### Emergency (5 minutes)
```sql
UPDATE chat_sessions SET auto_orchestration = false;
```
→ Disables stage-gating, orchestrator uses old routing

### Full Rollback (30 minutes)
1. Revert orchestrator.ts changes
2. Hide StageProgressBar component
3. Restart services
4. **No data loss** (columns remain, new chats work)

---

## 📞 Support

### Before Implementation
- [ ] Read implementation plan in full
- [ ] Review critical fixes section
- [ ] Understand cascade policy
- [ ] Ask questions in team meeting

### During Implementation
- **Slack**: #stage-gated-implementation
- **Standup**: Daily at 10am
- **Code Review**: Required for orchestrator changes
- **Questions**: Tag @team-lead in Slack

### After Deployment
- **Monitoring**: Check dashboard for routing accuracy
- **Support**: Monitor #support for user confusion
- **Hotfix**: Use emergency rollback if needed
- **Retro**: Week 5, document lessons learned

---

## 📚 Additional Resources

### Internal Documentation
- Orchestrator architecture: `lib/agents/README.md`
- Artifact system: `lib/db/README.md`
- Agent configuration: `lib/agents/config.ts` comments

### External References
- Supabase realtime: https://supabase.com/docs/guides/realtime
- TypeScript handbook: https://www.typescriptlang.org/docs/
- React hooks: https://react.dev/reference/react

### Related Work
- Provider selection: `PROVIDER_SELECTION_IMPLEMENTATION_PLAN.md`
- Original agent design: `.agent/agents/*.md`
- Database schema: `OLD_context_docs/DATABASE_SCHEMA.sql`

---

## 🎉 Success Criteria

### Technical
- ✅ Zero TypeScript errors
- ✅ Routing accuracy > 90%
- ✅ Test coverage > 80%
- ✅ Performance < 100ms overhead
- ✅ Zero production errors

### User Experience
- ✅ Clear visual progress
- ✅ Natural stage transitions
- ✅ No confusing routing errors
- ✅ Project completion rate up 20%+

### Business
- ✅ Reduced support tickets
- ✅ Improved user retention
- ✅ Faster time-to-first-BOM
- ✅ Positive user feedback (>4/5 stars)

---

## 🏁 Next Steps

1. **For PM**: Review timeline, approve stage definitions
2. **For Tech Lead**: Review architecture, approve implementation approach
3. **For Dev Team**: Start Phase 1 (foundation)
4. **For QA**: Review testing requirements, prepare test cases
5. **For DevOps**: Prepare staging environment, monitoring dashboards

---

**Questions?** Reference the appropriate documentation file above or contact the project lead.

**Ready to start?** Head to `STAGE-GATED-DEV-CHECKLIST.md` and begin Phase 1, Day 1.

Good luck! 🚀
