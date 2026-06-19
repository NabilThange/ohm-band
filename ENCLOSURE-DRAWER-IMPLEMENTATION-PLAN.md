# Enclosure Drawer Implementation Plan

> **Prerequisites**: Review `ENCLOSURE-DRAWER-ARCHITECTURE-ANALYSIS.md` first  
> **Estimated Effort**: 8 days (1 developer)  
> **Status**: Ready for Implementation

---

## Quick Reference

### New Dependencies
```json
{
  "openscad-wasm": "^0.0.4",
  "three": "^0.170.0",
  "@react-three/fiber": "^8.18.4",
  "@react-three/drei": "^9.120.0",
  "three-stdlib": "^2.34.0"
}
```

### Files to Create
```
lib/openscad/
  └── client.ts                           (WASM singleton)

components/tools/
  ├── BaseDrawer.tsx                      (extracted from CodeDrawer)
  ├── FileTreeView.tsx                    (extracted, reusable)
  ├── EnclosureDrawer.tsx                 (NEW implementation)
  └── viewers/
      ├── OpenSCADPreview.tsx             (NEW: 3D preview)
      ├── STLViewer.tsx                   (NEW: Three.js renderer)
      └── SourceCodeView.tsx              (NEW: code display)
```

### Files to Refactor
```
components/tools/
  ├── CodeDrawer.tsx                      (migrate to BaseDrawer)
  └── ContextDrawer.tsx                   (optional: migrate to BaseDrawer)
```

---

## Phase 1: Foundation & Dependencies

### Day 1 Morning: Install Dependencies

**Task 1.1: Add npm packages**
```bash
npm install openscad-wasm three @react-three/fiber @react-three/drei three-stdlib
```

**Verify:**
- `package.json` updated
- `node_modules/` contains new packages
- No peer dependency warnings


**Task 1.2: Create WASM Client Module**

File: `lib/openscad/client.ts`

```typescript
// lib/openscad/client.ts
let openscadInstance: any = null
let initPromise: Promise<any> | null = null

/**
 * Singleton: Initialize OpenSCAD WASM once
 */
export async function getOpenSCAD() {
    if (openscadInstance) return openscadInstance
    
    if (!initPromise) {
        initPromise = (async () => {
            const openscad = await import('openscad-wasm')
            openscadInstance = await openscad.default()
            return openscadInstance
        })()
    }
    
    return initPromise
}

/**
 * Compile .scad source to STL format
 */
export async function compileToSTL(
    scadContent: string, 
    inputFilename = 'input.scad'
): Promise<{ stl: string; error?: string }> {
    try {
        const scad = await getOpenSCAD()
        
        // Write input
        scad.FS.writeFile(inputFilename, scadContent)
        
        // Compile
        const outputFilename = 'output.stl'
        scad.callMain(['-o', outputFilename, inputFilename])
        
        // Read output
        const stlData = scad.FS.readFile(outputFilename, { encoding: 'utf8' })
        
        // Cleanup
        scad.FS.unlink(inputFilename)
        scad.FS.unlink(outputFilename)
        
        return { stl: stlData }
    } catch (err: any) {
        return { 
            stl: '', 
            error: err.message || 'OpenSCAD compilation failed' 
        }
    }
}

/**
 * Check if WASM is supported
 */
export function isWASMSupported(): boolean {
    return typeof WebAssembly !== 'undefined'
}
```

**Verify:**
- TypeScript compiles without errors
- Exports are correct

### Day 1 Afternoon: Extract Reusable Components

**Task 1.3: Create BaseDrawer Component**


File: `components/tools/BaseDrawer.tsx`

Extract pattern from CodeDrawer - provides Dialog shell + header + warning banner.

**Key Props:**
- `isOpen`, `onClose`
- `title`, `description`
- `icon` (optional)
- `warning` (optional: `{ message, severity }`)
- `children` (drawer content)

**Task 1.4: Create FileTreeView Component**

File: `components/tools/FileTreeView.tsx`

Extract tree logic from CodeDrawer. Converts flat file list to tree structure.

**Key Features:**
- `buildFileTree()` helper
- Recursive `TreeNode` component
- Expand/collapse state
- File selection
- Search filtering
- File type icons

---

## Phase 2: 3D Viewer Components

### Day 3 Morning: Build STLViewer

**Task 2.1: Create STLViewer Component**

File: `components/tools/viewers/STLViewer.tsx`

```typescript
'use client'

import { Canvas } from '@react-three/fiber'
import { OrbitControls, Stage, Grid } from '@react-three/drei'
import { STLLoader } from 'three-stdlib'
import { useMemo } from 'react'

interface STLViewerProps {
    stlData: string
}

function STLMesh({ stlData }: { stlData: string }) {
    const geometry = useMemo(() => {
        const loader = new STLLoader()
        return loader.parse(stlData)
    }, [stlData])
    
    return (
        <mesh geometry={geometry}>
            <meshStandardMaterial color="#3b82f6" />
        </mesh>
    )
}

export default function STLViewer({ stlData }: STLViewerProps) {
    return (
        <div className="w-full h-full bg-gradient-to-br from-slate-900 to-slate-800">
            <Canvas camera={{ position: [100, 100, 100], fov: 50 }}>
                <Stage environment="city" intensity={0.6}>
                    <STLMesh stlData={stlData} />
                </Stage>
                <Grid infiniteGrid fadeDistance={200} />
                <OrbitControls makeDefault />
            </Canvas>
        </div>
    )
}
```

**Verify:**
- Renders 3D scene
- OrbitControls work (drag to rotate)
- Grid visible

### Day 3 Afternoon: Build OpenSCADPreview

**Task 2.2: Create OpenSCADPreview Component**


File: `components/tools/viewers/OpenSCADPreview.tsx`

```typescript
'use client'

import { useState, useEffect } from 'react'
import { compileToSTL, isWASMSupported } from '@/lib/openscad/client'
import STLViewer from './STLViewer'
import { Loader2, AlertTriangle } from 'lucide-react'

interface OpenSCADPreviewProps {
    scadContent: string
    filename: string
}

export default function OpenSCADPreview({ scadContent, filename }: OpenSCADPreviewProps) {
    const [stlData, setStlData] = useState<string | null>(null)
    const [isCompiling, setIsCompiling] = useState(true)
    const [error, setError] = useState<string | null>(null)
    
    useEffect(() => {
        if (!isWASMSupported()) {
            setError('WebAssembly not supported in this browser')
            setIsCompiling(false)
            return
        }
        
        let cancelled = false
        
        async function compile() {
            setIsCompiling(true)
            setError(null)
            
            const result = await compileToSTL(scadContent, filename)
            
            if (cancelled) return
            
            if (result.error) {
                setError(result.error)
            } else {
                setStlData(result.stl)
            }
            
            setIsCompiling(false)
        }
        
        compile()
        
        return () => { cancelled = true }
    }, [scadContent, filename])
    
    if (isCompiling) {
        return (
            <div className="flex items-center justify-center h-full bg-slate-900">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
                    <span className="text-sm text-slate-400">Compiling OpenSCAD...</span>
                </div>
            </div>
        )
    }
    
    if (error) {
        return (
            <div className="flex items-center justify-center h-full bg-slate-900">
                <div className="flex flex-col items-center gap-3 max-w-md p-6">
                    <AlertTriangle className="w-8 h-8 text-yellow-500" />
                    <span className="text-sm text-slate-300 text-center">{error}</span>
                </div>
            </div>
        )
    }
    
    if (!stlData) {
        return null
    }
    
    return <STLViewer stlData={stlData} />
}
```

**Verify:**
- Shows loading spinner during compile
- Displays STL preview when ready
- Shows error message on failure

### Day 4: Build SourceCodeView

**Task 2.3: Create SourceCodeView Component**

File: `components/tools/viewers/SourceCodeView.tsx`

Reuse line number + code display pattern from CodeDrawer.

**Key Features:**
- Line numbers
- Copy button (using @ark-ui Clipboard)
- Download button
- Plain text (syntax highlighting optional Phase 2)

---

## Phase 3: New Enclosure Drawer

### Day 5 Morning: Drawer Shell

**Task 3.1: Create New EnclosureDrawer Structure**

File: `components/tools/EnclosureDrawer.tsx` (replace existing)

```typescript
'use client'

import BaseDrawer from './BaseDrawer'
import { Splitter } from '@ark-ui/react/splitter'
import { useState, useMemo } from 'react'
import { AlertTriangle } from 'lucide-react'
import FileTreeView from './FileTreeView'
import OpenSCADPreview from './viewers/OpenSCADPreview'
import SourceCodeView from './viewers/SourceCodeView'

interface EnclosureFile {
    filename: string
    language: string
    content: string
}

interface EnclosureData {
    files: EnclosureFile[]
    version?: number
    stale?: boolean
    staleReason?: string
}

interface EnclosureDrawerProps {
    isOpen: boolean
    onClose: () => void
    enclosureData: EnclosureData | null
}

export default function EnclosureDrawer({ 
    isOpen, 
    onClose, 
    enclosureData 
}: EnclosureDrawerProps) {
    const [selectedFile, setSelectedFile] = useState<string | null>(null)
    const [expandedFolders, setExpandedFolders] = useState<string[]>(['root'])
    const [searchQuery, setSearchQuery] = useState('')
    const [showSource, setShowSource] = useState(false)
    
    const files = enclosureData?.files || []
    const activeFile = useMemo(
        () => files.find(f => f.filename === selectedFile),
        [files, selectedFile]
    )
    
    // Auto-select first .scad file
    useEffect(() => {
        if (!selectedFile && files.length > 0) {
            const firstScad = files.find(f => f.filename.endsWith('.scad'))
            setSelectedFile(firstScad?.filename || files[0].filename)
        }
    }, [files, selectedFile])
    
    const isScadFile = activeFile?.filename.endsWith('.scad')
    
    return (
        <BaseDrawer
            isOpen={isOpen}
            onClose={onClose}
            title="3D Enclosure Files"
            description="OpenSCAD files for your 3D-printable enclosure"
            warning={enclosureData?.stale ? {
                message: enclosureData.staleReason || 'BOM/wiring changed',
                severity: 'warning'
            } : undefined}
        >
            {/* Horizontal split: tree | content */}
            <Splitter.Root
                defaultSize={[25, 75]}
                panels={[{ id: 'tree', minSize: 15 }, { id: 'content', minSize: 30 }]}
            >
                <Splitter.Panel id="tree">
                    <FileTreeView
                        files={files}
                        selectedFile={selectedFile}
                        onSelectFile={setSelectedFile}
                        searchQuery={searchQuery}
                        onSearchChange={setSearchQuery}
                    />
                </Splitter.Panel>
                
                <Splitter.ResizeTrigger id="tree:content" />
                
                <Splitter.Panel id="content">
                    {isScadFile && !showSource ? (
                        <OpenSCADPreview 
                            scadContent={activeFile.content} 
                            filename={activeFile.filename} 
                        />
                    ) : (
                        <SourceCodeView
                            content={activeFile?.content || ''}
                            filename={activeFile?.filename || ''}
                            language={activeFile?.language || 'text'}
                        />
                    )}
                </Splitter.Panel>
            </Splitter.Root>
        </BaseDrawer>
    )
}
```

**Verify:**
- Drawer opens with tree + content panels
- File selection works
- .scad files show 3D preview
- Other files show source

### Day 5 Afternoon: Add Toggle & Actions

**Task 3.2: Add Preview/Source Toggle**

Add button in content panel header:
- "View Source" / "View Preview" toggle
- Only for .scad files
- Switch between OpenSCADPreview and SourceCodeView

**Task 3.3: Preserve Existing Features**
- Copy button (per file)
- Download button
- Print instructions banner (detect README)

---

## Phase 4: Testing & Polish

### Day 7: Integration Testing

**Task 4.1: Test with Real Data**
- Open existing chat with enclosure artifacts
- Verify drawer opens correctly
- Test all file types (base.scad, lid.scad, README.md)
- Verify stale warning displays
- Test search functionality
- Test file selection

**Task 4.2: Performance Testing**
- Profile WASM init time (first load)
- Test compile time for complex models
- Check memory usage (open/close repeatedly)
- Verify 60fps 3D rendering
- Test on mobile devices

### Day 8: Polish & Documentation

**Task 4.3: Polish UI**
- Loading spinners
- Error messages
- Empty states
- Keyboard shortcuts (Escape)
- ARIA labels
- Focus management

**Task 4.4: Documentation**
- Update component README
- Add JSDoc comments
- Usage examples
- Screenshot before/after

---

## Rollout Strategy

### Testing Checklist

- [ ] WASM initializes correctly
- [ ] .scad files compile to STL
- [ ] 3D preview renders
- [ ] OrbitControls work (rotate, zoom, pan)
- [ ] Source view toggle works
- [ ] Non-.scad files display correctly
- [ ] Copy/download buttons work
- [ ] Stale warning displays
- [ ] Search filters files
- [ ] Panels resize smoothly
- [ ] No console errors
- [ ] No memory leaks
- [ ] Mobile responsive

### Deployment

1. **Merge to dev branch**
2. **Deploy to staging**
3. **QA testing**
4. **Deploy to production**
5. **Monitor error logs (WASM failures)**

---

## Risks & Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| WASM not supported | High | Feature detection, fallback to source |
| Large files timeout | Medium | Set 5s timeout, show error |
| Memory leaks | Medium | Cleanup in useEffect, dispose Three.js |
| STL parse errors | Low | Try-catch, show error message |

---

## Success Metrics

- [ ] Drawer opens < 500ms
- [ ] WASM init < 200ms (cached)
- [ ] Compile < 2s (typical enclosure)
- [ ] 60fps 3D rendering
- [ ] Zero memory leaks
- [ ] Zero WASM crashes (7 days post-launch)

---

## Next Steps

1. Review this plan with team
2. Create Jira tickets for each phase
3. Assign developer
4. Start Phase 1 (Dependencies)
5. Daily standups to track progress

