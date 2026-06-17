# Stage-Gated Architecture - Developer Checklist
**Implementation Guide for Dev Team**

---

## 📋 Pre-Implementation Review

### Required Reading
- [ ] Read `STAGE-GATED-IMPLEMENTATION-PLAN.md` in full
- [ ] Review "Critical Fixes Applied" section (addresses 8.5/10 → 9.5/10 review)
- [ ] Understand the 4 stages: Planning → Design → Build → Fix
- [ ] Review artifact dependency tree (cascade policy)

### Architecture Understanding
- [ ] Current orchestrator routing logic (orchestrator.ts lines 631-664)
- [ ] How ArtifactService works (versioning, content vs content_json)
- [ ] Tool execution flow (ToolExecutor → database → realtime updates)
- [ ] Existing chat_sessions schema and available fields

---

## 🚀 Phase 1: Core Infrastructure (Week 1)

### Day 1-2: Database & Types

#### Database Migration
**File**: `migrations/add_stage_gating.sql`
- [ ] Create migration file with stage columns
- [ ] Add `project_stage` column with check constraint
- [ ] Add `stage_override` boolean (default false)
- [ ] Add `auto_orchestration` boolean (default true)
- [ ] Add `stage_history` JSONB array (default [])
- [ ] Add index: `idx_chat_sessions_project_stage`
- [ ] Test migration on local database
- [ ] Test migration rollback

**Verification**:
```bash
psql $DATABASE_URL -f migrations/add_stage_gating.sql
# Check columns exist
psql $DATABASE_URL -c "\d chat_sessions"
```

#### TypeScript Types
**File**: `lib/supabase/types.ts`
- [ ] Add `project_stage` to Row/Insert/Update
- [ ] Add `stage_override` to Row/Insert/Update
- [ ] Add `auto_orchestration` to Row/Insert/Update
- [ ] Regenerate types: `npx supabase gen types typescript --local`
- [ ] Run `npx tsc --noEmit` to verify no errors

### Day 3-4: Stage Configuration

#### Stage Config
**File**: `lib/stages/stage-config.ts` (NEW)
- [ ] Define `ProjectStage` type union
- [ ] Define `ArtifactKey` type union
- [ ] Create `StageConfig` interface
- [ ] Implement `STAGE_CONFIG` object (4 stages)
  - [ ] Planning: context, mvp, prd required
  - [ ] Design: bom required (budget optional!)
  - [ ] Build: wiring, code required
  - [ ] Fix: no required artifacts
- [ ] Define `ProjectState` interface
- [ ] Define `ArtifactContent` interface
- [ ] Export all types

**Test**:
```typescript
import { STAGE_CONFIG } from './stage-config';
console.log(STAGE_CONFIG.planning.requiredArtifacts); // ['context', 'mvp', 'prd']
console.log(STAGE_CONFIG.design.requiredArtifacts);   // ['bom'] ✅ NOT ['bom', 'budget']
```

#### Artifact Validator
**File**: `lib/stages/artifact-validator.ts` (NEW)
- [ ] Implement `isArtifactValid(artifact)` function
  - [ ] Check null/undefined
  - [ ] Validate minimum content length (50 chars)
  - [ ] Handle text artifacts (content field)
  - [ ] Handle JSON artifacts (content_json field)
  - [ ] Handle code artifacts (files array)
- [ ] Define `ARTIFACT_DEPENDENCIES` map
- [ ] Implement `markDependenciesStale(chatId, updatedArtifact)`
- [ ] Add unit tests

**Test**:
```typescript
isArtifactValid(null); // false
isArtifactValid({ content: '' }); // false
isArtifactValid({ content: 'a'.repeat(51) }); // true
```

### Day 5: Project State Service

**File**: `lib/stages/project-state.ts` (NEW)
- [ ] Implement `loadProjectState(chatId)`
  - [ ] Query chat_sessions for stage info
  - [ ] Load all 7 artifact types in parallel
  - [ ] Return ProjectState object
- [ ] Implement `checkAndAdvanceStage(chatId)`
  - [ ] Load current state
  - [ ] Check terminal stage (fix)
  - [ ] Validate all required artifacts with `isArtifactValid()`
  - [ ] Record transition in stage_history
  - [ ] Update project_stage and clear stage_override
- [ ] Implement `getMissingArtifacts(state)`
- [ ] Implement `setStage(chatId, targetStage)` for manual override
- [ ] Add unit tests

**Test**:
```typescript
// Mock database, verify:
// - Stage advances when all required artifacts valid
// - Stage stays when any artifact missing
// - Terminal stage never advances
// - stage_history records transitions
```

---

## 🔧 Phase 2: Backend Integration (Week 2)

### Day 1-2: Prompt Builder

**File**: `lib/stages/prompt-builder.ts` (NEW)
- [ ] Implement `buildOrchestratorPrompt(userMessage, projectState)`
  - [ ] Get eligible agents from stage config
  - [ ] Calculate missing artifacts inline (NOT via ProjectStateService)
  - [ ] Format agent descriptions
  - [ ] Build focused prompt (2-3 agents, not 11)
- [ ] Implement `buildProjectContextSummary(state)`
- [ ] Add unit tests

**Critical**: Do NOT import ProjectStateService here (causes circular dependency).

**Test**:
```typescript
const prompt = buildOrchestratorPrompt('What components?', mockPlanningState);
// Should only list projectInitializer, conversational
// Should NOT list bomGenerator, codeGenerator, etc.
```

### Day 3-4: Orchestrator Modification

**File**: `lib/agents/orchestrator.ts` (MODIFY)

#### Imports (top of file)
- [ ] Add: `import { ProjectStateService } from '@/lib/stages/project-state'`
- [ ] Add: `import { buildOrchestratorPrompt } from '@/lib/stages/prompt-builder'`
- [ ] Add: `import { STAGE_CONFIG } from '@/lib/stages/stage-config'`

#### Replace Routing Logic (lines 631-664)
- [ ] Comment out old intentAgentMap routing
- [ ] Add `const projectState = await ProjectStateService.loadProjectState(this.chatId)`
- [ ] Check `projectState.autoOrchestration`
- [ ] If auto: use `buildOrchestratorPrompt()` → call LLM → validate response
- [ ] If manual: return agent picker payload (TODO: Phase 4)
- [ ] Add fallback: if LLM picks invalid agent → use first eligible
- [ ] Log stage + selected agent

**Before/After**:
```typescript
// BEFORE (DELETE):
const intentResult = await this.runner.runAgent('orchestrator', ...);
const intentAgentMap = { BOM: 'bomGenerator', ... };
finalAgentType = intentAgentMap[intent] || 'conversational';

// AFTER (ADD):
const projectState = await ProjectStateService.loadProjectState(this.chatId);
if (projectState.autoOrchestration) {
  const prompt = buildOrchestratorPrompt(userMessage, projectState);
  const result = await this.runner.runAgent('orchestrator', [{ role: 'user', content: prompt }], { stream: false });
  const selected = result.response.trim().toLowerCase();
  const stageConfig = STAGE_CONFIG[projectState.projectStage];
  finalAgentType = stageConfig.eligibleAgents.includes(selected as AgentType) 
    ? selected as AgentType 
    : stageConfig.eligibleAgents[0];
}
```

#### Add Stage Check (after line 730)
- [ ] After agent completes, check if any `write` tool calls occurred
- [ ] If yes: call `ProjectStateService.checkAndAdvanceStage(this.chatId)`
- [ ] Log if stage advanced

```typescript
// Add after line 730 (after response parsing)
if (this.chatId && result.toolCalls.some(tc => tc.name === 'write')) {
  const advanced = await ProjectStateService.checkAndAdvanceStage(this.chatId);
  if (advanced) {
    console.log('🎉 Stage advanced!');
  }
}
```

### Day 5: Integration Testing
- [ ] Test full message flow: user message → stage routing → agent execution → stage check
- [ ] Verify stage never advances with incomplete artifacts
- [ ] Verify orchestrator only picks from eligible agents
- [ ] Test fallback when LLM returns invalid agent
- [ ] Check stage_history records transitions
- [ ] Run `npx tsc --noEmit` (no TypeScript errors)

---

## 🎨 Phase 3: Frontend (Week 3)

### Day 1-2: Stage Progress Bar

**File**: `components/stages/StageProgressBar.tsx` (NEW)
- [ ] Create functional component
- [ ] Accept props: `currentStage`, `completedArtifacts`, `requiredArtifacts`
- [ ] Render 4 stage badges (Planning, Design, Build, Fix)
- [ ] Highlight current stage with border + animation
- [ ] Show checkmark for completed stages
- [ ] Display artifact completion count
- [ ] Add responsive styling (collapse on mobile)
- [ ] Test with different stage combinations

### Day 3-4: UI Integration

**File**: `components/ai_chat/AIAssistantUI.jsx` (MODIFY)
- [ ] Add state: `const [projectState, setProjectState] = useState(null)`
- [ ] Fetch project state on chat selection
- [ ] Mount `<StageProgressBar />` above ChatPane
- [ ] Pass stage data as props
- [ ] Add realtime subscription to chat_sessions
- [ ] Show toast notification on stage advance
- [ ] Test stage indicator updates live

**Realtime Subscription**:
```javascript
useEffect(() => {
  const channel = supabase
    .channel(`session:${selectedChat}`)
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'chat_sessions',
      filter: `chat_id=eq.${selectedChat}`
    }, (payload) => {
      if (payload.new.project_stage !== projectState?.projectStage) {
        setProjectState(prev => ({ ...prev, projectStage: payload.new.project_stage }));
        toast.success(`Advanced to ${payload.new.project_stage} stage! 🎉`);
      }
    })
    .subscribe();
  return () => supabase.removeChannel(channel);
}, [selectedChat]);
```

### Day 5: API Endpoint

**File**: `app/api/agents/project-state/route.ts` (NEW)
- [ ] Create GET endpoint
- [ ] Accept `chatId` query param
- [ ] Call `ProjectStateService.loadProjectState(chatId)`
- [ ] Return ProjectState JSON
- [ ] Add error handling
- [ ] Test with curl/Postman

```bash
curl "http://localhost:3000/api/agents/project-state?chatId=xxx"
# Returns: { chatId, projectStage, artifacts, ... }
```

---

## 🎯 Phase 4: Advanced Features (Week 4)

### Day 1-2: Manual Override

**File**: `components/stages/StageOverrideButton.tsx` (NEW)
- [ ] Create power-user override button (⚡ icon)
- [ ] Render modal with 4 stage options
- [ ] POST to `/api/agents/stage-override` endpoint
- [ ] Show confirmation dialog
- [ ] Update UI optimistically

**File**: `app/api/agents/stage-override/route.ts` (NEW)
- [ ] Accept `{ chatId, targetStage }`
- [ ] Call `ProjectStateService.setStage(chatId, targetStage)`
- [ ] Return updated state
- [ ] Add admin-only check (optional)

### Day 3-4: Auto-Orchestration Toggle

**File**: `components/ai_chat/Header.jsx` (MODIFY)
- [ ] Add Switch component
- [ ] Read `auto_orchestration` from session
- [ ] Update database on toggle
- [ ] When OFF: show manual agent picker (cards)
- [ ] When ON: use stage-gated routing
- [ ] Persist preference across sessions

**Manual Agent Picker UI** (when toggle OFF):
- [ ] Load eligible agents from `STAGE_CONFIG[currentStage]`
- [ ] Render as cards with icons
- [ ] Click card → set `forceAgent` → send message
- [ ] Show "Auto Mode" recommendation for new users

### Day 5: Polish & Documentation
- [ ] Add tooltips to stage badges (hover = stage goal)
- [ ] Add "What's this?" help modal
- [ ] Write user-facing documentation
- [ ] Update README with stage-gating info
- [ ] Create demo video/GIF

---

## ✅ Verification Checklist

### Unit Tests
- [ ] `stage-config.ts`: Stage definitions export correctly
- [ ] `artifact-validator.ts`: isArtifactValid() handles all cases
- [ ] `artifact-validator.ts`: Dependency tree is correct
- [ ] `project-state.ts`: loadProjectState() returns valid data
- [ ] `project-state.ts`: checkAndAdvanceStage() logic correct
- [ ] `prompt-builder.ts`: Prompt only includes eligible agents

### Integration Tests
- [ ] New chat defaults to `planning` stage
- [ ] projectInitializer runs on first message
- [ ] Stage advances when all required artifacts created
- [ ] Stage does NOT advance when artifact missing
- [ ] Terminal stage (fix) never advances
- [ ] Manual override bypasses gates
- [ ] LLM invalid selection triggers fallback
- [ ] stage_history records all transitions

### E2E Test (Soil Moisture Sensor)
- [ ] User: "Build soil moisture sensor" → projectInitializer
- [ ] Answer questions → conversational creates context, mvp, prd
- [ ] Verify: Stage advances to Design
- [ ] User: "What components?" → bomGenerator
- [ ] Verify: Stage advances to Build (without budget!)
- [ ] User: "Show wiring" → wiringDiagram
- [ ] User: "Write code" → codeGenerator
- [ ] Verify: Stage advances to Fix
- [ ] User: "Sensor reads 0" → debugger runs

### Performance Tests
- [ ] ProjectState loading < 100ms
- [ ] Stage check adds < 50ms to response
- [ ] No N+1 queries (use parallel artifact loading)
- [ ] Realtime updates fire within 500ms

### Backward Compatibility
- [ ] Existing chats still work (default to planning)
- [ ] forceAgent parameter still bypasses stage gates
- [ ] Tool execution unchanged
- [ ] API responses backward compatible

### TypeScript
- [ ] `npx tsc --noEmit` → 0 errors
- [ ] No `any` types in new files
- [ ] All interfaces exported properly

---

## 🐛 Known Edge Cases to Test

### Edge Case 1: Partial Artifact Content
**Scenario**: Agent writes artifact but content is truncated/empty
**Expected**: `isArtifactValid()` returns false, stage doesn't advance
**Test**: Mock artifact with `content: "abc"` (< 50 chars)

### Edge Case 2: Concurrent Stage Transitions
**Scenario**: Two users editing same chat, both trigger stage advancement
**Expected**: Database constraints prevent double-advance
**Test**: Simulate concurrent `checkAndAdvanceStage()` calls

### Edge Case 3: Stage Override During Agent Execution
**Scenario**: User manually changes stage while agent is responding
**Expected**: Agent completes in old stage, next message uses new stage
**Test**: Override stage, immediately send message

### Edge Case 4: Artifact Regeneration
**Scenario**: User changes BOM in Build stage
**Expected**: Wiring + Code marked as stale
**Test**: Update BOM, check dependent artifacts have `stale: true` in metadata

### Edge Case 5: Budget Optional in Design
**Scenario**: User completes BOM, asks to move to Build without budget
**Expected**: Stage advances automatically (budget not required)
**Test**: Create BOM, verify design → build transition

---

## 📊 Success Metrics

### Technical Metrics
- [ ] Routing accuracy > 90% (log analysis)
- [ ] Zero TypeScript errors
- [ ] Test coverage > 80% for new code
- [ ] API response time increase < 100ms
- [ ] Zero critical errors in production

### User Metrics
- [ ] Project completion rate increases
- [ ] Average time-to-BOM decreases
- [ ] Support tickets about "stuck projects" = 0
- [ ] User feedback on stage system > 4/5 stars

---

## 🚨 Rollback Plan

If critical issues arise in production:

### Immediate Rollback (< 5 minutes)
```sql
-- Disable stage-gating globally
UPDATE chat_sessions SET auto_orchestration = false;
```
Result: Orchestrator falls back to old intent mapping.

### Full Rollback (< 30 minutes)
1. Revert orchestrator.ts changes (restore intent mapping)
2. Hide StageProgressBar in frontend
3. Restart backend services
4. Database columns remain (no data loss)

### Rollforward Strategy
- Fix bugs in feature branch
- Deploy to 10% of traffic
- Monitor for 24 hours
- Gradually increase to 100%

---

## 📞 Support & Questions

### Before Starting
- Review `STAGE-GATED-IMPLEMENTATION-PLAN.md` sections 1-9
- Understand why budget is now optional (Critical Fixes #1)
- Understand cascade policy for artifact updates (Critical Fixes #2)

### During Implementation
- Slack channel: #stage-gated-implementation
- Daily standup: 10am
- Code reviews: Required for orchestrator.ts changes

### Deployment
- Staging deploy: Thursday Week 4
- Production deploy: Monday Week 5 (10% traffic)
- Full rollout: Friday Week 5 (100% traffic)

---

## 🎉 Definition of Done

Phase 1 Complete:
- [ ] All database migrations run successfully
- [ ] All TypeScript types compile without errors
- [ ] Stage config, validator, project-state services implemented
- [ ] Unit tests pass

Phase 2 Complete:
- [ ] Orchestrator uses stage-aware routing
- [ ] Stage advancement logic works
- [ ] Integration tests pass
- [ ] No regression in existing functionality

Phase 3 Complete:
- [ ] StageProgressBar renders correctly
- [ ] Realtime updates work
- [ ] UI reflects database state
- [ ] Mobile responsive

Phase 4 Complete:
- [ ] Manual override works
- [ ] Auto-orchestration toggle works
- [ ] Polish complete
- [ ] Documentation written

**Project Complete**:
- [ ] All phases done
- [ ] All tests pass
- [ ] 10% production rollout successful
- [ ] Monitoring dashboards show green
- [ ] Dev team trained on new system
- [ ] User documentation published

---

**Good luck! You've got a solid plan. Now go build it.** 🚀
