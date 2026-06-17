# OHM Platform — Agent Architecture Plan
### For the Dev Team

---

## 1. The Problem We're Solving

Right now, every user message goes to the **orchestrator**, which looks at all 11 agents and tries to pick the right one. With 11 options and ambiguous user messages, it gets it wrong too often.

**Root cause:** The orchestrator has too many choices and no context about where the user is in their project journey.

**The fix:** We constrain the orchestrator's choices using **project stage** and **artifact completion**. Instead of picking from 11 agents, it picks from 2–3 that are relevant right now.

---

## 2. The Core Idea — Stage-Gated Artifact System

Every project moves through **4 stages**. Each stage has:
- A **goal** (what needs to be achieved before moving on)
- **Artifacts** that must be filled to complete the stage
- **Eligible agents** (only these can be called in this stage)

The stage **never advances** until all artifacts for that stage are filled.

```
┌─────────────────────────────────────────────────────────────┐
│  STAGE 1: Planning                                          │
│  Goal: Fully understand the project                         │
│  Artifacts: context, mvp, prd                               │
│  Agents: projectInitializer, conversational                 │
├─────────────────────────────────────────────────────────────┤
│  STAGE 2: Design                                            │
│  Goal: Know what to buy and what it costs                   │
│  Artifacts: bom, budget                                     │
│  Agents: bomGenerator, datasheetAnalyzer, budgetOptimizer   │
├─────────────────────────────────────────────────────────────┤
│  STAGE 3: Build                                             │
│  Goal: Wire it and code it                                  │
│  Artifacts: wiring, code                                    │
│  Agents: wiringSpecialist, codeGenerator                    │
├─────────────────────────────────────────────────────────────┤
│  STAGE 4: Fix                                               │
│  Goal: Make it work in the real world                       │
│  Artifacts: none (ongoing)                                  │
│  Agents: debugger, circuitVerifier                          │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. The Story (How It Flows for a Real User)

> This is a walkthrough of a user building a soil moisture sensor.
> Read this to understand the full system behavior end to end.

---

### User opens OHM and types:
> *"I want to build a soil moisture sensor with Arduino"*

**What happens:**
- OHM detects no existing project → creates a new one
- Sets `projectStage = "planning"`
- Checks planning artifacts: `context`, `mvp`, `prd` — all empty
- Orchestrator eligible agents: `projectInitializer`, `conversational`
- Message looks like a project kickoff → routes to **projectInitializer**
- projectInitializer gathers: experience level, budget, microcontroller, goals
- Saves output → `context` artifact is filled

---

### User continues:
> *"I want it to send alerts to my phone when the soil is dry"*

**What happens:**
- Still in `planning` stage
- `context` is filled, `mvp` and `prd` are still empty
- Orchestrator routes to **conversational**
- conversational defines: core features, tech stack, success metrics
- Saves output → `mvp` artifact is filled
- conversational continues: user stories, risks, timeline
- Saves output → `prd` artifact is filled

**Stage gate check:**
```
context ✓  mvp ✓  prd ✓  → ALL PLANNING ARTIFACTS COMPLETE
→ projectStage advances to "design"
```

---

### User types:
> *"What components do I need?"*

**What happens:**
- Stage is now `design`
- `bom` and `budget` are empty
- Eligible agents: `bomGenerator`, `datasheetAnalyzer`, `budgetOptimizer`
- Message is about components → routes to **bomGenerator**
- bomGenerator reads `context`, `mvp`, `prd` from project memory
- Already knows: Arduino Uno, WiFi needed, budget ₹500
- Generates BOM with part numbers, costs, suppliers
- Saves output → `bom` artifact is filled

---

### User says:
> *"This is too expensive, can we cut costs?"*

**What happens:**
- Still in `design`, `budget` artifact is empty
- Routes to **budgetOptimizer**
- Reads `bom` from memory — knows exact components
- Suggests cheaper alternatives, different suppliers
- Saves output → `budget` artifact is filled

**Stage gate check:**
```
bom ✓  budget ✓  → ALL DESIGN ARTIFACTS COMPLETE
→ projectStage advances to "build"
```

---

### User types:
> *"How do I connect everything?"*

**What happens:**
- Stage is `build`
- `wiring` and `code` are empty
- Eligible agents: `wiringSpecialist`, `codeGenerator`
- Message is about connections → routes to **wiringSpecialist**
- Reads `bom` from memory — knows exact components and pins
- Generates pin-to-pin wiring guide with safety warnings
- Saves output → `wiring` artifact is filled

---

### User types:
> *"Write the firmware"*

**What happens:**
- Still in `build`, `code` is empty
- Routes to **codeGenerator**
- Reads `context`, `mvp`, `prd`, `bom`, `wiring` from memory
- Writes complete firmware without asking a single question
- Saves output → `code` artifact is filled

**Stage gate check:**
```
wiring ✓  code ✓  → ALL BUILD ARTIFACTS COMPLETE
→ projectStage advances to "fix"
```

---

### User comes back 2 days later:
> *"The moisture reading is always 0, something is wrong"*

**What happens:**
- Stage is `fix`
- Eligible agents: `debugger`, `circuitVerifier`
- Routes to **debugger**
- Reads `code`, `wiring`, `bom` from memory
- Gives a targeted fix — knows exact pins, components, and code
- Does NOT ask "what microcontroller are you using?" — it already knows

---

## 4. The Project State Object

This is the single source of truth. Every agent reads from it and writes to it.
Stored in your database, attached to each project/session.

```typescript
interface ProjectState {
  projectId: string;
  userId: string;
  createdAt: timestamp;
  updatedAt: timestamp;

  // Stage management
  projectStage: "planning" | "design" | "build" | "fix";
  stageOverride: boolean;  // true if user manually set the stage

  // Artifacts — null means not yet generated
  artifacts: {
    context: ArtifactContent | null;
    mvp:     ArtifactContent | null;
    prd:     ArtifactContent | null;
    bom:     ArtifactContent | null;
    budget:  ArtifactContent | null;
    wiring:  ArtifactContent | null;
    code:    ArtifactContent | null;
  };
}

interface ArtifactContent {
  content: string;        // the actual artifact text/JSON
  generatedBy: string;    // which agent generated it
  generatedAt: timestamp;
  version: number;        // increments on each update
}
```

---

## 5. Stage Configuration (The Master Config)

Define this once. Everything else reads from it.

```typescript
const STAGE_CONFIG = {
  planning: {
    goal: "Fully understand the project before any design decisions",
    requiredArtifacts: ["context", "mvp", "prd"],
    eligibleAgents: ["projectInitializer", "conversational"],
    nextStage: "design",
  },
  design: {
    goal: "Decide what to buy and validate the cost",
    requiredArtifacts: ["bom", "budget"],
    eligibleAgents: ["bomGenerator", "datasheetAnalyzer", "budgetOptimizer"],
    nextStage: "build",
  },
  build: {
    goal: "Generate wiring instructions and working firmware",
    requiredArtifacts: ["wiring", "code"],
    eligibleAgents: ["wiringSpecialist", "codeGenerator"],
    nextStage: "fix",
  },
  fix: {
    goal: "Resolve hardware, software, and integration issues",
    requiredArtifacts: [],  // ongoing, no gate
    eligibleAgents: ["debugger", "circuitVerifier"],
    nextStage: null,        // terminal stage
  },
};
```

---

## 6. The Orchestrator Logic (Step by Step)

This replaces your current orchestrator prompt with actual logic.

```typescript
async function orchestrate(userMessage: string, projectState: ProjectState) {

  // STEP 1: Get current stage config
  const stage = projectState.projectStage;
  const stageConfig = STAGE_CONFIG[stage];

  // STEP 2: Check which artifacts are still missing in this stage
  const missingArtifacts = stageConfig.requiredArtifacts.filter(
    (artifact) => projectState.artifacts[artifact] === null
  );

  // STEP 3: Build a focused system prompt for the orchestrator
  // It now only sees 2-3 agents, not all 11
  const orchestratorPrompt = buildOrchestratorPrompt(
    userMessage,
    stage,
    stageConfig,
    missingArtifacts,
    projectState
  );

  // STEP 4: Call LLM to pick the agent (from small eligible set)
  const selectedAgent = await callLLM(orchestratorPrompt);

  // STEP 5: Run the selected agent with full project context
  const result = await runAgent(selectedAgent, userMessage, projectState);

  // STEP 6: Save artifact if agent produced one
  if (result.artifact) {
    await saveArtifact(projectState, result.artifact.type, result.artifact.content, selectedAgent);
  }

  // STEP 7: Check if stage should advance
  await checkAndAdvanceStage(projectState);

  return result;
}
```

---

## 7. The Orchestrator System Prompt (The Key Change)

Instead of one giant prompt listing all 11 agents, the orchestrator gets a **dynamic, focused prompt** built at runtime.

```typescript
function buildOrchestratorPrompt(
  userMessage: string,
  stage: string,
  stageConfig: StageConfig,
  missingArtifacts: string[],
  projectState: ProjectState
): string {
  return `
You are the OHM orchestrator. Your ONLY job is to pick the right agent
from a small list of eligible agents for the current project stage.

## Current Project Stage: ${stage.toUpperCase()}
Stage goal: ${stageConfig.goal}

## What's still needed in this stage:
Missing artifacts: ${missingArtifacts.join(", ") || "none — stage complete"}

## Project Context (summary):
${summarizeProjectState(projectState)}

## Eligible Agents for this stage:
${formatEligibleAgents(stageConfig.eligibleAgents)}

## User's message:
"${userMessage}"

## Your task:
Pick exactly ONE agent from the eligible list above.
Respond with just the agent name. Nothing else.

Rules:
- You may ONLY pick from the eligible agents listed above
- Pick based on what's missing and what the user is asking
- If the user asks something outside this stage's scope, still pick
  the most relevant eligible agent and note the mismatch
  `.trim();
}
```

---

## 8. Agent System Prompts (How Each Agent Knows Its Job)

Each agent gets:
1. Its own role/persona
2. The full project context from memory
3. The specific artifact it needs to produce
4. The format/schema for that artifact

```typescript
function buildAgentPrompt(
  agentName: string,
  userMessage: string,
  projectState: ProjectState
): string {

  const agentConfig = AGENT_CONFIG[agentName];
  const projectContext = buildProjectContext(projectState);

  return `
${agentConfig.persona}

## Your goal in this conversation:
${agentConfig.goal}

## Artifact you must produce:
Name: ${agentConfig.outputArtifact}
Format: ${agentConfig.outputFormat}

## Full project context (read this before responding):
${projectContext}

## User's message:
"${userMessage}"

## Instructions:
- Use the project context above. Do NOT ask for information already provided.
- When you have enough information, produce the artifact in the format specified.
- End your response with the artifact wrapped in <artifact type="${agentConfig.outputArtifact}">...</artifact> tags.
  `.trim();
}
```

---

## 9. Agent Configuration

```typescript
const AGENT_CONFIG = {
  projectInitializer: {
    persona: "You are OHM's Project Architect. You help users define their project through a friendly wizard.",
    goal: "Gather project goals, constraints, hardware, and experience level. Fill the context artifact.",
    outputArtifact: "context",
    outputFormat: "Structured JSON with: projectGoal, targetHardware, experienceLevel, budget, constraints, timeline",
  },
  conversational: {
    persona: "You are OHM's Lead Engineer. You guide users through defining their MVP and detailed requirements.",
    goal: "Define core features, tech stack, success metrics, user stories, and risks. Fill mvp and prd artifacts.",
    outputArtifact: "mvp_and_prd",
    outputFormat: "Two structured sections: MVP (features, stack, metrics) and PRD (user stories, timeline, risks)",
  },
  bomGenerator: {
    persona: "You are OHM's Component Specialist. You generate accurate Bills of Materials.",
    goal: "Generate a complete BOM based on project context. Include part numbers, costs, suppliers, power budget.",
    outputArtifact: "bom",
    outputFormat: "Table with: component name, part number, quantity, unit cost, supplier, link, power draw",
  },
  budgetOptimizer: {
    persona: "You are OHM's Cost Engineer. You find cheaper alternatives without sacrificing quality.",
    goal: "Review the BOM and suggest cost optimizations. Fill the budget artifact.",
    outputArtifact: "budget",
    outputFormat: "Original vs optimized cost table, trade-off warnings, sourcing recommendations",
  },
  datasheetAnalyzer: {
    persona: "You are OHM's Technical Analyst. You extract key specs from datasheets.",
    goal: "Analyze component datasheets and surface relevant specifications for this project.",
    outputArtifact: null,  // supports other agents, no own artifact
    outputFormat: "Structured spec summary relevant to the project",
  },
  wiringSpecialist: {
    persona: "You are OHM's Circuit Designer. You create clear, safe wiring instructions.",
    goal: "Generate complete pin-to-pin wiring guide based on BOM. Fill the wiring artifact.",
    outputArtifact: "wiring",
    outputFormat: "Pin connection table, wiring diagram description, safety warnings, power notes",
  },
  codeGenerator: {
    persona: "You are OHM's Software Engineer. You write clean, well-commented firmware.",
    goal: "Generate complete firmware based on context, BOM, and wiring. Fill the code artifact.",
    outputArtifact: "code",
    outputFormat: "Complete source files: src/main.cpp, include/config.h, with inline comments",
  },
  debugger: {
    persona: "You are OHM's Hardware Debugger. You diagnose and fix hardware, software, and integration issues.",
    goal: "Identify the root cause of the user's problem using all available project context.",
    outputArtifact: null,  // fixes are conversational
    outputFormat: "Root cause analysis, step-by-step fix, prevention advice",
  },
  circuitVerifier: {
    persona: "You are OHM's Circuit Inspector. You verify circuit photos against wiring specs.",
    goal: "Compare the user's circuit photo to the wiring guide and flag any mismatches.",
    outputArtifact: null,
    outputFormat: "List of issues found, correct vs actual connections, fix instructions",
  },
  conversationSummarizer: {
    persona: "You are OHM's Project Historian. You maintain running summaries of conversations.",
    goal: "Summarize the conversation so far into a compact context block.",
    outputArtifact: null,  // runs as background service
    outputFormat: "Compact bullet summary: decisions made, open questions, next steps",
  },
};
```

---

## 10. Stage Advancement Logic

```typescript
async function checkAndAdvanceStage(projectState: ProjectState): Promise<void> {
  const stage = projectState.projectStage;
  const stageConfig = STAGE_CONFIG[stage];

  // Terminal stage — never advances
  if (!stageConfig.nextStage) return;

  // Check if all required artifacts for this stage are filled
  const allFilled = stageConfig.requiredArtifacts.every(
    (artifact) => projectState.artifacts[artifact] !== null
  );

  if (allFilled) {
    projectState.projectStage = stageConfig.nextStage;
    projectState.updatedAt = Date.now();
    await saveProjectState(projectState);

    // Notify the frontend to update the stage indicator
    await emitStageChange(projectState.projectId, stageConfig.nextStage);

    console.log(`Project ${projectState.projectId} advanced to ${stageConfig.nextStage}`);
  }
}
```

---

## 11. Artifact Saving Logic

```typescript
async function saveArtifact(
  projectState: ProjectState,
  artifactType: string,
  content: string,
  generatedBy: string
): Promise<void> {

  const existing = projectState.artifacts[artifactType];

  projectState.artifacts[artifactType] = {
    content,
    generatedBy,
    generatedAt: Date.now(),
    version: existing ? existing.version + 1 : 1,
  };

  projectState.updatedAt = Date.now();
  await saveProjectState(projectState);
}
```

---

## 12. Artifact Extraction from Agent Response

Agents wrap their artifacts in XML tags. Parse them out:

```typescript
function extractArtifact(agentResponse: string): { type: string; content: string } | null {
  const match = agentResponse.match(/<artifact type="([^"]+)">([\s\S]*?)<\/artifact>/);
  if (!match) return null;

  return {
    type: match[1],
    content: match[2].trim(),
  };
}
```

---

## 13. Project Context Builder

This is what gets injected into every agent prompt.
It summarizes the current project state concisely.

```typescript
function buildProjectContext(projectState: ProjectState): string {
  const { artifacts } = projectState;
  const lines: string[] = [];

  if (artifacts.context) {
    lines.push(`## Project Context\n${artifacts.context.content}`);
  }
  if (artifacts.mvp) {
    lines.push(`## MVP Definition\n${artifacts.mvp.content}`);
  }
  if (artifacts.prd) {
    lines.push(`## Product Requirements\n${artifacts.prd.content}`);
  }
  if (artifacts.bom) {
    lines.push(`## Bill of Materials\n${artifacts.bom.content}`);
  }
  if (artifacts.budget) {
    lines.push(`## Budget Optimization\n${artifacts.budget.content}`);
  }
  if (artifacts.wiring) {
    lines.push(`## Wiring Guide\n${artifacts.wiring.content}`);
  }
  if (artifacts.code) {
    lines.push(`## Generated Code\n${artifacts.code.content}`);
  }

  return lines.length > 0
    ? lines.join("\n\n")
    : "No project context yet. This is the beginning of the project.";
}
```

---

## 14. The Auto-Orchestration Toggle

The user can toggle between two modes:

| Mode | Behavior |
|---|---|
| **Auto ON** | System auto-picks agent, auto-advances stage |
| **Auto OFF** | User sees eligible agents and picks manually. Stage advances only on user confirmation |

```typescript
async function handleUserMessage(
  userMessage: string,
  projectState: ProjectState,
  autoOrchestration: boolean
) {
  if (autoOrchestration) {
    // System decides everything
    return await orchestrate(userMessage, projectState);
  } else {
    // Show user the eligible agents for this stage
    const stageConfig = STAGE_CONFIG[projectState.projectStage];
    return {
      type: "agent_selection",
      message: `You're in the ${projectState.projectStage} stage. Which agent should handle this?`,
      eligibleAgents: stageConfig.eligibleAgents,
      userMessage,  // hold the message until agent is selected
    };
  }
}
```

---

## 15. Manual Stage Override

Power users can jump to any stage:

```typescript
async function manualStageOverride(
  projectState: ProjectState,
  targetStage: string
): Promise<void> {
  projectState.projectStage = targetStage;
  projectState.stageOverride = true;
  projectState.updatedAt = Date.now();
  await saveProjectState(projectState);
}
```

> **Note for the team:** When `stageOverride = true`, skip the artifact gate check. User is saying "I know what I'm doing, let me proceed."

---

## 16. The conversationSummarizer — Make It a Background Service

Right now it's treated as a peer agent. It should run **automatically in the background** after every N messages, not be routed to by the orchestrator.

```typescript
// Run after every 5 messages
async function backgroundSummarize(projectState: ProjectState, conversationHistory: Message[]) {
  if (conversationHistory.length % 5 !== 0) return;

  const summary = await callAgent("conversationSummarizer", {
    history: conversationHistory,
    projectState,
  });

  // Store summary for injection into future prompts
  await saveSummary(projectState.projectId, summary);
}
```

---

## 17. Complete Request Flow (End to End)

```
User sends message
        │
        ▼
Load ProjectState from DB
        │
        ▼
Run background summarizer (if N messages)
        │
        ▼
Is autoOrchestration ON?
    │           │
   YES          NO
    │           │
    ▼           ▼
Orchestrate  Show agent
(auto)       picker to user
    │           │
    └─────┬─────┘
          │
          ▼
Build focused orchestrator prompt
(stage + eligible agents + missing artifacts)
          │
          ▼
LLM picks agent (from 2-3 options)
          │
          ▼
Build agent prompt
(persona + project context + artifact format)
          │
          ▼
LLM runs agent → produces response + artifact
          │
          ▼
Extract artifact from response
          │
          ▼
Save artifact to ProjectState
          │
          ▼
Check stage gate
(all artifacts filled?)
          │
        YES → Advance stage → Notify frontend
        NO  → Stay in stage
          │
          ▼
Return response to user
```

---

## 18. What to Build — Dev Checklist

### Backend

- [ ] `ProjectState` schema + DB table
- [ ] `STAGE_CONFIG` constant
- [ ] `AGENT_CONFIG` constant
- [ ] `orchestrate()` function
- [ ] `buildOrchestratorPrompt()` function
- [ ] `buildAgentPrompt()` function
- [ ] `buildProjectContext()` function
- [ ] `extractArtifact()` parser
- [ ] `saveArtifact()` function
- [ ] `checkAndAdvanceStage()` function
- [ ] `manualStageOverride()` endpoint
- [ ] `backgroundSummarize()` service
- [ ] `handleUserMessage()` with toggle support

### Frontend

- [ ] Stage progress indicator (Planning → Design → Build → Fix)
- [ ] Artifact panel (show filled/empty status for each artifact)
- [ ] Auto-Orchestration toggle
- [ ] Agent picker UI (shown when toggle is OFF)
- [ ] Manual stage override button (power user feature)
- [ ] Stage advancement notification/animation

---

## 19. Key Principles to Never Break

1. **Stage never advances until ALL artifacts are filled** (unless stageOverride = true)
2. **Orchestrator only sees eligible agents for current stage** — never all 11
3. **Every agent reads from projectState** — agents never ask for info already captured
4. **Artifacts are versioned** — updates increment the version, never overwrite silently
5. **conversationSummarizer is infrastructure, not an agent** — runs in background
6. **The toggle controls who picks the agent** — not whether the stage system runs

---

*Document version 1.0 — OHM Platform Architecture*
*For internal dev team use*