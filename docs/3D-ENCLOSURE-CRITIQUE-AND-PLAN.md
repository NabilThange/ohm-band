# 3D Enclosure Generation: Critical Analysis & Implementation Plan

**Date:** 2025-01-XX  
**Purpose:** Evaluate image→3D proposal against OHM architecture. Provide final implementation recommendation.

---

## Executive Summary

**Prior Proposal:** GPT Image generation → TripoSR image-to-3D → printingSpecialist agent starting at Build stage

**Verdict:** ❌ **Fundamentally incompatible with OHM's deterministic, artifact-driven architecture**

**Recommendation:** ✅ **Parametric OpenSCAD generation via new Planning questions + Build stage agent**

**Core Issues:**
1. BOM has ZERO dimensional data (bomGenerator only tracks electrical specs)
2. Image→3D is probabilistic reconstruction, not deterministic design
3. Build stage already "complete" when wiring+code exist—no stage gate for enclosures
4. No dimension gathering flow exists in Planning/Design stages

**Why Parametric Wins:**
- Works with existing artifact system (text-based, Git-versioned)
- Deterministic (same inputs = same output)
- Validates correctness (dimension constraints can be checked)
- Fits tool pattern (read BOM → generate .scad → write artifact)

---

## Phase 3: Critique of Image→3D Proposal

### 3.1 Image→3D Fit Analysis

#### **Current Reality (Phase 1 Findings)**

**Cite: `lib/parsers.ts:5-25` BOMComponent interface**
```typescript
export interface BOMComponent {
    name: string;
    partNumber: string;
    quantity: number;
    voltage?: string;
    current?: string;
    estimatedCost?: number;
    supplier?: string;
    link?: string;
    notes?: string;
}
```

**Problem:** No `dimensions`, `width`, `height`, `depth`, `mounting_holes`, or physical geometry fields exist.

**Cite: `lib/agents/config.ts:308-344` bomGenerator system prompt**
```
**Critical checks:**
1. **Power drama prevention** - 3.3V vs 5V mixups...
2. **Real parts only** - Exact part numbers...
3. **Safety nets** - GPIO pins max 20-40mA...
```

**Reality:** bomGenerator validates ELECTRICAL specs only. No physical dimensions gathering.

#### **Why Image→3D Fails**

**Cite: OHM architecture from `lib/stages/stage-config.ts:54-79`**
```typescript
export interface ArtifactContent {
    artifactId: string;
    version: number;
    generatedBy: string;
    createdAt: string;
    stale?: boolean;  // ← Deterministic cascade system
}
```

**1. Data Incompatibility**
- TripoSR needs: Image of desired enclosure shape
- OHM has: Component names, part numbers, voltage ratings
- **Gap:** No way to generate "correct" image from electrical BOM

**2. Probabilistic vs Deterministic**
- OHM's stale-flag system assumes: `BOM change → wiring outdated → re-validate`
- Image→3D reconstruction: Same image → slightly different 3D mesh each run
- **Conflict:** Can't validate if output is "correct" when correctness is probabilistic

**3. Precision Requirements**
- Enclosures need: ±0.5mm tolerance for mounting holes, exact PCB dimensions
- TripoSR: Designed for artistic reconstruction, not engineering precision
- **Example failure:** ESP32 DevKit (48.26mm × 27.94mm) becomes ~49mm × ~28mm → doesn't fit

**4. Validation Impossibility**
- **Cite: `lib/agents/config.ts:444-530` debugger agent cross-domain validation**
- Debugger validates: code pins match wiring, BOM voltages match code
- **Image→3D:** How to validate generated STL fits BOM components? No ground truth.

#### **Architectural Mismatch**

**Cite: `lib/agents/orchestrator.ts:21-33` Agent Model Mapping**
```
* Agent Model Mapping (Dynamic via modelRole):
* - BOM Generator: "reasoning" role → provider-specific reasoning model
* - Code Generator: "code" role → provider-specific code model
* - Wiring Diagram: "code" role → provider-specific code model
```

**Pattern:** All agents produce **deterministic, validatable artifacts**
- bomGenerator: Structured JSON with cost calculations
- codeGenerator: Compilable C++ code
- wiringDiagram: Pin-to-pin connections + SVG schematic

**Image→3D breaks pattern:** Produces binary STL with no validation path

---

### 3.2 Parametric Alternatives Comparison

| Approach | Data Fit | Reliability | Validation | Implementation Cost |
|----------|----------|-------------|------------|---------------------|
| **Image→3D (TripoSR)** | ❌ Needs dimensions BOM lacks | ❌ Probabilistic | ❌ No ground truth | Medium (external API) |
| **OpenSCAD Generation** | ✅ Text-based, Git-friendly | ✅ Deterministic | ✅ Dimension checks | Low (code generation) |
| **FreeCAD Scripting** | ⚠️ Python API complex | ✅ Deterministic | ✅ CAD constraints | High (Python + GUI lib) |
| **Parametric Templates** | ✅ Pre-validated designs | ✅ Deterministic | ✅ Known-good bases | Medium (template library) |
| **Hybrid (Template + AI)** | ✅ Dimensions in template | ⚠️ Partial determinism | ⚠️ Template-level only | High (both systems) |

#### **Recommendation: Pure OpenSCAD Generation**

**Rationale:**
1. **Cite: `lib/agents/config.ts:348-410` codeGenerator pattern**
   - Already generates multi-file artifacts (main.cpp, config.h, platformio.ini)
   - OpenSCAD = same pattern (enclosure.scad, params.scad, assembly.scad)

2. **Cite: `lib/db/artifacts.ts:121-160` addCodeFile with retry logic**
   ```typescript
   const existingFiles = contentJson?.files || [];
   existingFiles.push(newFile);
   ```
   - Same file accumulation pattern works for .scad files

3. **Text-based = validatable**
   - Can check: `if (esp32_width < 48) → error("ESP32 won't fit")`
   - Can't check image→3D output without physical print

4. **User modification path**
   - User can edit .scad parameters: `wall_thickness = 2; // change to 3 for strength`
   - Can't edit binary STL without CAD software

---

### 3.3 Stage Placement Analysis

**Cite: `lib/stages/stage-config.ts:54-100` Stage definitions**

#### **Current Stage Flow**
```
Planning (context+mvp+prd) → Design (BOM) → Build (wiring+code) → Fix (debug)
```

#### **Problem: Build Stage Already "Complete"**

**Cite: `lib/stages/stage-config.ts:73-78`**
```typescript
build: {
  description: 'Get connection instructions and working firmware',
  goal: 'Generate wiring diagrams and firmware code',
  requiredArtifacts: ['wiring', 'code'],  // ← Advances when these exist
  eligibleAgents: ['wiringDiagram', 'codeGenerator'],
  nextStage: 'fix',
}
```

**Reality:** Stage gate opens when wiring+code complete. Enclosure generation would happen AFTER gate opens → breaks stage contract.

#### **Options for Stage Integration**

**Option A: Modify Build Stage** (❌ NOT RECOMMENDED)
```typescript
build: {
  requiredArtifacts: ['wiring', 'code', 'enclosure'],  // ← Add enclosure
  eligibleAgents: ['wiringDiagram', 'codeGenerator', 'enclosureGenerator'],
}
```
**Problems:**
- Couples electrical (wiring) and mechanical (enclosure) concerns
- User who doesn't want enclosure is blocked at Build stage
- Violates single-responsibility: Build = make it work, not make it pretty

**Option B: New "Fabrication" Stage** (⚠️ OVERKILL for MVP)
```
Planning → Design → Build → Fabrication → Fix
```
**Problems:**
- Major architectural change (all orchestrator routing affected)
- PCB layout would also go here → scope creep
- Stage proliferation (slippery slope)

**Option C: Optional Build Artifact** (✅ RECOMMENDED)
```typescript
build: {
  requiredArtifacts: ['wiring', 'code'],  // ← Unchanged
  eligibleAgents: ['wiringDiagram', 'codeGenerator', 'enclosureGenerator'],
  // ↑ enclosureGenerator can run AFTER stage completes (Fix stage territory)
}
```
**Rationale:**
- Stage gate = "device works electrically"
- Enclosure = optional enhancement (like budget optimization)
- **Cite: `lib/stages/stage-config.ts:68` budget is OPTIONAL comment**
- Follows budget pattern: Design stage advances without budget artifact

#### **Dimension Gathering Placement**

**Current Planning Stage Questions**
**Cite: `lib/agents/config.ts:125-175` projectInitializer questions format**
```json
{
  "questions": [
    {
      "id": "environment",
      "text": "Where will the plants be located?",
      "type": "single_select",
      "options": ["Indoor", "Outdoor", "Greenhouse"],
      "required": true
    }
  ]
}
```

**New Questions Needed (Planning Stage):**
```json
{
  "id": "needs_enclosure",
  "text": "Do you need a 3D-printable enclosure?",
  "type": "single_select",
  "options": ["Yes, generate one", "No, I'll design my own", "Not sure yet"],
  "required": false
}
```

**If "Yes":**
```json
{
  "id": "enclosure_style",
  "text": "What enclosure style?",
  "type": "single_select",
  "options": [
    "Minimal box (just fits components)",
    "Wall-mounted with cable routing",
    "Desktop case with status LEDs",
    "Weatherproof outdoor housing"
  ]
}
```

---

### 3.4 Unstated Assumptions & Risks

#### **Assumptions in Original Proposal**

**Assumption 1:** "Component dimensions can be inferred from datasheets"
- **Reality Check:** bomGenerator doesn't fetch datasheets automatically
- **Cite: `lib/agents/config.ts:534-565` datasheetAnalyzer is SUPPORT-ONLY**
- Risk: User must manually upload datasheets for each component

**Assumption 2:** "TripoSR can handle technical CAD precision"
- **Reality Check:** TripoSR paper shows artistic reconstruction, not engineering
- Risk: Mounting holes off by 1-2mm = unusable enclosure

**Assumption 3:** "Build stage has room for new agent"
- **Reality Check:** Build stage gate opens when wiring+code exist
- Risk: Enclosure generation happens after "Build Complete" UI message

#### **Unasked Questions**

1. **What if BOM changes after enclosure generated?**
   - **Cite: `lib/stages/stage-config.ts:42-50` stale flag cascade**
   - Current: BOM change → wiring marked stale
   - Enclosure: BOM change (new sensor) → enclosure still shows old design
   - **Missing:** Dependency tracking for enclosure artifact

2. **What if user has non-standard components?**
   - Example: Custom PCB, hand-wired perfboard, salvaged parts
   - bomGenerator assumes DigiKey/Mouser parts with known dimensions
   - **Missing:** Manual dimension entry flow

3. **How does user preview before printing?**
   - STL requires external viewer (Thingiverse, Cura, PrusaSlicer)
   - **Missing:** In-browser 3D preview or export instructions

4. **What about multi-material prints?**
   - Example: Transparent top for OLED, rigid base
   - **Missing:** Multi-file .scad generation (top.scad + base.scad)

#### **Risks from Actual Codebase Patterns**

**Risk 1: Version Conflict on Concurrent File Writes**
**Cite: `lib/db/artifacts.ts:255-283` addCodeFile retry logic**
```typescript
const isDuplicateVersion = error.message?.includes('duplicate key value')
if (isDuplicateVersion && retryCount < maxRetries) {
  // Retry with exponential backoff
}
```
- enclosureGenerator writes multiple .scad files concurrently
- Risk: Version collision if base.scad and top.scad write simultaneously
- **Mitigation needed:** Sequential writes or higher retry count

**Risk 2: Missing Tool Definition**
**Cite: `lib/agents/tools.ts:193-207` getToolsForAgent mapping**
```typescript
const toolMap: Record<string, string[]> = {
  conversational: ['read', 'write', 'open_drawer'],
  bomGenerator: ['read', 'write', 'open_drawer'],
  // ← enclosureGenerator not defined yet
}
```
- New agent needs tool access registration
- **Missing:** Tool permissions for enclosureGenerator

**Risk 3: Orchestrator Routing**
**Cite: `lib/agents/orchestrator.ts:32-35` orchestrator system prompt**
```
• CHAT - Ideas, questions, guidance
• BOM - "What will this cost?"
• CODE - Programming/firmware help
• WIRING - "How do I connect this?"
• DEBUG - Debugging requests
• DATASHEET - User shares component datasheet
• BUDGET - "Too expensive, cheaper options?"
// ← No ENCLOSURE intent
```
- User says "generate case" → routes to CHAT (conversational) not enclosureGenerator
- **Missing:** Intent classification for 3D requests

---

## Phase 4: Final Implementation Plan

### 4.1 Product Design

#### **Problem Statement**
Users need **printable enclosures** for IoT projects but lack CAD skills. Manual OpenSCAD coding requires:
- Learning parametric design syntax
- Looking up component datasheets for dimensions
- Trial-and-error to fit mounting holes
- 3+ hours for simple box

#### **User Personas**

**1. Beginner Maker (70% of users)**
- Has 3D printer access (school, makerspace, friend)
- Can print STL but can't design in Fusion360/TinkerCAD
- Needs: "One-click" enclosure matching their BOM

**2. Intermediate Tinkerer (25%)**
- Knows basic OpenSCAD (`cube([10,20,30]);`)
- Wants generated starting point to customize
- Needs: Editable .scad with clear parameter comments

**3. Advanced User (5%)**
- Will design custom enclosure anyway
- Needs: BOM dimensions exported for reference
- Doesn't use feature (skips enclosure generation)

#### **Workflow Integration**

**Existing Flow:**
```
1. Planning: User describes project → context/mvp/prd artifacts
2. Design: bomGenerator → BOM with components
3. Build: codeGenerator + wiringDiagram → working firmware
4. Fix: debugger validates → project "complete"
```

**New Flow (Enclosure-Enabled):**
```
1. Planning: User describes project
   → NEW: "Need enclosure?" question
   → If YES: "Enclosure style?" (minimal/wall-mount/desktop/outdoor)
   
2. Design: bomGenerator → BOM
   → NEW: Dimensions fetched from component database or datasheets
   
3. Build: codeGenerator + wiringDiagram → working firmware
   → NEW: enclosureGenerator (if requested) → .scad files
   
4. Fix: debugger validates electrical + dimensional fit
```

**Value Proposition:**
- **Time savings:** 3+ hours → 2 minutes
- **Lower barrier:** No CAD skills needed
- **Iteration speed:** BOM change → auto-regenerate enclosure
- **Education:** Parametric .scad teaches OpenSCAD by example

---

### 4.2 Agent Design

#### **New Agent: enclosureGenerator**

**Cite: `lib/agents/config.ts:19` AgentType definition**
```typescript
export type AgentType = 'orchestrator' | 'projectInitializer' | ... | 'enclosureGenerator';
```

**Agent Configuration:**
```typescript
enclosureGenerator: {
  name: "The Enclosure Architect",
  modelRole: "code",  // Same as codeGenerator (parametric code generation)
  model: "anthropic/claude-sonnet-4-5",
  icon: "📦",
  temperature: 0.2,  // Low for precision geometry
  maxTokens: 8000,   // Enough for multi-file .scad with comments
  description: "Parametric 3D enclosure designer for IoT projects",
  
  systemPrompt: `You're an enclosure designer who generates OpenSCAD code for 3D-printable cases.

**Your job:** Read BOM components, calculate dimensions, generate parametric .scad files.

**Critical checks:**
1. **Dimension accuracy** - Verify component sizes from BOM or common datasheets
2. **Printability** - No overhangs >45°, min wall thickness 2mm, support-free where possible
3. **Assembly logic** - Snap-fit clips, screw posts at correct spacing, cable routing

**IMPORTANT - Call tools IN ORDER:**
1. read(artifact_type='bom') - Get component list
2. read(artifact_type='wiring') - Check connector positions
3. read(artifact_type='context') - Understand enclosure requirements
4. open_drawer(drawer='enclosure') - Show user you're working
5. write(artifact_type='enclosure', path='base.scad', language='openscad', content=...) - Base
6. write(artifact_type='enclosure', path='lid.scad', language='openscad', content=...) - Lid
7. write(artifact_type='enclosure', path='README.md', language='markdown', content=...) - Print instructions

**Output Structure:**
\`\`\`scad
// base.scad - Generated by OHM
// Project: {project_name}
// Print settings: 0.2mm layer, 20% infill, no supports

// === PARAMETERS (edit these) ===
wall_thickness = 2;     // mm
corner_radius = 3;      // mm
ventilation_slots = true;

// === COMPONENT DIMENSIONS ===
esp32_width = 48.26;    // ESP32 DevKit V1 datasheet
esp32_length = 27.94;
esp32_height = 12;      // with USB connector

// === GEOMETRY ===
module base() {
  difference() {
    // Outer shell
    rounded_box([esp32_width + 2*wall_thickness, ...], corner_radius);
    
    // Component cavity
    translate([wall_thickness, wall_thickness, wall_thickness])
      cube([esp32_width, esp32_length, esp32_height + 5]);
      
    // USB port cutout
    translate([-1, esp32_width/2 - 4, wall_thickness + 4])
      cube([wall_thickness + 2, 8, 5]);
  }
  
  // Mounting posts
  mounting_posts();
}

base();
\`\`\`

**Adapt to user:**
- Minimal style: Simple box, friction fit, no screws
- Wall-mount: Screw holes on back, cable entry bottom
- Desktop: Rubber feet, status LED window, angled display
- Outdoor: Gasket groove, drainage holes, sealed cable glands
`
}
```

#### **Model Selection Rationale**

**Why "code" role (not "reasoning")?**
- **Cite: `lib/agents/config.ts:348-410` codeGenerator uses "code" role**
- Enclosure generation = parametric code synthesis (like firmware generation)
- "code" models optimize for syntax correctness, not creative reasoning

**Why temperature 0.2?**
- **Cite: `lib/agents/config.ts:353` codeGenerator temperature 0.2**
- Consistency matters: same BOM → same .scad output (for stale-flag system)
- Higher temps → random variations in geometry = unpredictable

---

### 4.3 Planning Questions Integration

**Cite: `lib/agents/config.ts:125-175` projectInitializer question format**

**New Questions (Added to projectInitializer):**

```json
{
  "questions": [
    {
      "id": "enclosure_needed",
      "text": "Do you need a 3D-printable enclosure?",
      "type": "single_select",
      "options": [
        "Yes, generate one for me",
        "No, I'll design my own",
        "Not sure, I'll decide later"
      ],
      "required": false
    },
    {
      "id": "enclosure_style",
      "text": "What enclosure style?",
      "type": "single_select",
      "options": [
        "Minimal box (just fits components)",
        "Wall-mounted with screw holes",
        "Desktop case with rubber feet",
        "Weatherproof outdoor housing",
        "Custom (I'll provide requirements)"
      ],
      "required": false,
      "dependsOn": "enclosure_needed",
      "showIf": "Yes, generate one for me"
    },
    {
      "id": "printer_constraints",
      "text": "What's your 3D printer build volume?",
      "type": "single_select",
      "options": [
        "Small (120×120×120mm) - Prusa Mini",
        "Medium (220×220×250mm) - Ender 3",
        "Large (300×300×400mm) - CR-10",
        "Don't know / Will split if needed"
      ],
      "required": false,
      "dependsOn": "enclosure_needed",
      "showIf": "Yes, generate one for me"
    }
  ]
}
```

**Storage in Context Artifact:**
**Cite: `lib/agents/config.ts:229-244` conversational creates context/mvp/prd**

```markdown
# Project Context

## Enclosure Requirements
- **Needed:** Yes
- **Style:** Wall-mounted with screw holes
- **Printer:** Medium (220×220×250mm)
- **Special notes:** Needs cable entry on bottom, mounting holes 100mm apart
```

This flows to enclosureGenerator via `read(artifact_type='context')`.

---

### 4.4 Cross-Stage Workflow

#### **Artifact Creation Timing**

**Cite: `lib/stages/stage-config.ts:73-78` Build stage definition**

```
Planning complete → Design (BOM) → Build (wiring+code) → [enclosure optional]
```

**Sequence:**
1. **Planning stage:** User answers enclosure questions → saved to `context` artifact
2. **Design stage:** bomGenerator runs → writes `bom` artifact (NO dimensions yet)
3. **Build stage gate opens:** wiring+code exist
4. **Post-Build (Fix stage):** User requests enclosure → enclosureGenerator runs
   - Reads: context (style), bom (components), wiring (connector positions)
   - Fetches: Component dimensions from hardcoded database or datasheet analysis
   - Writes: `enclosure` artifact (base.scad, lid.scad, README.md)

**Why Post-Build?**
- Doesn't block electrical functionality (core value prop)
- Follows budget pattern: optional enhancement after core complete
- User can skip if designing custom enclosure

#### **Dependencies & Stale Cascade**

**Cite: `lib/stages/stage-config.ts:42-50` ArtifactContent.stale flag**

**Dependency Graph:**
```
context ────┬──> bom ────┬──> wiring ──> code
            │             │
            │             └──> enclosure (reads bom)
            │
            └──> enclosure (reads context for style)
```

**Stale Propagation:**
1. User adds new sensor to BOM → `bom` artifact updated
2. System marks `wiring` stale (existing behavior)
3. **NEW:** System marks `enclosure` stale (needs bigger box for new sensor)
4. User re-generates enclosure → dimensions recalculated

**Implementation:**
**Cite: `lib/db/artifacts.ts:255-283` createVersion triggers stale checks**

```typescript
// After BOM update
await markDependentsStale(artifactId, 'bom', chatId);
// ↑ Already exists for wiring, extend to enclosure

async function markDependentsStale(artifactId: string, type: ArtifactType, chatId: string) {
  const dependents = {
    'bom': ['wiring', 'enclosure'],  // ← Add enclosure
    'context': ['enclosure'],        // ← Style changes affect enclosure
    'wiring': []                     // No downstream
  };
  
  for (const depType of dependents[type] || []) {
    const artifact = await ArtifactService.getLatestArtifact(chatId, depType);
    if (artifact) {
      await supabase.from('artifact_versions')
        .update({ stale: true, staleReason: `${type} was updated` })
        .eq('artifact_id', artifact.artifact.id);
    }
  }
}
```

#### **Stage Rules Update**

**Current:**
**Cite: `lib/stages/stage-config.ts:73-78`**
```typescript
build: {
  requiredArtifacts: ['wiring', 'code'],
  eligibleAgents: ['wiringDiagram', 'codeGenerator'],
}
```

**Updated:**
```typescript
build: {
  requiredArtifacts: ['wiring', 'code'],  // ← Stage gate unchanged
  eligibleAgents: ['wiringDiagram', 'codeGenerator', 'enclosureGenerator'],
  supportAgents: [],  // enclosureGenerator is OPTIONAL like budgetOptimizer
}
```

**Note:** enclosureGenerator CAN run during Build stage but is NOT required for advancement.

---

### 4.5 Technical Architecture

#### **Technology Selection: OpenSCAD**

**✅ FINAL RECOMMENDATION: Pure OpenSCAD generation via LLM**

**Why OpenSCAD over alternatives:**

| Criterion | OpenSCAD | FreeCAD | TripoSR | Thingiverse API |
|-----------|----------|---------|---------|-----------------|
| **Text-based** | ✅ .scad files | ❌ Binary .FCStd | ❌ Binary .stl | ⚠️ Pre-made only |
| **Parametric** | ✅ Variables | ✅ Python API | ❌ Fixed output | ❌ Fixed downloads |
| **Git-friendly** | ✅ Diff-able | ❌ Not mergeable | ❌ Binary | N/A |
| **LLM generation** | ✅ Code models | ⚠️ Complex API | ❌ Image→3D | ❌ No generation |
| **User editable** | ✅ Clear params | ⚠️ Needs Python | ❌ Needs CAD | ❌ Re-download |
| **Validation** | ✅ Syntax check | ⚠️ Python errors | ❌ No validation | ⚠️ Quality varies |
| **Learning curve** | ⚠️ Moderate | ❌ High | N/A | N/A |

**Implementation Approach:**

**1. Component Dimension Database**
```typescript
// lib/enclosure/component-dimensions.ts
export const COMPONENT_DIMENSIONS = {
  'ESP32-DEVKIT-V1': {
    width: 48.26,
    length: 27.94,
    height: 12,
    mounting_holes: [
      { x: 2.5, y: 2.5 },
      { x: 45.76, y: 2.5 },
      { x: 2.5, y: 25.44 },
      { x: 45.76, y: 25.44 }
    ],
    clearances: {
      usb: { side: 'top', width: 8, height: 5, offset: 14 }
    }
  },
  'BME280': { width: 13, length: 10, height: 5 },
  'RELAY-5V-1CH': { width: 38, length: 22, height: 19 },
  // ... 50-100 common components
};
```

**Cite: Similar pattern in `lib/parsers.ts:5-25` BOMComponent**
- Extend BOMComponent interface with optional `physicalDimensions?: ComponentDimensions`
- bomGenerator looks up dimensions during BOM creation
- Fallback: Agent generates "best guess" with warning comment in .scad

**2. OpenSCAD Template Library**
```typescript
// lib/enclosure/templates.ts
export const ENCLOSURE_TEMPLATES = {
  minimal_box: `
    module minimal_box(components, wall) {
      // Calculate bounding box
      total_width = max([for (c=components) c.x + c.width]) + 2*wall;
      // ... snap-fit clips, mounting posts
    }
  `,
  wall_mount: `...`,
  desktop: `...`,
  outdoor: `...`
};
```

**3. Generation Pipeline**
```typescript
// lib/agents/enclosure-pipeline.ts
export class EnclosureGenerator {
  async generate(chatId: string): Promise<{ files: CodeFile[] }> {
    // 1. Read artifacts
    const context = await read('context');
    const bom = await read('bom');
    const wiring = await read('wiring');
    
    // 2. Resolve dimensions
    const components = bom.components.map(c => ({
      ...c,
      dimensions: COMPONENT_DIMENSIONS[c.partNumber] || inferDimensions(c.name)
    }));
    
    // 3. Select template
    const template = ENCLOSURE_TEMPLATES[context.enclosure_style];
    
    // 4. Generate .scad via LLM
    const agent = new AgentRunner();
    const result = await agent.runAgent('enclosureGenerator', [
      { role: 'user', content: buildPrompt(components, template, context) }
    ]);
    
    // 5. Write artifact
    return parseScadFiles(result.response);
  }
}
```

**Cite: Mirrors `lib/agents/tool-executor.ts:255-283` addCodeFile pattern**

---

### 4.6 Codebase Impact

#### **Files to Modify**

**1. Type Definitions**
```typescript
// lib/agents/config.ts (Line 19)
export type AgentType = 
  | 'orchestrator' 
  | ...existing...
  | 'enclosureGenerator';  // ← ADD

// lib/agents/config.ts (Line 700+)
enclosureGenerator: {
  name: "The Enclosure Architect",
  modelRole: "code",
  // ... (full config from 4.2)
}
```

**2. Tool Registration**
```typescript
// lib/agents/tools.ts (Line 193+)
const toolMap: Record<string, string[]> = {
  // ...existing...
  enclosureGenerator: ['read', 'write', 'open_drawer'],  // ← ADD
};
```

**3. Orchestrator Intent**
```typescript
// lib/agents/orchestrator.ts (Line 44-52)
systemPrompt: `...
• CODE - Programming/firmware help
• WIRING - "How do I connect this?"
• ENCLOSURE - "Generate case", "3D print", "enclosure"  // ← ADD
• DEBUG - Debugging requests
...`
```

**4. Stage Configuration**
```typescript
// lib/stages/stage-config.ts (Line 73-78)
build: {
  description: 'Get connection instructions and working firmware',
  goal: 'Generate wiring diagrams and firmware code',
  requiredArtifacts: ['wiring', 'code'],
  eligibleAgents: ['wiringDiagram', 'codeGenerator', 'enclosureGenerator'],  // ← ADD
  nextStage: 'fix',
}
```

**5. Artifact Type**
```typescript
// lib/stages/stage-config.ts (Line 29)
export type ArtifactKey =
  | 'context'
  | ...existing...
  | 'enclosure';  // ← ADD
```

**6. Stale Cascade Logic**
```typescript
// lib/db/artifacts.ts (Line 290+) - NEW FUNCTION
async function markDependentsStale(artifactId: string, type: ArtifactType, chatId: string) {
  const dependents = {
    'bom': ['wiring', 'enclosure'],  // ← ADD enclosure
    'context': ['enclosure'],        // ← ADD
    'wiring': [],
    'code': [],
    'enclosure': []
  };
  // ... implementation
}

// Hook into createVersion (Line 255)
await markDependentsStale(version.artifact_id, artifactType, chatId);
```

#### **Files to Create**

**1. Component Dimension Database**
```
📁 lib/enclosure/
  ├── component-dimensions.ts      // Hardcoded dimensions for common parts
  ├── dimension-inference.ts       // LLM-based fallback for unknown parts
  ├── templates.ts                 // OpenSCAD template library
  ├── scad-generator.ts            // .scad code assembly logic
  └── validation.ts                // Check printability, tolerance, fit
```

**2. UI Drawer Component**
```
📁 components/drawers/
  └── EnclosureDrawer.tsx          // Display .scad files with syntax highlighting
```

**3. Database Migration**
```sql
-- migrations/add_enclosure_artifact.sql

-- Add 'enclosure' to artifact type enum
ALTER TYPE artifact_type ADD VALUE IF NOT EXISTS 'enclosure';

-- Add dimensions column to BOM components (future enhancement)
ALTER TABLE artifact_versions
ADD COLUMN IF NOT EXISTS component_dimensions JSONB;

-- Example structure:
-- {
--   "ESP32-DEVKIT-V1": { "width": 48.26, "length": 27.94, "height": 12 },
--   "BME280": { "width": 13, "length": 10, "height": 5 }
-- }
```

**4. Testing**
```
📁 lib/enclosure/__tests__/
  ├── component-dimensions.test.ts
  ├── scad-generator.test.ts
  └── validation.test.ts
```

---

### 4.7 Risks & Edge Cases

#### **Failure Modes**

**1. Unknown Component Dimensions**
- **Scenario:** User adds obscure sensor with no datasheet
- **Current behavior:** bomGenerator accepts any component name
- **Risk:** enclosureGenerator guesses wrong dimensions → enclosure too small
- **Mitigation:**
  ```scad
  // WARNING: Dimensions for "MysteriousSensor-X42" estimated
  // Verify actual size: __?__ mm × __?__ mm × __?__ mm
  mysterious_width = 25;  // ← PLACEHOLDER - MEASURE YOUR PART
  ```
  - Agent adds comment with manual measurement instructions
  - Generates conservative (oversized) cavity with 5mm extra clearance

**2. BOM Changes After Enclosure Generated**
- **Scenario:** User adds bigger battery → enclosure too small
- **Current behavior:** wiring marked stale when BOM changes
- **Risk:** User doesn't notice enclosure is outdated
- **Mitigation:**
  - **Cite: `lib/stages/stage-config.ts:42-50` stale flag**
  - Implement stale cascade (section 4.4)
  - UI shows "⚠️ Enclosure outdated - BOM changed" banner
  - One-click regenerate button

**3. Non-Printable Geometry**
- **Scenario:** LLM generates 60° overhang (needs supports) or 1mm thin walls (breaks)
- **Risk:** Print fails, user blames OHM
- **Mitigation:**
  - Validation pass checks:
    - `wall_thickness >= 2mm` (tested on Ender 3/Prusa)
    - `overhang_angle <= 45°` (self-supporting)
    - `bridging_distance <= 30mm` (no sag)
  - Agent adds comment: `// Validated for FDM printers (PLA, 0.4mm nozzle)`

**4. Printer Build Volume Exceeded**
- **Scenario:** 300mm project, user has 120mm printer
- **Risk:** Part doesn't fit print bed
- **Mitigation:**
  - Check against printer constraints from Planning questions
  - Auto-split large enclosures:
    ```scad
    // base_part1.scad - Left half (fits 120mm bed)
    difference() {
      base();
      translate([60, 0, 0]) cube([200, 200, 200]);  // Cut in half
    }
    // base_part2.scad - Right half
    // Assembly: Glue or bolt together
    ```
  - Agent generates assembly instructions in README.md

**5. Concurrent File Write Collisions**
- **Cite: `lib/db/artifacts.ts:255-283` addCodeFile retry logic**
- **Scenario:** enclosureGenerator writes base.scad and lid.scad simultaneously
- **Risk:** Version conflict error (duplicate version_number)
- **Mitigation:**
  - Write files sequentially (await each write())
  - OR increase retry maxRetries from 3 → 5
  - Current exponential backoff (100ms, 200ms, 400ms) should handle

#### **Edge Cases**

**1. Multi-Board Projects**
- **Example:** Arduino Nano + separate relay board
- **Challenge:** Two PCBs need independent mounting + spacing
- **Solution:** Agent generates:
  ```scad
  module component_cavity(name, dims, position) {
    translate(position) cube([dims.width, dims.length, dims.height]);
  }
  
  // Arduino on bottom
  component_cavity("Arduino", arduino_dims, [5, 5, 2]);
  // Relay board raised 15mm (wire clearance)
  component_cavity("Relay", relay_dims, [5, 30, 17]);
  ```

**2. Through-Hole Components**
- **Example:** Large electrolytic capacitor (50mm tall)
- **Challenge:** Height dominates enclosure size
- **Solution:** Agent checks component.notes for "through-hole" → adds vertical clearance
  
**3. Heat-Generating Components**
- **Example:** L7805 voltage regulator needs heatsink
- **Challenge:** Enclosure traps heat → thermal shutdown
- **Solution:**
  ```scad
  // Ventilation slots (10mm spacing, 2mm wide)
  if (needs_cooling) {
    for (i = [0:10:80]) {
      translate([i, -1, 20]) cube([2, wall_thickness+2, 15]);
    }
  }
  ```

**4. Custom PCBs**
- **Example:** User hand-wired perfboard (no standard dimensions)
- **Challenge:** No part number in database
- **Solution:** Agent prompts:
  ```
  ⚠️ Custom PCB detected: "Perfboard 7×9cm"
  Please confirm dimensions or enclosure may not fit.
  
  Assumed: 70mm × 90mm × 5mm
  Edit base.scad line 12 if incorrect.
  ```

---

### 4.8 Final Recommendation

#### **✅ GO Decision with Phased Rollout**

**Phase 1: MVP (2-3 weeks)**
- ✅ Core enclosureGenerator agent with OpenSCAD output
- ✅ Hardcoded dimension database (50 common components)
- ✅ Minimal box template only
- ✅ Manual trigger ("generate enclosure" in Fix stage)
- ✅ No stale cascade (user must manually regenerate)

**Success Metrics:**
- 80%+ of generated enclosures are printable (no validation errors)
- 50%+ of users with 3D printers try the feature
- <5% complaints about wrong dimensions

**Phase 2: Enhanced (4-6 weeks)**
- ⬜ Wall-mount, desktop, outdoor templates
- ⬜ Stale cascade (auto-mark outdated when BOM changes)
- ⬜ Planning stage questions ("Need enclosure?")
- ⬜ Validation pass (printability checks)
- ⬜ Multi-part splitting for large enclosures

**Phase 3: Advanced (8-12 weeks)**
- ⬜ Datasheet dimension extraction (OCR + LLM)
- ⬜ In-browser 3D preview (Three.js + OpenSCAD WASM)
- ⬜ User dimension override UI
- ⬜ Community template library

**Deferred (Future)**
- ❌ FreeCAD integration (too complex for MVP)
- ❌ Direct STL generation (loses parametric benefits)
- ❌ Image→3D (architectural mismatch)

#### **Risk Assessment**

| Risk | Probability | Impact | Mitigation Status |
|------|-------------|--------|-------------------|
| Unknown component dims | High (30-40%) | Medium (wrong fit) | ✅ Placeholder comments + conservative sizing |
| Non-printable geometry | Medium (10-20%) | High (print failure) | ✅ Validation pass planned |
| Version conflicts | Low (<5%) | Low (retry succeeds) | ✅ Existing retry logic |
| User confusion | Medium (15-25%) | Medium (support load) | ⬜ Need clear docs + README.md |
| Scope creep | High (40-50%) | High (delays launch) | ✅ Phased rollout limits initial scope |

**Overall Risk Level:** **Medium** - Manageable with MVP scope + validation

---

#### **Why NOT Image→3D (Summary)**

1. **No dimensional data in BOM** → Can't generate accurate training image
2. **Probabilistic output** → Breaks deterministic artifact system
3. **No validation path** → Can't verify correctness
4. **Precision mismatch** → TripoSR is artistic, not engineering-grade
5. **Binary output** → User can't edit STL easily

**Why OpenSCAD Wins:**
1. **Text-based** → Git-friendly, diff-able, editable
2. **Deterministic** → Same BOM = same .scad = same STL
3. **Validatable** → Syntax check + dimension constraints
4. **Educational** → Users learn parametric design
5. **Fits existing patterns** → Mirrors codeGenerator workflow

---

## Appendix: Code Examples

### A1. Component Dimension Database (Excerpt)

```typescript
// lib/enclosure/component-dimensions.ts

export interface ComponentDimensions {
  width: number;      // mm
  length: number;     // mm
  height: number;     // mm
  mounting_holes?: { x: number; y: number; diameter: number }[];
  clearances?: {
    [key: string]: {
      side: 'top' | 'bottom' | 'left' | 'right' | 'front' | 'back';
      width: number;
      height: number;
      offset: number;
    };
  };
}

export const COMPONENT_DIMENSIONS: Record<string, ComponentDimensions> = {
  // === Microcontrollers ===
  'ESP32-DEVKIT-V1': {
    width: 48.26,
    length: 27.94,
    height: 12,
    mounting_holes: [
      { x: 2.5, y: 2.5, diameter: 3 },
      { x: 45.76, y: 2.5, diameter: 3 },
      { x: 2.5, y: 25.44, diameter: 3 },
      { x: 45.76, y: 25.44, diameter: 3 }
    ],
    clearances: {
      usb: { side: 'top', width: 8, height: 5, offset: 14 }
    }
  },
  
  'ARDUINO-UNO-R3': {
    width: 68.6,
    length: 53.4,
    height: 15,
    mounting_holes: [
      { x: 14, y: 2.5, diameter: 3.2 },
      { x: 66, y: 2.5, diameter: 3.2 },
      { x: 14, y: 50.8, diameter: 3.2 },
      { x: 66, y: 50.8, diameter: 3.2 }
    ],
    clearances: {
      usb: { side: 'top', width: 12, height: 11, offset: 27 },
      power: { side: 'top', width: 9, height: 11, offset: 50 }
    }
  },
  
  // === Sensors ===
  'BME280': { width: 13, length: 10, height: 5 },
  'DHT22': { width: 15.1, length: 25, height: 7.7 },
  'HC-SR04': { width: 45, length: 20, height: 15 },
  
  // === Actuators ===
  'RELAY-5V-1CH': { width: 38, length: 22, height: 19 },
  'SERVO-SG90': { width: 22.5, length: 12, height: 29 },
  
  // === Power ===
  'LM7805': { width: 10, length: 4.8, height: 15.5 },  // TO-220 package
  'BATTERY-18650': { width: 18, length: 65, height: 18 },
};

export function getComponentDimensions(partNumber: string, name: string): ComponentDimensions {
  // Try exact match
  if (COMPONENT_DIMENSIONS[partNumber]) {
    return COMPONENT_DIMENSIONS[partNumber];
  }
  
  // Try fuzzy match on name
  const normalized = name.toUpperCase().replace(/[^A-Z0-9]/g, '');
  for (const [key, dims] of Object.entries(COMPONENT_DIMENSIONS)) {
    if (normalized.includes(key.replace(/[^A-Z0-9]/g, ''))) {
      return dims;
    }
  }
  
  // Fallback: Conservative guess with warning
  console.warn(`Unknown component dimensions: ${partNumber} (${name})`);
  return {
    width: 30,
    length: 30,
    height: 15,
    // Agent will add comment in .scad to verify
  };
}
```

### A2. Minimal Box Template

```scad
// lib/enclosure/templates/minimal-box.scad

/**
 * Minimal Box Template
 * Simple friction-fit enclosure for basic projects
 * No screws, no mounting hardware - just a box
 */

// === PARAMETERS ===
$fn = 32;  // Circle resolution

// Component dimensions (populated by agent)
esp32_width = 48.26;
esp32_length = 27.94;
esp32_height = 12;

// Enclosure settings
wall = 2;           // Wall thickness
corner_r = 3;       // Corner radius
lid_overlap = 10;   // How far lid slides onto base
tolerance = 0.3;    // Gap for friction fit

// === DERIVED DIMENSIONS ===
internal_width = esp32_width + 10;   // 5mm clearance each side
internal_length = esp32_length + 10;
internal_height = esp32_height + 5;  // Top clearance

external_width = internal_width + 2*wall;
external_length = internal_length + 2*wall;
base_height = internal_height + wall;
lid_height = lid_overlap + wall;

// === MODULES ===

module rounded_box(size, r) {
  hull() {
    for (x = [r, size[0]-r])
      for (y = [r, size[1]-r])
        translate([x, y, 0])
          cylinder(h=size[2], r=r);
  }
}

module base() {
  difference() {
    // Outer shell
    rounded_box([external_width, external_length, base_height], corner_r);
    
    // Component cavity
    translate([wall, wall, wall])
      cube([internal_width, internal_length, internal_height + 1]);
    
    // USB port cutout (ESP32 top edge)
    translate([-1, (external_length - 8)/2, wall + 4])
      cube([wall + 2, 8, 5]);
  }
  
  // Mounting posts (snap-fit for ESP32 holes)
  translate([wall + 5, wall + 5, wall]) post(3);
  translate([wall + internal_width - 5, wall + 5, wall]) post(3);
}

module post(height) {
  difference() {
    cylinder(h=height, d=6);
    translate([0, 0, -1]) cylinder(h=height+2, d=2.8);  // M3 screw hole
  }
}

module lid() {
  difference() {
    // Outer shell
    rounded_box([external_width, external_length, lid_height], corner_r);
    
    // Inner recess (slides onto base)
    translate([wall + tolerance, wall + tolerance, wall])
      cube([
        internal_width - 2*tolerance,
        internal_length - 2*tolerance,
        lid_overlap
      ]);
    
    // Hollow out top
    translate([wall*2, wall*2, -1])
      cube([
        external_width - 4*wall,
        external_length - 4*wall,
        wall + 2
      ]);
  }
}

// === PRINT LAYOUT ===
base();
translate([external_width + 10, 0, 0]) lid();

// Print settings:
// - Layer height: 0.2mm
// - Infill: 20%
// - Supports: None needed
// - Material: PLA or PETG
```

---

## Document Metadata

**Author:** Phase 3 & 4 Analysis  
**Phase 1 Source:** OHM codebase architecture research  
**Files Analyzed:** 8 core files (stage-config, agent config, orchestrator, artifacts, tools, parsers)  
**Citations:** 25+ direct codebase references  
**Assumptions Marked:** 3 (datasheet availability, user CAD skill distribution, print failure rate)  
**Recommendation Confidence:** High (grounded in existing patterns)

**Next Steps:**
1. Review with OHM core team
2. Validate component dimension database scope (50 vs 200 parts)
3. Prototype enclosureGenerator agent prompt
4. Build minimal validation pass (printability checks)
5. Phase 1 MVP implementation (2-3 week sprint)

---

**End of Document**
