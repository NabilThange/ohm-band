# PLAN: Stage-Gated Agent Architecture

> **Plan Slug:** `stage-gated-agents`
> **Version:** 1.0
> **Date:** 2026-06-17
> **Type:** Major Backend + Frontend Refactor

---

## 🎯 Goal

Replace the current flat-intent orchestrator (picks from all 11 agents via keyword routing) with a **Stage-Gated Artifact System**. The orchestrator will only ever see 2–3 eligible agents for the user's current project stage, dramatically improving routing accuracy and producing a coherent, stateful project journey.

---

## 🔍 Current State Analysis

### What exists today

| Layer | File | Current Behavior |
|-------|------|-----------------|
| **Config** | `lib/agents/config.ts` | `AgentType` union of 11 agents, flat `AGENTS` map with system prompts |
| **Orchestrator** | `lib/agents/orchestrator.ts` | `chat()` → intent classified by LLM → `intentAgentMap` (7 intents → 7 agents) |
| **Context** | `lib/agents/context-builder.ts` | Builds dynamic context from artifact DB records |
| **Artifacts DB** | `lib/db/artifacts.ts` | `ArtifactService` — create, version, fetch by type/chat |
| **Chat Sessions** | `lib/db/chat.ts` | `chat_sessions` table has `current_agent`, `agent_context`, `is_plan_locked` |
| **Supabase Types** | `lib/supabase/types.ts` | `chat_sessions` already has `agent_context: Json` — can be extended |

### Root problem (confirmed from code)

In `orchestrator.ts` line 647, the `intentAgentMap` maps all 7 intents from a **single flat prompt**. The orchestrator sees no project stage context and no artifact completion state. It can misroute a "what components do I need?" message to `bomGenerator` even when the user has not finished the `context` artifact yet.

---

## 📋 Open Questions

> Decisions required from team before implementation begins.

### Q1: DB storage — extend `chat_sessions` or new `project_state` table?

The `chat_sessions` table already has `agent_context: Json`. We can either:
- **Option A** — Add `project_stage` and `artifacts` columns directly to `chat_sessions`. Fast, no migration cascade.
- **Option B** — New `project_state` table linked to `chat_id`. Cleaner separation, extra join on every request.

**Recommendation:** Option A (extend `chat_sessions`) — less disruption to existing code paths.

### Q2: Auto-Orchestration toggle — source of truth?

Options: `chat_sessions.agent_context` JSON blob, new column `auto_orchestration: boolean`, or local frontend state only.

**Recommendation:** Store in `chat_sessions` as a dedicated boolean column so it persists across browser sessions.

### Q3: Stage override — bypass all future gates, or only one transition?

Per spec, `stageOverride = true` skips the artifact gate. Confirm: does this persist or clear after one transition?

**Recommendation:** Clear `stageOverride` after the single advance. One-time override only.

### Q4: `conversationSummarizer` trigger interval

Spec says "every N messages". Existing `summarizer.ts` already has logic. Confirm N value.

**Recommendation:** N = 5 (consistent with spec).

### Q5: Stage indicator placement in the UI

Where does the stage rail go — top bar stepper, left sidebar, or floating badge near input?

**Recommendation:** Horizontal stepper at the top of the chat pane (above messages), collapsible on mobile.

---

## 🗺️ Architecture Overview

```
User Message
    │
    ▼
Load ProjectState (from chat_sessions + artifacts DB)
    │
    ├── backgroundSummarize() if message % 5 === 0
    │
    ▼
Is autoOrchestration ON?
    ├── YES → orchestrate(message, projectState)
    └── NO  → return agent picker UI payload
    │
    ▼
buildOrchestratorPrompt()
  [stage + 2-3 eligible agents + missing artifacts + project summary]
    │
    ▼
LLM picks agent (focused context, not 11-way choice)
    │
    ▼
buildAgentPrompt()
  [persona + full project context + artifact schema]
    │
    ▼
Agent runs → response + <artifact> tag
    │
    ├── extractArtifact() → saveArtifact()
    │
    ▼
checkAndAdvanceStage()
  [ALL required artifacts filled? → advance → emitStageChange()]
    │
    ▼
Return response to user
```

---

## 📦 Proposed Changes

---

### Layer 0: Database Migration

#### [NEW] `migrations/add_project_state_to_sessions.sql`

```sql
-- Add project stage tracking to existing chat_sessions table
ALTER TABLE chat_sessions
  ADD COLUMN IF NOT EXISTS project_stage TEXT
    NOT NULL DEFAULT 'planning'
    CHECK (project_stage IN ('planning', 'design', 'build', 'fix')),
  ADD COLUMN IF NOT EXISTS stage_override BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS auto_orchestration BOOLEAN NOT NULL DEFAULT TRUE;

-- Index for stage-based queries
CREATE INDEX IF NOT EXISTS idx_chat_sessions_project_stage
  ON chat_sessions (project_stage);
```

> Artifact content already exists in `artifacts` + `artifact_versions` tables.
> We do NOT need a new table — only stage tracking columns in chat_sessions.

---

### Layer 1: Core Type Definitions

#### [NEW] `lib/agents/stage-config.ts`

**What it contains:**
- `ProjectStage` type union: `'planning' | 'design' | 'build' | 'fix'`
- `STAGE_CONFIG` constant — master stage-to-artifacts-to-agents map
- `ARTIFACT_KEYS` constant — the 7 artifact type names
- `ArtifactContent` interface, `ProjectState` interface, `StageConfig` interface

**Key exports:**
```typescript
export type ProjectStage = 'planning' | 'design' | 'build' | 'fix';
export type ArtifactKey = 'context' | 'mvp' | 'prd' | 'bom' | 'budget' | 'wiring' | 'code';
export const STAGE_CONFIG: Record<ProjectStage, StageConfig>;
export interface ProjectState { ... }
```

---

### Layer 2: Agent Config Extension

#### [MODIFY] `lib/agents/config.ts`

**Changes:**
1. Add `AgentStageConfig` interface with: `persona`, `goal`, `outputArtifact: ArtifactKey | null`, `outputFormat`
2. Add `AGENT_STAGE_CONFIG: Record<AgentType, AgentStageConfig>` constant (from spec section 9)
3. No changes to existing `AgentConfig`, `AGENTS`, `getChatAgentType` — fully backward compatible

---

### Layer 3: Project State Service

#### [NEW] `lib/agents/project-state.ts`

| Function | Purpose |
|----------|---------|
| `loadProjectState(chatId)` | Reads `chat_sessions` + all artifact latest versions → returns `ProjectState` |
| `saveProjectState(chatId, state)` | Writes stage/override/autoOrchestration back to `chat_sessions` |
| `saveArtifact(chatId, type, content, generatedBy)` | Wraps existing `ArtifactService.createVersion()` |
| `checkAndAdvanceStage(chatId, state)` | Checks all required artifacts filled; advances stage if true |
| `manualStageOverride(chatId, targetStage)` | Sets stage + `stage_override = true` |
| `getMissingArtifacts(state)` | Returns array of unfilled artifact keys for current stage |
| `buildProjectContext(state)` | Formats filled artifacts into a single context string |

---

### Layer 4: Prompt Builders

#### [NEW] `lib/agents/prompt-builders.ts`

| Function | Purpose |
|----------|---------|
| `buildOrchestratorPrompt(...)` | Focused system prompt: stage + 2-3 eligible agents + missing artifacts |
| `buildAgentPrompt(...)` | Agent persona + full project context + artifact format |
| `formatEligibleAgents(agentNames)` | Formats eligible agents into readable descriptions |
| `summarizeProjectState(state)` | Compact 3-5 line project summary for injection |
| `extractArtifact(response)` | Parses `<artifact type="...">...</artifact>` XML from agent responses |

---

### Layer 5: Orchestrator Refactor

#### [MODIFY] `lib/agents/orchestrator.ts`

**Surgical change — replace lines 631–664 (flat intentAgentMap) with stage-aware routing:**

```
BEFORE (lines 631-664):
  const intentResult = await this.runner.runAgent('orchestrator', ...)
  intent = intentResult.response.trim().toUpperCase()
  const intentAgentMap = { BOM, CODE, WIRING, DEBUG, ... }
  finalAgentType = intentAgentMap[intent] || 'conversational'

AFTER:
  const projectState = await loadProjectState(this.chatId)
  if (projectState.autoOrchestration) {
    finalAgentType = await stageAwareRoute(userMessage, projectState)
  } else {
    return agentPickerPayload(projectState)
  }
```

**New private method `stageAwareRoute()`:**
1. Calls `buildOrchestratorPrompt()` with focused eligible-agent list
2. Calls LLM (orchestrator/fast role)
3. Validates response is in `stageConfig.eligibleAgents`; fallback to first eligible if invalid
4. Returns `AgentType`

**New post-agent steps (after line 724):**
1. `extractArtifact(response)` — parse XML tags
2. If artifact found → `saveArtifact(chatId, type, content, agentType)`
3. `checkAndAdvanceStage(chatId, projectState)` → may emit stage change event

**Background summarizer hook (after line 578):**
- Call `backgroundSummarize()` fire-and-forget if `messageCount % 5 === 0`

> The existing `forceAgent` override (line 621) remains — wired to Manual Mode.
> All other existing logic (streaming, tool calls, key rotation) is unchanged.

---

### Layer 6: Background Summarizer

#### [MODIFY] `lib/agents/summarizer.ts`

**Changes:**
- Export `backgroundSummarize(chatId, projectState, history)` as a standalone function
- Existing `ConversationSummarizer` class stays intact
- New function wraps it with the "every 5 messages" guard and project state injection
- Fire-and-forget — does not block the main response pipeline

---

### Layer 7: API Routes

#### [MODIFY] `app/api/agents/chat/route.ts`

**Changes:**
- Return `projectState` in response payload (stage, filledArtifacts, missingArtifacts)
- Accept optional `manualAgentOverride` in request body (for picker mode)
- Accept optional `autoOrchestration` preference to persist session setting

#### [NEW] `app/api/agents/stage-override/route.ts`

- `POST` with body `{ chatId, targetStage }` → calls `manualStageOverride()`
- Returns updated `projectState`

---

### Layer 8: Supabase Types

#### [MODIFY] `lib/supabase/types.ts`

Add to `chat_sessions` Row/Insert/Update:
```typescript
project_stage: 'planning' | 'design' | 'build' | 'fix'
stage_override: boolean
auto_orchestration: boolean
```

---

### Layer 9: Frontend — Stage Progress Bar

#### [NEW] `components/ai_chat/StageProgressBar.tsx`

Horizontal stepper: `Planning → Design → Build → Fix`
- Active stage: animated glow ring
- Completed stages: checkmark icon
- Artifact bubbles below each stage (filled = green, empty = grey)
- Stage tooltip on hover: goal text + artifact checklist
- Stage advance animation: slide + subtle pulse

---

### Layer 10: Frontend — Artifact Status Panel

#### [NEW] `components/ai_chat/ArtifactStatusPanel.tsx`

Collapsible panel showing artifact status table:
- ✅ Filled (generatedBy agent, version badge)
- ⏳ Pending
- Clicking a filled artifact opens it in a read-only drawer

---

### Layer 11: Frontend — Auto-Orchestration Toggle + Agent Picker

#### [MODIFY] `components/ai_chat/Header.jsx`

- Add toggle: "Auto" / "Manual" mode
- Persists to `chat_sessions.auto_orchestration` via API

#### [NEW] `components/ai_chat/AgentPickerModal.tsx`

- Shows only `stageConfig.eligibleAgents` for current stage (2-3 cards)
- Each card: icon, name, description
- Selecting sets `forceAgent` for next message send

---

### Layer 12: Frontend — Stage Override Button

#### [NEW] `components/ai_chat/StageOverrideButton.tsx`

- Power-user ⚡ button, hidden behind developer settings toggle
- Modal with 4 stage options → calls `POST /api/agents/stage-override`
- Stage indicator updates immediately after confirmation

---

### Layer 13: Main Chat UI

#### [MODIFY] `components/ai_chat/AIAssistantUI.jsx`

- Mount `StageProgressBar` above message list
- Mount `ArtifactStatusPanel` in sidebar or as collapsible drawer
- Pass `projectState` from API response down to these components

---

## 📐 File Impact Summary

| File | Action | Impact |
|------|--------|--------|
| `migrations/add_project_state_to_sessions.sql` | NEW | DB schema — 3 new columns |
| `lib/agents/stage-config.ts` | NEW | Core types + STAGE_CONFIG constant |
| `lib/agents/project-state.ts` | NEW | State read/write/advance service |
| `lib/agents/prompt-builders.ts` | NEW | Dynamic prompt construction + XML parser |
| `lib/agents/config.ts` | MODIFY | Add AGENT_STAGE_CONFIG (no breaking changes) |
| `lib/agents/orchestrator.ts` | MODIFY | Replace routing lines 631-664 + 3 new post-agent steps |
| `lib/agents/summarizer.ts` | MODIFY | Export backgroundSummarize() function |
| `lib/db/artifacts.ts` | NO CHANGE | Already handles versioned artifacts |
| `lib/db/chat.ts` | MODIFY | Add stage-aware fields to updateSession helper |
| `lib/supabase/types.ts` | MODIFY | Add 3 new columns to chat_sessions types |
| `app/api/agents/chat/route.ts` | MODIFY | Return projectState, accept manualAgent |
| `app/api/agents/stage-override/route.ts` | NEW | Manual stage override endpoint |
| `components/ai_chat/StageProgressBar.tsx` | NEW | Stage stepper UI |
| `components/ai_chat/ArtifactStatusPanel.tsx` | NEW | Artifact status panel |
| `components/ai_chat/AgentPickerModal.tsx` | NEW | Manual agent selection modal |
| `components/ai_chat/StageOverrideButton.tsx` | NEW | Power-user stage jump |
| `components/ai_chat/Header.jsx` | MODIFY | Toggle + wire auto/manual state |
| `components/ai_chat/AIAssistantUI.jsx` | MODIFY | Mount new components, pass projectState |

---

## 🔄 Backward Compatibility

- All existing `chat_sessions` rows default to `project_stage = 'planning'`, `auto_orchestration = TRUE`, `stage_override = FALSE`
- First-message `projectInitializer` routing is **unchanged** (line 626-630 in orchestrator)
- `forceAgent` override path is **preserved** and wired to Manual Mode
- Existing `ArtifactService` API is unchanged — new code wraps it

---

## ⚠️ Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| LLM hallucinates agent name outside eligible list | Medium | Wrong routing | Validate response; fallback to first eligible agent |
| Agent omits `<artifact>` tags | Medium | Stage never advances | Track `hasArtifact` flag; only gate-check if flag is true |
| Existing chats stuck in wrong stage | Low | Confusing UX | Migration defaults all to `planning`; admin repair tool |
| Stage indicator causes layout shift | Low | Visual jank | Fixed height allocation + skeleton loading |
| `backgroundSummarize` adds response latency | Low | Slower replies | Run as fire-and-forget `Promise` — does not block |

---

## 📅 Implementation Order

```
Phase 1 — Foundation (no UI changes, fully reversible)
  1. DB Migration
  2. lib/supabase/types.ts
  3. lib/agents/stage-config.ts
  4. lib/agents/config.ts (add AGENT_STAGE_CONFIG)
  5. lib/agents/project-state.ts
  6. lib/agents/prompt-builders.ts
  7. lib/db/chat.ts (updateSession helper)

Phase 2 — Backend Wire-Up
  8. lib/agents/orchestrator.ts (routing + post-agent steps)
  9. lib/agents/summarizer.ts (export backgroundSummarize)
  10. app/api/agents/chat/route.ts
  11. app/api/agents/stage-override/route.ts

Phase 3 — Frontend
  12. StageProgressBar.tsx
  13. ArtifactStatusPanel.tsx
  14. AgentPickerModal.tsx
  15. StageOverrideButton.tsx
  16. Header.jsx
  17. AIAssistantUI.jsx

Phase 4 — Verify
  18. Unit tests (stage-config, project-state, prompt-builders)
  19. E2E scenario: soil moisture sensor walkthrough
  20. Backward compat check on existing chats
  21. TypeScript compile check (npx tsc --noEmit)
```

---

## 🧪 Verification Checklist

### Unit Tests
- [ ] `checkAndAdvanceStage()` advances when ALL artifacts filled
- [ ] `checkAndAdvanceStage()` stays when ANY artifact is null
- [ ] `checkAndAdvanceStage()` never advances for terminal `fix` stage
- [ ] `buildOrchestratorPrompt()` only includes eligible agents for the stage
- [ ] `extractArtifact()` correctly parses valid XML artifact tags
- [ ] `extractArtifact()` returns null for malformed/missing tags
- [ ] Stage override bypasses artifact gate and clears after use

### Integration (Manual E2E)
- [ ] New chat → first message → `projectInitializer` → `context` artifact saved
- [ ] Next message → `conversational` → `mvp` + `prd` saved → advances to `design`
- [ ] In `design`: only `bomGenerator`, `datasheetAnalyzer`, `budgetOptimizer` eligible
- [ ] `bom` + `budget` saved → advances to `build`
- [ ] In `build`: only `wiringSpecialist`, `codeGenerator` eligible
- [ ] `wiring` + `code` saved → advances to `fix`
- [ ] In `fix`: only `debugger`, `circuitVerifier` eligible

### Frontend
- [ ] Stage bar updates without page refresh
- [ ] Artifact panel reflects DB state within 1 render cycle
- [ ] Manual mode toggle persists across page reload
- [ ] Agent picker shows correct 2-3 agents for stage
- [ ] Stage override moves to target stage immediately

---

## ✅ Definition of Done

- [ ] Orchestrator never accesses the full 11-agent map during routing — only `stageConfig.eligibleAgents`
- [ ] Every agent receives `projectState.artifacts` context before responding
- [ ] Artifact versions increment on each update (no silent overwrites)
- [ ] `conversationSummarizer` is never orchestrator-routed — only called by `backgroundSummarize()`
- [ ] `stageOverride` is cleared after a single stage advance
- [ ] All unit tests pass
- [ ] `npx tsc --noEmit` returns zero errors
- [ ] E2E soil-moisture scenario completes without routing errors

---

*Plan created by: Antigravity — /plan workflow*
*File: `docs/PLAN-stage-gated-agents.md`*
