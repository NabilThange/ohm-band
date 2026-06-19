# TASK: Enclosure Drawer Upgrade (Code-Drawer Style + 3D Preview)

## Project Goal
Upgrade the existing `EnclosureDrawer` from a basic tabbed list of plain-text OpenSCAD files to a high-fidelity, split-panel file explorer and 3D previewer matching the `CodeDrawer` design. The new component will utilize `openscad-wasm` to compile `.scad` files to STL in the browser and render them with a lightweight vanilla Three.js 3D viewer.

---

## Architecture Summary

```
EnclosureDrawer
├── BaseDrawer (Dialog & Header Shell - Shared)
└── Responsive Layout:
    ├── Desktop (>=768px): Splitter.Root (Horizontal)
    │   ├── Splitter.Panel (Left: FileTreeView)
    │   └── Splitter.Panel (Right: Content Area)
    │       └── Splitter.Root (Vertical Split or Toggle)
    │           ├── OpenSCADPreview (3D Canvas via Vanilla Three.js)
    │           └── SourceCodeView (Code Display & Actions)
    └── Mobile (<768px): Stacked Tab Panels
        ├── Tab 1: FileTreeView
        ├── Tab 2: OpenSCADPreview (if .scad selected)
        └── Tab 3: SourceCodeView
```

### Core Architecture Components
1. **`BaseDrawer.tsx` (Shared)**: Extracted from `CodeDrawer.tsx` to handle Ark UI Dialog setup, backdrop, positioner, headers, and standard warnings.
2. **`FileTreeView.tsx` (Shared)**: Extracted from `CodeDrawer.tsx` to build recursive file trees. Support both `path` (from `CodeDrawer`) and flat `filename` (from `EnclosureDrawer` adapted to `path`). Includes search and expansion state.
3. **`openscad-wasm` client (`lib/openscad/client.ts`)**: Singleton wrapper to compile `.scad` content to STL. Features compile caching based on content hash.
4. **`STLViewer.tsx`**: Vanilla Three.js renderer wrapping standard `STLLoader` parsing, OrbitControls, grid/axes helpers, and lights. Avoids R3F React 19 peer-dependency warnings. Fully disposes of textures, geometries, materials, and renderer on unmount to prevent memory leaks.
5. **`OpenSCADPreview.tsx`**: High-level preview coordinator that runs the WASM compiler, manages loading/compilation/error states, and passes compiled data to `STLViewer`.
6. **`SourceCodeView.tsx`**: Standardised read-only code viewer displaying line numbers and action buttons (Copy/Download).

---

## Dependencies
The following dependencies will be installed:
*   `openscad-wasm` (v0.0.4) — browser-based OpenSCAD compiler
*   `three` (v0.170.0 or latest) — 3D graphics rendering engine
*   `three-stdlib` (latest) — parses STL files using `STLLoader`

*Note: React Three Fiber (R3F) and `@react-three/drei` have been omitted to prevent React 19 compatibility conflicts.*

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
| :--- | :--- | :--- |
| **WASM Compile Performance** | Medium | Compile is single-threaded and blocking. We cache results by `.scad` text hash and show a spinner. |
| **Three.js Memory Leaks** | High | Unmounting the drawer repeatedly can leak WebGL contexts. We will explicitly call `.dispose()` on geometries, materials, and the renderer instance during component cleanup. |
| **Mobile Screen Real Estate** | High | Running a split tree and 3D preview on mobile is unusable. We fall back to stacked tabs (Tree \| 3D \| Source) on screens `< 768px`. |
| **WASM Loading Failures** | Low | If WebAssembly is unsupported in the client browser, fallback gracefully to `SourceCodeView` only. |

---

## Acceptance Criteria
- [x] Base components `BaseDrawer` and `FileTreeView` successfully extracted without breaking existing `CodeDrawer` functionality.
- [x] `.scad` files compile dynamically to STL in the browser via `openscad-wasm`.
- [x] 3D STL files render in the drawer with pan, zoom, rotate controls.
- [x] Smooth transitions and responsive layout (Splitter on desktop $\ge$ 768px, full-screen stacked tabs on mobile $<$ 768px).
- [x] Content-hash caching prevents unnecessary OpenSCAD compilations.
- [x] Non-scad files (like `README.md`) display the code/markdown viewer instead of the 3D canvas.
- [x] Action buttons (Copy, Download) function properly.
- [x] Proper disposal of WebGL/Three.js resources verified (no browser crashes on repeated toggling).

---

## Progress Tracking Checklist

### Phase 1: Foundation & Shared Components
- [x] 1.1 Install npm dependencies (`openscad-wasm`, `three`, `three-stdlib`).
- [x] 1.2 Create WASM compiler singleton `lib/openscad/client.ts`.
- [x] 1.3 Extract `BaseDrawer.tsx` from `CodeDrawer.tsx`.
- [x] 1.4 Extract `FileTreeView.tsx` from `CodeDrawer.tsx` and integrate adapter to support both `path` and flat `filename` inputs.
- [x] 1.5 Update `CodeDrawer.tsx` to use the extracted `BaseDrawer` and `FileTreeView`. Verify no regressions.

### Phase 2: 3D Viewers & Code Viewers
- [x] 2.1 Build vanilla `STLViewer.tsx` with full canvas setup, lighting, and asset disposal.
- [x] 2.2 Build compilation wrapper `OpenSCADPreview.tsx` with loading/error UI and hash-based caching.
- [x] 2.3 Build read-only `SourceCodeView.tsx` with copy and download utilities.

### Phase 3: Enclosure Drawer Implementation
- [x] 3.1 Implement new `EnclosureDrawer.tsx` with tree/content dual-panel layout.
- [x] 3.2 Add CSS breakpoint checks for mobile responsiveness (Splitter on desktop, full-width Tabs on mobile).
- [x] 3.3 Integrate `OpenSCADPreview` and `SourceCodeView` into the right/content panel.
- [x] 3.4 Ensure stale warning banners and print instruction highlights are preserved.

### Phase 4: Verification & Polish
- [x] 4.1 Validate WebGL context cleanup and profile compilation time.
- [x] 4.2 Perform manual UI tests for mobile scaling.
- [x] 4.3 Verify compilation failure fallbacks.
- [x] 4.4 Run project linting and verification script check.
