# Next Steps: 3D Enclosure Feature

## Immediate Actions (Before Code Can Run)

### 1. Run Database Migration ⚠️ REQUIRED

The TypeScript code won't compile until the database enum is updated.

**Option A: Supabase Dashboard**
```sql
-- Copy/paste this into Supabase SQL Editor:
ALTER TYPE artifact_type ADD VALUE IF NOT EXISTS 'enclosure';
```

**Option B: Supabase CLI**
```bash
cd c:\Users\thang\Downloads\OHM_BAND_AGENTS\Ohm
npx supabase db push
```

**Option C: Direct psql**
```bash
psql postgresql://your-connection-string
\i migrations/002_add_enclosure_artifact_type.sql
```

### 2. Regenerate TypeScript Types

After migration runs:
```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > lib/supabase/types.ts
```

### 3. Verify Build

```bash
npx tsc --noEmit
# Should pass with no errors
```

---

## Manual Testing Checklist

### Test 1: Intent Routing (5 min)

**Setup:** Start app, navigate to fix stage (after BOM/wiring/code exist)

**Test cases:**
1. Type: "generate 3D enclosure"
   - Expected: Routes to enclosureGenerator ✅
2. Type: "I need an STL file"
   - Expected: Routes to enclosureGenerator ✅
3. Type: "how do I mount the battery"
   - Expected: Routes to WIRING (not enclosureGenerator) ✅
4. Type: "generate wiring diagram"
   - Expected: Routes to wiringDiagram (not enclosureGenerator) ✅
5. Type: "fix my code"
   - Expected: Routes to codeGenerator (no regression) ✅

**Pass criteria:** All 5 route correctly

---

### Test 2: Known Component Flow (10 min)

**Setup:** Create project with ESP32 + BME280 (both in database)

**Steps:**
1. Complete planning/design/build stages (BOM, wiring, code)
2. In fix stage, type: "generate enclosure"
3. Agent should:
   - Read BOM artifact ✅
   - Read wiring artifact ✅
   - Read context artifact ✅
   - Open enclosure drawer ✅
   - Generate base.scad with correct dimensions:
     - ESP32: 48.26mm × 27.94mm × 12mm ✅
     - BME280: 13mm × 10mm × 5mm ✅
   - Generate lid.scad ✅
   - Generate README.md with print instructions ✅

**Pass criteria:** All 3 files generated with correct dimensions

---

### Test 3: Unknown Component Flow (10 min)

**Setup:** Create project with ESP32 + "MysteriousSensor-X42"

**Steps:**
1. Complete planning/design/build stages
2. In fix stage, type: "generate enclosure"
3. Agent should:
   - Detect unknown component ✅
   - Ask user: "I need dimensions for MysteriousSensor-X42" ✅
   - Prompt for Width/Length/Height in mm ✅
   - Offer "oversized box" fallback option ✅
4. User provides: "50mm × 30mm × 20mm"
5. Agent generates .scad files with user-provided dimensions ✅
6. .scad includes comment: "// MysteriousSensor-X42: User-provided dimensions" ✅

**Pass criteria:** No silent guessing, explicit user prompt works

---

### Test 4: Oversized Box Fallback (5 min)

**Setup:** Same as Test 3

**Steps:**
1. Agent asks for dimensions
2. User responds: "I don't have calipers, use oversized box"
3. Agent generates .scad with conservative +20mm clearance ✅
4. .scad includes warning comment ✅

**Pass criteria:** Fallback option works

---

### Test 5: No Regression (15 min)

**Verify existing functionality still works:**

1. BOM generation
   - Create new project ✅
   - Generate BOM ✅
   - Verify BOM drawer opens ✅
2. Code generation
   - Generate firmware ✅
   - Verify code drawer opens ✅
   - Multiple files accumulate correctly ✅
3. Wiring generation
   - Generate wiring diagram ✅
   - Verify wiring drawer opens ✅

**Pass criteria:** No existing features broken

---

## Week 2 Goals

After manual testing passes:

### Agent Refinements
- [ ] Improve dimension prompt clarity
- [ ] Add validation for user-provided dimensions (must be positive numbers)
- [ ] Better error messages for malformed .scad

### UI Implementation
- [ ] Create EnclosureDrawer component
- [ ] Syntax highlighting for .scad files
- [ ] File tabs (base/lid/README)
- [ ] Manual regenerate button

### Integration
- [ ] Test with 10 different component combinations
- [ ] Verify drawer auto-opens on generation
- [ ] Test regeneration after BOM change (manual trigger)

---

## Quick Start Testing

**Fastest path to see it work:**

1. Run migration (2 min)
2. Regenerate types (1 min)
3. Rebuild app (2 min)
4. Create ESP32 + BME280 project (5 min)
5. Complete all stages to Fix (3 min)
6. Type "generate enclosure" (2 min)
7. Review generated .scad files ✓

**Total:** ~15 minutes to working prototype

---

## Troubleshooting

**"Type 'enclosure' not assignable" error**
- Migration didn't run yet
- Types not regenerated
- Restart TypeScript server after regenerating types

**Agent doesn't route to enclosureGenerator**
- Check project is in Fix stage
- Verify BOM + wiring + code artifacts exist
- Try exact phrase: "generate 3D enclosure"

**No .scad files generated**
- Check browser console for tool execution errors
- Verify enclosureGenerator in AGENTS config
- Check toolMap has enclosureGenerator entry

**Dimensions are wrong**
- Check component-dimensions.ts has correct part number
- Try fuzzy match (name includes key from database)
- Provide dimensions manually as fallback

---

## Documentation

**Created:**
- `docs/3D-ENCLOSURE-CRITIQUE-AND-PLAN.md` - Full analysis + plan
- `docs/3D-ENCLOSURE-PRE-BUILD-DECISIONS.md` - Decision log
- `docs/3D-ENCLOSURE-PHASE1-IMPLEMENTATION-STATUS.md` - Progress tracker
- `PHASE1-WEEK1-COMPLETE.md` - Week 1 summary
- `NEXT-STEPS.md` - This file

**Updated:**
- Migration added: `migrations/002_add_enclosure_artifact_type.sql`
- 5 core files modified (stage-config, config, tools, tool-executor, artifact-validator)
- 4 new files created (dimensions, templates, tests, docs)

---

**Ready to proceed with Week 2 testing once migration runs!** ✅
