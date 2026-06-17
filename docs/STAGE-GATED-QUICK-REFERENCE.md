# Stage-Gated Architecture - Quick Reference
**One-page cheat sheet for developers**

---

## 🎯 The Big Idea

**Before**: Orchestrator picks from 11 agents → often wrong  
**After**: Orchestrator picks from 2-3 stage-eligible agents → usually right

**How**: Stage-gate system with required artifacts per stage

---

## 📊 The 4 Stages

```
Planning → Design → Build → Fix
```

| Stage | Goal | Required Artifacts | Eligible Agents |
|-------|------|-------------------|-----------------|
| **Planning** | Understand project | context, mvp, prd | projectInitializer, conversational |
| **Design** | Select components | **bom only** (budget optional!) | bomGenerator, budgetOptimizer |
| **Build** | Generate wiring + code | wiring, code | wiringDiagram, codeGenerator |
| **Fix** | Debug & verify | none | debugger, circuitVerifier |

---

## 🗂️ New Files to Create

```
lib/stages/
├── stage-config.ts           # Stage definitions (80 lines)
├── project-state.ts           # Load/save/advance logic (140 lines)
├── prompt-builder.ts          # Orchestrator prompt builder (50 lines)
└── artifact-validator.ts      # Validity checks + cascade (80 lines)

components/stages/
├── StageProgressBar.tsx       # Visual progress (80 lines)
└── StageOverrideButton.tsx    # Manual override (60 lines)

app/api/agents/
└── project-state/route.ts     # API endpoint (20 lines)

migrations/
└── add_stage_gating.sql       # Database changes (20 lines)
```

**Total New Code**: ~530 lines

---

## 🔧 Files to Modify

```
lib/agents/orchestrator.ts
  Lines 631-664: Replace intent mapping with stage routing
  After line 730: Add stage advancement check
  ~40 lines changed

lib/supabase/types.ts
  Add 3 fields to chat_sessions
  ~10 lines

components/ai_chat/AIAssistantUI.jsx
  Mount StageProgressBar, add realtime subscription
  ~30 lines

lib/db/chat.ts
  Add stage helper exports
  ~5 lines
```

**Total Modifications**: ~85 lines

---

## ⚡ Key Code Snippets

### Load Project State
```typescript
import { ProjectStateService } from '@/lib/stages/project-state';

const state = await ProjectStateService.loadProjectState(chatId);
// Returns: { projectStage, artifacts: { context, mvp, prd, ... } }
```

### Check Stage Advancement
```typescript
// After agent writes artifact
if (toolCalls.some(tc => tc.name === 'write')) {
  const advanced = await ProjectStateService.checkAndAdvanceStage(chatId);
  if (advanced) console.log('🎉 Stage advanced!');
}
```

### Build Focused Orchestrator Prompt
```typescript
import { buildOrchestratorPrompt } from '@/lib/stages/prompt-builder';
import { STAGE_CONFIG } from '@/lib/stages/stage-config';

const prompt = buildOrchestratorPrompt(userMessage, projectState);
// Prompt only includes 2-3 eligible agents, not all 11
```

### Validate Agent Selection
```typescript
const stageConfig = STAGE_CONFIG[projectState.projectStage];
const selectedAgent = llmResponse.trim().toLowerCase();

const finalAgent = stageConfig.eligibleAgents.includes(selectedAgent)
  ? selectedAgent
  : stageConfig.eligibleAgents[0]; // Fallback
```

### Check Artifact Validity
```typescript
import { isArtifactValid } from '@/lib/stages/artifact-validator';

const allFilled = stageConfig.requiredArtifacts.every(
  key => isArtifactValid(state.artifacts[key])
);
```

---

## 🚨 Critical Issues Fixed

| Issue | Solution |
|-------|----------|
| ❌ Budget mandatory in Design | ✅ Changed to optional (only BOM required) |
| ❌ No artifact regeneration policy | ✅ Cascade policy defined (see artifact-validator.ts) |
| ❌ Import bug in prompt-builder | ✅ Calculate missing artifacts inline |
| ❌ stage_history unused | ✅ Now records all transitions |
| ❌ datasheetAnalyzer role unclear | ✅ Removed from routing (support-only agent) |
| ❌ No content validation | ✅ Added isArtifactValid() (min 50 chars) |

---

## 📐 Artifact Dependency Tree

```
context
  ↓
mvp, prd
  ↓
bom ──→ budget (independent)
  ↓
wiring
  ↓
code
```

**Rule**: Updating upstream artifact marks downstream as `stale: true`

**Example**: Changing BOM → marks wiring + code as stale

---

## 🧪 Testing Commands

```bash
# TypeScript check
npx tsc --noEmit

# Run database migration
psql $DATABASE_URL -f migrations/add_stage_gating.sql

# Verify columns added
psql $DATABASE_URL -c "\d chat_sessions"

# Test API endpoint
curl "http://localhost:3000/api/agents/project-state?chatId=xxx"

# Test project state loading
node -e "
  const { ProjectStateService } = require('./lib/stages/project-state');
  ProjectStateService.loadProjectState('test-chat-id').then(console.log);
"
```

---

## 🎨 Frontend Integration

### Mount Progress Bar
```jsx
import { StageProgressBar } from '@/components/stages/StageProgressBar';

<StageProgressBar 
  currentStage={projectState.projectStage}
  completedArtifacts={Object.keys(projectState.artifacts).filter(k => projectState.artifacts[k])}
  requiredArtifacts={STAGE_CONFIG[projectState.projectStage].requiredArtifacts}
/>
```

### Add Realtime Updates
```javascript
useEffect(() => {
  const channel = supabase
    .channel(`session:${chatId}`)
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'chat_sessions',
      filter: `chat_id=eq.${chatId}`
    }, (payload) => {
      if (payload.new.project_stage !== projectState?.projectStage) {
        setProjectState(prev => ({ ...prev, projectStage: payload.new.project_stage }));
        toast.success(`Advanced to ${payload.new.project_stage}! 🎉`);
      }
    })
    .subscribe();
  return () => supabase.removeChannel(channel);
}, [chatId]);
```

---

## 🔄 Orchestrator Modification

### Before (Lines 631-664) ❌
```typescript
const intentResult = await this.runner.runAgent('orchestrator', ...);
intent = intentResult.response.trim().toUpperCase();
const intentAgentMap = {
  'BOM': 'bomGenerator',
  'CODE': 'codeGenerator',
  'WIRING': 'wiringDiagram',
  'DEBUG': 'debugger',
  'DATASHEET': 'datasheetAnalyzer',
  'BUDGET': 'budgetOptimizer',
  'CHAT': 'conversational'
};
finalAgentType = intentAgentMap[intent] || 'conversational';
```

### After (Lines 631-664) ✅
```typescript
const projectState = await ProjectStateService.loadProjectState(this.chatId);
const stageConfig = STAGE_CONFIG[projectState.projectStage];

if (projectState.autoOrchestration) {
  const prompt = buildOrchestratorPrompt(userMessage, projectState);
  const result = await this.runner.runAgent('orchestrator', 
    [{ role: 'user', content: prompt }], 
    { stream: false }
  );
  
  const selected = result.response.trim().toLowerCase();
  finalAgentType = stageConfig.eligibleAgents.includes(selected as AgentType)
    ? selected as AgentType
    : stageConfig.eligibleAgents[0];
  
  intent = `${projectState.projectStage}_${finalAgentType}`;
} else {
  // Manual mode: return agent picker (Phase 4)
  finalAgentType = 'conversational'; // Temp fallback
  intent = 'MANUAL_MODE';
}
```

### Add After Line 730 ✅
```typescript
// Check for stage advancement
if (this.chatId && result.toolCalls.some(tc => tc.name === 'write')) {
  const advanced = await ProjectStateService.checkAndAdvanceStage(this.chatId);
  if (advanced) {
    console.log('🎉 Stage advanced!');
  }
}
```

---

## 🗄️ Database Schema Changes

```sql
ALTER TABLE chat_sessions 
  ADD COLUMN IF NOT EXISTS project_stage TEXT 
    NOT NULL DEFAULT 'planning' 
    CHECK (project_stage IN ('planning', 'design', 'build', 'fix')),
  ADD COLUMN IF NOT EXISTS stage_override BOOLEAN 
    NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS auto_orchestration BOOLEAN 
    NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS stage_history JSONB 
    DEFAULT '[]'::jsonb;

CREATE INDEX IF NOT EXISTS idx_chat_sessions_project_stage 
  ON chat_sessions (project_stage);
```

---

## 📝 Common Patterns

### Pattern 1: Get Eligible Agents for Current Stage
```typescript
const stageConfig = STAGE_CONFIG[projectState.projectStage];
const eligibleAgents = stageConfig.eligibleAgents;
// ['projectInitializer', 'conversational'] for planning stage
```

### Pattern 2: Check if Artifact Exists
```typescript
const hasBom = projectState.artifacts.bom !== null;
const hasValidBom = isArtifactValid(projectState.artifacts.bom);
```

### Pattern 3: Manual Stage Override (Power Users)
```typescript
await ProjectStateService.setStage(chatId, 'build');
// Sets stage to 'build' and stage_override = true
```

### Pattern 4: Get Missing Artifacts
```typescript
const missing = stageConfig.requiredArtifacts.filter(
  key => projectState.artifacts[key] === null
);
// ['mvp', 'prd'] if only context exists
```

### Pattern 5: Mark Dependents Stale After Update
```typescript
import { markDependenciesStale } from '@/lib/stages/artifact-validator';

// After updating BOM
await markDependenciesStale(chatId, 'bom');
// Marks wiring + code as stale
```

---

## 🐛 Debugging Tips

### Issue: Stage never advances
**Check**:
1. Are all required artifacts created? (`SELECT * FROM artifacts WHERE chat_id = 'xxx'`)
2. Is artifact content valid? (check `content` or `content_json` not empty)
3. Is `stage_override` blocking advancement? (`SELECT stage_override FROM chat_sessions`)

### Issue: Wrong agent selected
**Check**:
1. What's the current stage? (`SELECT project_stage FROM chat_sessions`)
2. Did orchestrator pick from eligible list? (check logs for fallback message)
3. Is `auto_orchestration` enabled? (`SELECT auto_orchestration FROM chat_sessions`)

### Issue: Realtime updates not working
**Check**:
1. Is Supabase realtime enabled? (check dashboard)
2. Is subscription filter correct? (`chat_id=eq.${chatId}`)
3. Are RLS policies allowing reads? (check Supabase auth)

---

## 🚀 Rollback Plan

### Emergency Rollback (5 minutes)
```sql
-- Disable stage-gating for all chats
UPDATE chat_sessions SET auto_orchestration = false;
```

### Full Rollback (30 minutes)
1. Revert orchestrator.ts to previous commit
2. Hide StageProgressBar component
3. Restart services
4. Database columns stay (no data loss)

---

## 📊 Success Metrics

- **Routing accuracy**: > 90% (orchestrator picks correct agent)
- **Stage advancement**: Automatic when artifacts complete
- **Performance**: < 100ms overhead per request
- **TypeScript**: Zero compilation errors
- **User feedback**: > 4/5 stars on stage system

---

## 📚 Full Documentation

- **Implementation Plan**: `STAGE-GATED-IMPLEMENTATION-PLAN.md`
- **Dev Checklist**: `STAGE-GATED-DEV-CHECKLIST.md`
- **Original Specs**: `CLAUDE-PLAN-STAGE-GATED.md`

---

**Questions?** Reference the full implementation plan or ask in #stage-gated-implementation.
