# Enclosure Drawer Architecture Analysis

> **Status**: Analysis Complete  
> **Date**: 2026-06-19  
> **Objective**: Replace current Enclosure Drawer with Code Drawer-style UX + 3D OpenSCAD preview

---

## Executive Summary

The current Enclosure Drawer uses a simple tab interface to display `.scad` files as plain text. The goal is to modernize it to match the Code Drawer's split-panel file tree architecture and add live 3D preview capabilities for OpenSCAD files.

**Key Findings:**
- Code Drawer already provides the exact UX pattern needed (tree + content split view)
- Project uses **OGL** (not Three.js) for WebGL rendering
- OpenSCAD WASM integration is production-ready via `openscad-wasm` npm package
- Can reuse `@ark-ui/react` Splitter components already in use
- Need to add Three.js/React Three Fiber specifically for STL rendering

---

## 1. Current Code Drawer Architecture

### Component Hierarchy
```
CodeDrawer.tsx (standalone component)
├── Dialog.Root (@ark-ui/react)
├── Dialog.Backdrop (backdrop with blur)
└── Dialog.Positioner
    └── Dialog.Content
        ├── Header (title, description, close button)
        └── Splitter.Root (@ark-ui/react)
            ├── Splitter.Panel (id="tree", 25% default)
            │   ├── Search Input
            │   └── TreeNode (recursive component)
            ├── Splitter.ResizeTrigger (drag handle)
            └── Splitter.Panel (id="code", 75% default)
                ├── Tab Bar (filename + copy button)
                ├── Code Display (<pre><code> with line numbers)
                └── Status Bar (bottom bar with metadata)
```

### Key Implementation Details

**File Tree:**

- Custom `buildFileTree()` function converts flat paths to hierarchical tree
- Tree structure: `{ id, name, type: 'folder'|'file', children }`
- Recursive `TreeNode` component with expand/collapse state
- Visual indicators: folder icons (Folder/FolderOpen), file icons (FileCode)
- Selected file highlighted with `bg-[#37373d]`
- Search filters files by filename (case-insensitive)

**State Management:**
```typescript
const [expandedFolders, setExpandedFolders] = useState<string[]>(['root', 'src'])
const [selectedFile, setSelectedFile] = useState<string | null>(null)
const [searchQuery, setSearchQuery] = useState('')
```

**Content Display:**
- Simple `<pre><code>` blocks with manual line numbering
- Copy-to-clipboard using `@ark-ui/react` Clipboard component
- No syntax highlighting (plain text)
- Tab bar shows selected filename
- Status bar at bottom (blue `bg-[#0071e3]`)

**Resizability:**
- `@ark-ui/react Splitter` with drag handle
- Left panel: 25% default, 15% min
- Right panel: 75% default, 30% min
- Hover effect on drag handle

**Data Flow:**
```
Sidebar.jsx 
  → artifacts?.code?.version?.content_json
  → CodeDrawer props: codeData
  → { files: [{ path, content }] }
```

---

## 2. Current Enclosure Drawer Architecture

### Component Hierarchy
```
EnclosureDrawer.tsx (uses shared base)
└── ToolDrawer
    └── ResizableDrawer
        ├── Backdrop
        └── Splitter.Root
            ├── Splitter.Panel (main - invisible)

            ├── Splitter.ResizeTrigger
            └── Splitter.Panel (drawer content)
                └── Single panel with tabs
                    ├── Stale Warning Banner
                    ├── File Tabs (horizontal)
                    ├── Action Buttons (Copy, Download)
                    ├── File Content (<pre><code>)
                    └── Print Instructions Banner
```

### Problems with Current UX

1. **No file tree navigation** - Just flat horizontal tabs
2. **No split panel** - Can't view multiple files or compare
3. **Plain text only** - No 3D preview of `.scad` files
4. **Inconsistent** - Doesn't match Code Drawer's established pattern
5. **Missing features** - No search, no line numbers, no syntax highlighting

### Data Structure

```typescript
interface EnclosureData {
    files: Array<{
        filename: string
        language: string
        content: string
    }>
    version?: number
    stale?: boolean
    staleReason?: string
}
```

**Data Flow:**
```
Sidebar.jsx 
  → artifacts?.enclosure?.version?.content_json
  → EnclosureDrawer props: enclosureData
  → { files: [...], stale, staleReason }
```

---

## 3. Shared Components Available

### Drawer Components

| Component | Purpose | Used By | Reusable? |
|-----------|---------|---------|-----------|
| `ResizableDrawer` | Base resizable drawer with Splitter | ToolDrawer, ContextDrawer | ✅ Yes |
| `ToolDrawer` | Wrapper with padding, single content area | BOMDrawer, EnclosureDrawer | ❌ Too simple |

| `CodeDrawer` | Custom split-panel with tree view | Code artifacts only | ⚠️ Extract pattern |
| `ContextDrawer` | Split-panel with tree + markdown viewer | Context artifacts | ⚠️ Similar pattern |

**Recommendation**: Extract shared components from CodeDrawer/ContextDrawer rather than using ToolDrawer.

### UI Libraries in Use

- **@ark-ui/react**: Dialog, Splitter, Clipboard (already used extensively)
- **Lucide React**: Icons
- **Tailwind CSS**: Styling
- **Framer Motion**: Animations (optional)
- **OGL**: Lightweight WebGL library (used in faulty-terminal.tsx)

**NOT in use**: Three.js, React Three Fiber (need to add for STL rendering)

---

## 4. OpenSCAD WASM Integration Options

### Production-Ready Solutions

#### Option 1: `openscad-wasm` (Official Port) ⭐ **RECOMMENDED**

**Package**: `openscad-wasm` on npm  
**Maintainer**: Official OpenSCAD project ([github.com/openscad/openscad-wasm](https://github.com/openscad/openscad-wasm))  
**Status**: Production-ready, actively maintained (last update: 10 days ago)

**Pros:**
- Official OpenSCAD port
- Compiles `.scad` → STL/3MF format
- ~10 MB WASM bundle (self-contained)
- Works in all modern browsers
- Virtual filesystem support

**Cons:**
- Not a renderer (just compiler)
- ~1fps compile time for complex models
- Needs separate renderer (Three.js/OGL) for display
- Each re-render requires full recompile

**Usage Pattern:**
```typescript
import openscad from 'openscad-wasm'

// Initialize
const scad = await openscad()


// Write .scad to virtual FS
scad.FS.writeFile('base.scad', scadContent)

// Compile to STL
const stlOutput = scad.FS.readFile('output.stl', { encoding: 'utf8' })

// Parse STL and render with Three.js
```

#### Option 2: `openjscad-react` (Alternative)

**Package**: `openjscad-react` on npm  
**Maintainer**: Community (aeksco)  
**Status**: Mature, but uses OpenJSCAD (not OpenSCAD)

**Pros:**
- React component ready
- Built-in viewer
- JavaScript-based modeling

**Cons:**
- **NOT OpenSCAD** - Uses different syntax (OpenJSCAD/JSCAD)
- Would require converting generated `.scad` files
- Less compatible with standard OpenSCAD ecosystem

**Verdict**: ❌ Not suitable - users expect real OpenSCAD syntax

### Rendering Pipeline Recommendation

**Best Approach**: `openscad-wasm` + Three.js STLLoader

```
.scad file (string)
  ↓
openscad-wasm (compile)
  ↓
STL format (string/ArrayBuffer)
  ↓
Three.js STLLoader (parse)
  ↓
BufferGeometry
  ↓
React Three Fiber (render)
```

---

## 5. Project Context & Tech Stack

### Framework
- **Next.js 15** (App Router)
- **React 19**
- **TypeScript**

### Current 3D Rendering
- **OGL** (lightweight WebGL library) - used in `faulty-terminal.tsx`
- Custom shaders for visual effects
- Pattern: refs + requestAnimationFrame

### Need to Add
- **Three.js** (peer dependency for STL loading)

- **@react-three/fiber** (React renderer for Three.js)
- **@react-three/drei** (helpers: OrbitControls, etc.)
- **three-stdlib** (includes STLLoader)

### Database Schema (Supabase)

```sql
-- artifacts table
{
  id: uuid
  type: 'enclosure' | 'code' | 'bom' | ...
  chat_id: uuid
  current_version: integer
  created_at: timestamp
}

-- artifact_versions table
{
  id: uuid
  artifact_id: uuid (FK)
  version_number: integer
  content_json: jsonb  -- { files: [...], stale, staleReason }
  content: text        -- (optional plain text)
  created_at: timestamp
}
```

**Service Layer**: `lib/db/artifacts.ts` - CRUD operations

---

## 6. Proposed Enclosure Drawer Architecture

### Component Hierarchy

```
EnclosureDrawer.tsx (new implementation)
├── Dialog.Root (@ark-ui/react)
├── Dialog.Backdrop
└── Dialog.Positioner
    └── Dialog.Content
        ├── Header
        │   ├── Title: "3D Enclosure Files"
        │   ├── Stale Warning (conditional)
        │   └── Close Button
        └── Splitter.Root (horizontal split)
            ├── Splitter.Panel (id="tree", 25% default)
            │   ├── Search Input
            │   └── FileTreeView
            │       └── TreeNode (recursive)
            ├── Splitter.ResizeTrigger
            └── Splitter.Panel (id="content", 75% default)
                └── Splitter.Root (vertical split for .scad files)
                    ├── Splitter.Panel (id="preview", 60% default)
                    │   └── OpenSCADPreview
                    │       ├── Canvas (@react-three/fiber)
                    │       ├── Loading State
                    │       └── Error State
                    ├── Splitter.ResizeTrigger

                    └── Splitter.Panel (id="source", 40% default)
                        ├── Tab Bar ("Preview" | "Source")
                        ├── Action Buttons (Copy, Download, Toggle)
                        └── Code Display (when "Source" selected)
```

### New Components to Create

#### 1. `FileTreeView` (Reusable)
```typescript
interface FileTreeViewProps {
    files: Array<{ filename: string; content: string }>
    selectedFile: string | null
    onSelectFile: (filename: string) => void
    searchQuery: string
}
```
- Converts flat file list to tree structure
- Handles folder expansion/collapse
- File type icons (`.scad`, `.md`, etc.)
- Search filtering

#### 2. `OpenSCADPreview` (Core 3D Viewer)
```typescript
interface OpenSCADPreviewProps {
    scadContent: string
    filename: string
}
```
- Initializes `openscad-wasm`
- Compiles `.scad` → STL
- Renders STL with React Three Fiber
- OrbitControls for camera
- Loading/error states
- Cache compiled STL (don't recompile on every render)

#### 3. `STLViewer` (Three.js Renderer)
```typescript
interface STLViewerProps {
    stlData: string | ArrayBuffer
}
```
- Uses `STLLoader` from `three-stdlib`
- Parses STL → BufferGeometry
- Applies material (MeshStandardMaterial)
- Scene setup: lights, camera, controls
- Grid helper, axes helper (optional)

#### 4. `SourceCodeView` (Code Display)
```typescript
interface SourceCodeViewProps {
    content: string
    language: string
    filename: string
}
```
- Line numbers

- Copy to clipboard
- Download button
- Optional: syntax highlighting (lazy load)

---

## 7. Reusable Components Strategy

### Extract from CodeDrawer

**Create `BaseDrawer` component:**
```typescript
interface BaseDrawerProps {
    isOpen: boolean
    onClose: () => void
    title: string
    description?: string
    icon?: ReactNode
    warning?: { message: string; severity: 'warning' | 'error' | 'info' }
    children: ReactNode
}
```
- Handles Dialog, Backdrop, Positioner
- Header with title, description, warning banner, close button
- Escape key listener
- Can replace: ToolDrawer, ResizableDrawer

**Create `FileTree` component:**
```typescript
interface FileTreeNode {
    id: string
    name: string
    type: 'folder' | 'file'
    children?: FileTreeNode[]
}

interface FileTreeProps {
    rootNode: FileTreeNode
    selectedId: string | null
    onSelect: (id: string) => void
    expandedIds: string[]
    onToggleExpand: (id: string) => void
}
```
- Recursive TreeNode
- Icon mapping by file extension
- Keyboard navigation (optional)

**Shared by:**
- CodeDrawer
- EnclosureDrawer
- ContextDrawer (if refactored)

---

## 8. Implementation Requirements

### Frontend Changes

#### New Dependencies (package.json)
```json
{
  "dependencies": {
    "openscad-wasm": "^0.0.4",
    "three": "^0.170.0",
    "@react-three/fiber": "^8.18.4",
    "@react-three/drei": "^9.120.0",
    "three-stdlib": "^2.34.0"
  }
}
```

#### File Structure
```
components/
├── tools/
│   ├── EnclosureDrawer.tsx        (new implementation)
│   ├── BaseDrawer.tsx              (extracted)
│   ├── FileTreeView.tsx            (extracted)
│   └── viewers/
│       ├── OpenSCADPreview.tsx     (new)
│       ├── STLViewer.tsx           (new)
│       └── SourceCodeView.tsx      (new)
```

#### State Management
```typescript
// EnclosureDrawer local state
const [selectedFile, setSelectedFile] = useState<string | null>(null)
const [expandedFolders, setExpandedFolders] = useState<string[]>([])
const [searchQuery, setSearchQuery] = useState('')
const [viewMode, setViewMode] = useState<'preview' | 'source'>('preview')
const [compiledSTL, setCompiledSTL] = useState<string | null>(null)
const [isCompiling, setIsCompiling] = useState(false)
const [compileError, setCompileError] = useState<string | null>(null)
```

### Backend/API Changes

**None required.** 

Existing artifact system already supports:
- `artifacts.type = 'enclosure'`
- `artifact_versions.content_json` stores file array
- Sidebar.jsx already fetches `artifacts?.enclosure?.version?.content_json`

### WASM Integration

#### OpenSCAD Initialization (Singleton)
```typescript
// lib/openscad/client.ts
let openscadInstance: any = null

export async function getOpenSCAD() {
    if (!openscadInstance) {
        const openscad = await import('openscad-wasm')
        openscadInstance = await openscad.default()
    }
    return openscadInstance
}

export async function compileToSTL(scadContent: string): Promise<string> {
    const scad = await getOpenSCAD()
    
    // Write input file
    scad.FS.writeFile('input.scad', scadContent)
    
    // Compile (blocking)
    scad.callMain(['-o', 'output.stl', 'input.scad'])
    
    // Read output
    const stlData = scad.FS.readFile('output.stl', { encoding: 'utf8' })
    
    // Clean up
    scad.FS.unlink('input.scad')
    scad.FS.unlink('output.stl')
    
    return stlData
}
```

**Performance Notes:**
- Compile once per file, cache result
- Show loading spinner during compilation (~1-2s)
- Don't recompile on every render
- Use `useMemo` or `useEffect` with deps

---

## 9. Performance Considerations

### WASM Bundle Size
- `openscad-wasm`: ~10 MB (self-contained)
- `three`: ~600 KB
- `@react-three/fiber` + `drei`: ~200 KB
- **Total impact**: ~11 MB (lazy load on drawer open)

### Optimization Strategies

1. **Lazy Loading**
   ```typescript
   // Only load when drawer opens
   const OpenSCADPreview = lazy(() => import('./viewers/OpenSCADPreview'))
   ```

2. **Compile Caching**
   ```typescript
   // Cache compiled STL in state/memory
   const compiledCache = useRef<Map<string, string>>(new Map())
   ```

3. **Debounced Preview Updates**
   ```typescript
   // If implementing live editing (future)
   const debouncedCompile = useDebouncedCallback(compileToSTL, 1000)
   ```

4. **STL Geometry Reuse**
   ```typescript
   // Don't recreate geometry on every render
   const geometry = useMemo(() => loader.parse(stlData), [stlData])
   ```

5. **Offscreen Canvas (Future)**
   - Move WASM to Web Worker
   - Currently blocking main thread during compile

### Expected Performance

| Operation | Time | Mitigation |
|-----------|------|------------|
| WASM Init | 100-200ms | Singleton, init once |
| STL Compile | 500-2000ms | Loading spinner, cache |
| STL Parse | 50-100ms | useMemo |
| First Render | 100-200ms | Three.js init |
| Re-render | 16ms (60fps) | Normal React |

---

## 10. Risks & Edge Cases

### Technical Risks

1. **WASM Browser Compatibility**
   - **Risk**: Older browsers may not support WASM
   - **Mitigation**: Feature detection + fallback to source-only view
   ```typescript
   const hasWASM = typeof WebAssembly !== 'undefined'
   ```

2. **Large .scad Files**
   - **Risk**: Complex models may timeout or crash
   - **Mitigation**: 
     - Set compile timeout (5s)
     - Show error message
     - Fallback to source view

3. **Memory Leaks**
   - **Risk**: WASM/Three.js objects not cleaned up
   - **Mitigation**:
     ```typescript
     useEffect(() => {
       return () => {
         geometry?.dispose()
         material?.dispose()
         renderer?.dispose()
       }
     }, [])
     ```

4. **STL Format Variations**
   - **Risk**: Binary vs ASCII STL
   - **Mitigation**: `STLLoader` handles both automatically

### UX Edge Cases

1. **Empty File List**
   - Show empty state: "No enclosure files generated yet"

2. **Non-.scad Files (README.md)**
   - Detect file extension
   - Show markdown viewer or plain text
   - No 3D preview

3. **Stale Enclosure Warning**
   - Keep banner at top (current behavior)
   - Persist through file navigation

4. **Compilation Errors**
   - Show error message with OpenSCAD output
   - Fallback to source view
   - "View Source" always available

5. **Mobile/Tablet**
   - Touch-friendly drag handles
   - Adjust split ratios for smaller screens
   - Disable search on very small screens

### Future Enhancements

1. **Live Editing** (Phase 2)
   - Edit `.scad` in-drawer
   - Debounced recompile
   - Diff view with original

2. **Export Options** (Phase 2)
   - Download STL directly (bypass .scad)
   - Export as 3MF, OFF, etc.

3. **Syntax Highlighting** (Phase 2)
   - Lazy load Prism.js or Shiki
   - OpenSCAD language support

4. **Multi-file Preview** (Phase 3)
   - Show `base.scad` + `lid.scad` side-by-side in 3D
   - Combined view

---

## 11. Step-by-Step Implementation Plan

### Phase 1: Foundation (Days 1-2)

1. **Install Dependencies**
   ```bash
   npm install openscad-wasm three @react-three/fiber @react-three/drei three-stdlib
   ```

2. **Create WASM Client Module**
   - `lib/openscad/client.ts`
   - Singleton pattern
   - Export `compileToSTL()` function
   - Error handling

3. **Extract Reusable Components**
   - Create `BaseDrawer.tsx` (from CodeDrawer pattern)
   - Create `FileTreeView.tsx` (extract tree logic)
   - Test with CodeDrawer (no breaking changes)

### Phase 2: 3D Viewer (Days 3-4)

4. **Build STLViewer Component**
   - `components/tools/viewers/STLViewer.tsx`
   - React Three Fiber setup
   - STLLoader integration
   - OrbitControls
   - Lighting, materials

5. **Build OpenSCADPreview Component**
   - `components/tools/viewers/OpenSCADPreview.tsx`
   - Call `compileToSTL()`
   - Pass STL to `STLViewer`
   - Loading/error states
   - Compile caching

6. **Build SourceCodeView Component**
   - `components/tools/viewers/SourceCodeView.tsx`
   - Line numbers
   - Copy/download buttons
   - Plain text initially (syntax highlighting later)

### Phase 3: New Enclosure Drawer (Days 5-6)

7. **Implement New EnclosureDrawer**
   - Use `BaseDrawer` for shell
   - Add horizontal Splitter (tree | content)
   - Integrate `FileTreeView`
   - File selection state

8. **Add Content Panel Logic**
   - Detect file type (`.scad` vs `.md`)
   - For `.scad`: Add vertical Splitter (preview | source)
   - Toggle between preview/source
   - For other files: Show SourceCodeView only

9. **Preserve Existing Features**
   - Stale warning banner (top of content area)
   - Copy/download buttons
   - Print instructions detection

### Phase 4: Testing & Polish (Days 7-8)

10. **Integration Testing**
    - Test with real generated enclosures from chat
    - Verify artifact loading
    - Check all file types (base.scad, lid.scad, README.md)
    - Test stale warning flow

11. **Performance Testing**
    - Profile WASM init time
    - Check compile times for complex models
    - Memory leak testing (open/close drawer repeatedly)
    - Mobile responsive testing

12. **Polish & Refinements**
    - Add keyboard shortcuts (Escape to close)
    - Loading spinners during compile
    - Error message styling
    - Empty states
    - Accessibility (ARIA labels, focus management)

### Phase 5: Documentation & Deployment

13. **Documentation**
    - Update component README
    - Add JSDoc comments
    - Create usage examples

14. **Code Review & Merge**
    - PR with before/after screenshots
    - Performance metrics
    - Breaking changes (if any)

---

## 12. Success Criteria

### Functional Requirements ✅

- [ ] Tree view navigation matches CodeDrawer UX
- [ ] Live 3D preview for `.scad` files
- [ ] "View Source" toggle works
- [ ] Copy/download buttons functional
- [ ] Stale warning banner displays correctly
- [ ] Search filters file list
- [ ] Resizable panels (tree, preview, source)
- [ ] Non-.scad files display appropriately

### Performance Requirements ✅

- [ ] Drawer opens < 500ms
- [ ] WASM init < 200ms (after first load)
- [ ] STL compile < 2s (for typical enclosure)
- [ ] 3D scene renders at 60fps
- [ ] No memory leaks on repeated open/close

### UX Requirements ✅

- [ ] Visual consistency with CodeDrawer
- [ ] Clear loading states
- [ ] Helpful error messages
- [ ] Mobile-responsive
- [ ] Keyboard accessible

---

## Conclusion

The proposed architecture leverages existing patterns (CodeDrawer's split-panel tree view) and adds production-ready 3D preview capabilities via `openscad-wasm` + React Three Fiber. 

**Key Benefits:**
- **Consistent UX**: Matches CodeDrawer's established pattern
- **Production-Ready**: Uses official OpenSCAD WASM port
- **Minimal Backend Changes**: Works with existing artifact system
- **Reusable Components**: Benefits other drawers (CodeDrawer refactor)
- **Performance**: Lazy loading + caching mitigates WASM overhead

**Estimated Effort**: 8 days (1 developer)

**Next Step**: Review this analysis, then proceed with Phase 1 implementation.
