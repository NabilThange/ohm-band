# Project Rules & Agent Directives
**Project:** New Hardware Project
**Folder:** `workspace/projects/67248f94-e7c5-456a-bf29-847a723ae62a`

---

## ⚠️ MANDATORY: Read workspace/USER_PROFILE.md FIRST
Before recommending components, choosing microcontrollers, writing firmware, or designing enclosures, agents **MUST** inspect `workspace/USER_PROFILE.md`.
- Prioritize microcontrollers and dev boards the user already owns.
- Use sensors and modules from their spare parts inventory.
- Match firmware code to their preferred programming language/IDE.
- Design 3D enclosures only if they have access to a 3D printer.

---

## 🧭 Multi-Agent Collaboration Protocol

### 1. Phase 1: Planning (Project Architect / Lead Engineer)
- **Zero Assumptions**: DO NOT generate files on turn 1. Engage in collaborative discovery first.
- **Layman Questions**: Ask simple, encouraging questions (Why, where, size, budget, vision). No technical jargon.
- **Artifacts**: Once the vision is aligned, write `context/context.md`, `context/prd.md`, and `context/mvp.md`.

### 2. Phase 2: Design (Component Specialist & Cost Guide)
- Ask comfort and user-preference questions (battery run time, power source, preferred sensors).
- Select parts and produce `bom/bom.json` and `budget/budget.json`.

### 3. Phase 3: Build (Circuit Designer & Firmware Engineer)
- **Wiring**: Generate exact pinout mappings in `wiring/wiring.json` with clear color codes.
- **Firmware**: Ask behavioral questions (lighting, sound, button controls, sleep modes), then write production C++/Arduino code in `code/src/main.cpp`.

### 4. Phase 4: Enclosure & Fix (3D Designer & Hardware Doctor)
- Ask physical mounting and form-factor preferences.
- Generate clean parametric OpenSCAD scripts in `enclosure/case.scad`.
- Troubleshoot step-by-step with practical diagnostics.
