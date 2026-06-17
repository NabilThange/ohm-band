# 3D Enclosure: Pre-Build Decisions & Corrections

**Date:** Pre-Phase 1 Implementation  
**Purpose:** Resolve contradictions and specify critical decisions before code is written

---

## Critical Issues Found in Original Plan

The full plan in `3D-ENCLOSURE-CRITIQUE-AND-PLAN.md` contains four contradictions/gaps that must be resolved before implementation:

1. **Stage placement contradiction** (Build vs Fix)
2. **Component dimension fallback underspecified** (silent guess vs explicit ask)
3. **DB migration scope unclear** (shared infrastructure change)
4. **Intent routing regression risk** (LLM classifier boundary shift)

---

## 1. Stage Placement: FINAL DECISION

### The Contradiction

**Original plan claimed two different things:**
- Section 4.4: "Post-Build (Fix stage)" and "enclosureGenerator runs after Build gate opens"
- Section 4.6: `eligibleAgents: ['wiringDiagram', 'codeGenerator', 'enclosureGenerator']` in **Build** stage

**These are incompatible.** Build stage's eligibleAgents are auto-routable during Build. Fix stage starts after Build gate opens.

### Actual Codebase Pattern

**Cite: `lib/stages/stage-config.ts:61-68`**
```typescript
design: {
  requiredArtifacts: ['bom'], // budget is OPTIONAL
  eligibleAgents: ['bomGenerator', 'budgetOptimizer'],
  supportAgents: ['datasheetAnalyzer'], // force-only, not auto-routed
}
```

**Key insight:** budgetOptimizer is in `eligibleAgents` (auto-routable) but budget is NOT in `requiredArtifacts` (optional). Stage advances without it.

### ✅ FINAL DECISION: Fix Stage with Optional Generation

**Enclosure follows budget pattern but lives in Fix, not Build/Design.**

**Rationale:**
- Build stage = "make it work electrically" (wiring + code)
- Enclosure = post-electrical enhancement, like debugging
- Fix stage has NO required artifacts (terminal stage)
- User can generate enclosure any time after Build completes

**Updated Stage Config:**
```typescript
// lib/stages/stage-config.ts

export type ArtifactKey =
  | 'context' | 'mvp' | 'prd'
  | 'bom' | 'budget'
  | 'wiring' | 'code'
  | 'enclosure';  // ← ADD

build: {
  description: 'Get connection instructions and working firmware',
  goal: 'Generate wiring diagrams and firmware code',
  requiredArtifacts: ['wiring', 'code'],  // ← UNCHANGED (enclosure NOT required)
  eligibleAgents: ['wiringDiagram', 'codeGenerator'],  // ← UNCHANGED
  nextStage: 'fix',
},

fix: {
  description: 'Troubleshoot, verify, and enhance your build',  // ← UPDATE description
  goal: 'Debug hardware/software issues and optionally generate enclosures',  // ← UPDATE goal
  requiredArtifacts: [],  // ← UNCHANGED (terminal, no gate)
  eligibleAgents: ['debugger', 'circuitVerifier', 'enclosureGenerator'],  // ← ADD enclosureGenerator
  nextStage: null,
}
```

**Orchestrator Impact:**
- Fix stage prompt includes enclosureGenerator as option
- User requests "generate enclosure" → orchestrator routes to enclosureGenerator
- Happens AFTER Build complete (wiring + code exist, BOM stable)

**Why not Build stage?**
- Couples mechanical and electrical concerns
- User without 3D printer is presented enclosure option during electrical work (confusing)
- BOM might still change during Build (unstable input)

**Why not new "Fabrication" stage?**
- Architectural overkill for one optional agent
- Slippery slope (PCB layout, case labels, assembly instructions all want stages)

---

## 2. Component Dimension Fallback: FINAL DECISION

### The Problem

**Original plan (Appendix A1):**
```typescript
export function getComponentDimensions(partNumber: string, name: string): ComponentDimensions {
  // ... try exact match, try fuzzy match ...
  
  // Fallback: Conservative guess with warning
  console.warn(`Unknown component dimensions: ${partNumber} (${name})`);
  return {
    width: 30, length: 30, height: 15,
    // Agent will add comment in .scad to verify
  };
}
```

**Reality:** Most BOMs will hit this fallback (50-part database won't cover majority of real projects). Silent 30×30×15mm guess undermines "deterministic, validated" value prop.

**Phase 1 success metric:** "80%+ generated enclosures printable" — unrealistic if 40%+ of components are guessed dimensions.

### ✅ FINAL DECISION: Explicit User Prompt for Unknown Dimensions

**When enclosureGenerator encounters unknown component:**

**Step 1: Agent detects gap**
```typescript
// lib/enclosure/component-dimensions.ts
export function getComponentDimensions(partNumber: string, name: string): ComponentDimensions | null {
  // Try exact match
  if (COMPONENT_DIMENSIONS[partNumber]) return COMPONENT_DIMENSIONS[partNumber];
  
  // Try fuzzy match
  const normalized = name.toUpperCase().replace(/[^A-Z0-9]/g, '');
  for (const [key, dims] of Object.entries(COMPONENT_DIMENSIONS)) {
    if (normalized.includes(key.replace(/[^A-Z0-9]/g, ''))) return dims;
  }
  
  // NOT FOUND - return null (no silent guess)
  return null;
}
```

**Step 2: Agent generates .scad with placeholder + halts**
```scad
// base.scad - INCOMPLETE (missing dimensions)

// ⚠️ UNKNOWN COMPONENT: "MysteriousSensor-X42"
// Please measure your part and provide dimensions:
// Width (mm): ____
// Length (mm): ____
// Height (mm): ____
// mysterious_sensor_width = 0;   // ← PLACEHOLDER - WILL NOT PRINT
// mysterious_sensor_length = 0;
// mysterious_sensor_height = 0;
```

**Step 3: Agent asks user via chat**
```
⚠️ I need dimensions for these components to complete the enclosure:

1. **MysteriousSensor-X42** (from BOM)
   - Width (mm): [ ]
   - Length (mm): [ ]
   - Height (mm): [ ]

2. **CustomPCB-Handwired**
   - Width (mm): [ ]
   - Length (mm): [ ]
   - Height (mm): [ ]

Please provide dimensions (measure with calipers if needed), or I can generate a conservative oversized box (+20mm each dimension).
```

**Step 4: User responds with dimensions or "oversized"**
- **User provides:** Agent updates .scad variables, regenerates
- **User says "oversized":** Agent uses conservative guess (component_width + 20mm clearance) with comment

**Why this beats silent guess:**
1. **User awareness:** No surprise "doesn't fit" after printing
2. **Accuracy:** Real measurements beat database guesses
3. **Validates determinism:** Known inputs → validated outputs

**Phase 1 MVP database scope:**
- Start with 50 components (ESP32, Arduino, BME280, relay modules, servos)
- Covers ~60-70% of beginner maker projects
- Explicit prompt flow for remaining 30-40%
- Success metric adjusts: "80%+ of generated enclosures printable" → "95%+ when dimensions provided"

---

## 3. DB Migration Scope: ISOLATED CHANGE

### The Risk

**Original plan section 4.6:**
```typescript
// lib/db/artifacts.ts (Line 290+) - NEW FUNCTION
async function markDependentsStale(artifactId: string, type: ArtifactType, chatId: string) {
  const dependents = {
    'bom': ['wiring', 'enclosure'],  // ← Modifying existing key
    'context': ['enclosure'],        // ← New key
    'wiring': [],
    'code': [],
    'enclosure': []
  };
  // ... existing stale-marking logic
}
```

**Problem:** This modifies a shared function used by existing artifact cascade (BOM → wiring). A bug here breaks existing behavior, not just enclosures.

### ✅ FINAL DECISION: Phased DB Changes

**Phase 1a: Additive-only migration (safe)**
```sql
-- migrations/001_add_enclosure_artifact_type.sql

-- Add 'enclosure' to artifact_type enum (additive, doesn't affect existing data)
ALTER TYPE artifact_type ADD VALUE IF NOT EXISTS 'enclosure';

-- No changes to existing tables/functions yet
```

**Phase 1b: Add artifact creation (no cascade yet)**
```typescript
// lib/db/artifacts.ts - ONLY add write path, no stale propagation

// Existing: createArtifact, createVersion, getLatestArtifact work unchanged
// New: enclosureGenerator can write 'enclosure' artifact type
// Stale cascade: enclosure does NOT participate (manual regenerate only)
```

**Phase 1c: Manual regenerate via UI button**
```tsx
// components/drawers/EnclosureDrawer.tsx

{artifact.stale && (
  <Banner variant="warning">
    ⚠️ BOM changed after enclosure generated. Dimensions may be outdated.
    <Button onClick={regenerateEnclosure}>Regenerate Enclosure</Button>
  </Banner>
)}
```

**Phase 2: Stale cascade (after Phase 1 validates)**
```typescript
// lib/db/artifacts.ts - NEW markDependentsStale (Phase 2 only)

// Test separately:
// 1. Verify existing BOM→wiring cascade still works
// 2. Add BOM→enclosure cascade
// 3. Add context→enclosure cascade

// Regression test: BOM update should mark BOTH wiring AND enclosure stale
```

**Why phased:**
- Phase 1 enclosure generation works without cascade (user clicks "regenerate")
- If Phase 1 ships and cascade breaks something, enclosures don't take down wiring
- Shared infrastructure changes get explicit review + testing

**Implementation order:**
1. Migration (enum only)
2. enclosureGenerator agent + write path
3. UI drawer + manual regenerate
4. **STOP AND VALIDATE Phase 1**
5. Then add stale cascade in Phase 2

---

## 4. Intent Routing: Regression Check

### The Risk

**Original plan section 4.6:**
```typescript
// lib/agents/orchestrator.ts (Line 44-52)
systemPrompt: `...
• CODE - Programming/firmware help
• WIRING - "How do I connect this?"
• ENCLOSURE - "Generate case", "3D print", "enclosure"  // ← ADD
• DEBUG - Debugging requests
...`
```

**Problem:** LLM intent classifiers aren't purely additive. Adding "ENCLOSURE" can shift existing boundaries:
- "generate mounting bracket" might now route to ENCLOSURE instead of WIRING
- "make box for battery" might route to ENCLOSURE instead of CHAT

### ✅ FINAL DECISION: Intent Addition + Regression Test

**Step 1: Add intent with narrow trigger phrases**
```typescript
// lib/agents/orchestrator.ts orchestrator system prompt

**Intent Classification:**
• CHAT - General questions, project guidance, feature suggestions
• BOM - "parts list", "what will this cost", "component selection"
• CODE - "write firmware", "programming help", "fix my code"
• WIRING - "how do I connect", "pin connections", "circuit diagram"
• ENCLOSURE - "generate case", "3D print enclosure", "make housing", "STL file"  // ← NARROW
• DEBUG - "not working", "error", "troubleshoot"
• DATASHEET - User uploads PDF/image of component datasheet
• BUDGET - "too expensive", "cheaper alternative", "reduce cost"
```

**Step 2: Define explicit regression test cases**
```typescript
// lib/agents/__tests__/orchestrator-routing.test.ts (NEW FILE)

describe('Orchestrator Intent Routing', () => {
  const testCases = [
    // Existing intents (must not regress)
    { message: 'what components do I need', expected: 'BOM', stage: 'design' },
    { message: 'how much will this cost', expected: 'BOM', stage: 'design' },
    { message: 'write the Arduino code', expected: 'CODE', stage: 'build' },
    { message: 'how do I wire the ESP32 to the sensor', expected: 'WIRING', stage: 'build' },
    { message: 'my LED is not lighting up', expected: 'DEBUG', stage: 'fix' },
    { message: 'what is the best approach for this project', expected: 'CHAT', stage: 'planning' },
    
    // New enclosure intent
    { message: 'generate 3D printable enclosure', expected: 'ENCLOSURE', stage: 'fix' },
    { message: 'I need an STL file for the case', expected: 'ENCLOSURE', stage: 'fix' },
    { message: 'make a housing for this', expected: 'ENCLOSURE', stage: 'fix' },
    
    // Boundary cases (should NOT route to ENCLOSURE)
    { message: 'how do I mount the battery', expected: 'WIRING', stage: 'build' },  // mounting = wiring concern
    { message: 'generate wiring diagram', expected: 'WIRING', stage: 'build' },     // "generate" doesn't mean enclosure
    { message: 'what box should I buy', expected: 'CHAT', stage: 'planning' },      // buying vs generating
  ];

  testCases.forEach(({ message, expected, stage }) => {
    it(`routes "${message}" to ${expected} in ${stage} stage`, async () => {
      const projectState = mockProjectState({ projectStage: stage });
      const result = await runOrchestrator(message, projectState);
      expect(result.selectedAgent).toBe(AGENT_MAP[expected]);
    });
  });
});
```

**Step 3: Run regression before merging**
```bash
npm test -- orchestrator-routing.test.ts
# All existing cases must pass before enclosure intent is merged
```

**Why this matters:**
- Wrong routing = user frustration ("I asked for wiring, why did it make an enclosure?")
- Hard to debug in production (depends on LLM inference, not deterministic)
- Test cases document expected behavior for future changes

---

## Summary: Ready-to-Build Spec

### Stage Placement
✅ **Fix stage, optional artifact, follows budgetOptimizer pattern**
- Add to Fix stage eligibleAgents
- NOT in requiredArtifacts (stage advances without it)
- User requests enclosure after Build complete

### Component Dimensions
✅ **Explicit user prompt for unknowns, no silent guess**
- 50-part database covers common components
- Unknown → agent asks user for measurements
- Fallback option: "oversized box" (+20mm clearance)
- Phase 1 metric: "95%+ printable when dimensions provided"

### DB Migration
✅ **Phased: enum-only first, cascade in Phase 2**
- Phase 1a: Add 'enclosure' enum value (safe)
- Phase 1b: enclosureGenerator writes, no stale cascade yet
- Phase 1c: Manual regenerate button in UI
- Phase 2: markDependentsStale (after Phase 1 validates)

### Intent Routing
✅ **Narrow triggers + regression test before merge**
- "generate case", "3D print enclosure", "STL file" → ENCLOSURE
- Test existing intents still work (BOM, WIRING, CODE, DEBUG)
- Boundary cases documented: "mount battery" = WIRING, not ENCLOSURE

---

## Corrected Implementation Checklist

**Phase 1 MVP (2-3 weeks):**

**Week 1: Core Infrastructure**
- [ ] Migration: Add 'enclosure' artifact type enum
- [ ] Type defs: Add 'enclosure' to ArtifactKey union
- [ ] Stage config: Add enclosureGenerator to Fix stage eligibleAgents
- [ ] Component database: 50 common parts (ESP32, Arduino, sensors, relays)
- [ ] Dimension lookup: Returns null for unknowns (no silent guess)

**Week 2: Agent + Prompt Flow**
- [ ] Agent config: enclosureGenerator (modelRole: 'code', temp: 0.2)
- [ ] System prompt: Read BOM/wiring/context → generate .scad → ask user for missing dims
- [ ] Tool registration: enclosureGenerator gets ['read', 'write', 'open_drawer']
- [ ] Orchestrator intent: Add "ENCLOSURE" with narrow triggers
- [ ] Intent regression tests: 15+ test cases (existing + new + boundary)

**Week 3: UI + Validation**
- [ ] EnclosureDrawer component: Syntax-highlighted .scad display
- [ ] Manual regenerate button: "BOM changed" warning banner
- [ ] Minimal box template: OpenSCAD code with clear parameter comments
- [ ] Validation: Check wall thickness ≥2mm, overhang ≤45°
- [ ] Integration test: End-to-end (BOM → request enclosure → .scad generated)

**Acceptance Criteria:**
- [ ] Intent routing regression test passes (all 15+ cases)
- [ ] Unknown component → agent asks user for dimensions (no silent guess)
- [ ] Generated .scad prints without supports on Ender 3
- [ ] User can edit wall_thickness parameter and regenerate
- [ ] Existing wiring/code generation unaffected (no shared infrastructure bugs)

**NOT in Phase 1:**
- ❌ Stale cascade (manual regenerate only)
- ❌ Planning stage questions (post-Build trigger only)
- ❌ Multi-template support (minimal box only)
- ❌ In-browser 3D preview (export STL via OpenSCAD CLI)

---

## Decision Log

| Decision | Rationale | Rejected Alternative |
|----------|-----------|---------------------|
| Fix stage, not Build | Enclosure = post-electrical enhancement | Build stage (couples mechanical + electrical) |
| Explicit dimension prompt | User awareness > silent guess | 30×30mm fallback (undermines determinism) |
| Phased DB migration | Isolate risk to new feature | Modify shared stale cascade immediately |
| Intent regression tests | Catch LLM routing boundary shifts | "We'll test manually in production" |

**No ambiguities remain. Ready to implement.**

---

**Document Status:** Pre-build spec complete  
**Blockers Resolved:** 4/4  
**Next Action:** Create Phase 1 implementation PR with checklist above
