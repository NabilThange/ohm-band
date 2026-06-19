# OpenSCAD WASM Integration Guide

> **Package**: `openscad-wasm` (official OpenSCAD project)  
> **Version**: 0.0.4 (latest as of June 2026)  
> **Bundle Size**: ~10 MB  
> **Browser Support**: All modern browsers with WebAssembly

---

## Why OpenSCAD WASM?

### Chosen Solution: `openscad-wasm`

**Pros:**
- ✅ Official OpenSCAD port (not third-party)
- ✅ Supports full OpenSCAD syntax
- ✅ Self-contained (~10 MB WASM bundle)
- ✅ Virtual filesystem support
- ✅ Actively maintained

**Cons:**
- ⚠️ Compilation is slow (~1-2s per file)
- ⚠️ Not a real-time renderer (not suitable for live editing at 60fps)
- ⚠️ Blocking main thread during compile (no Web Worker support yet)

### Rejected Alternatives

**OpenJSCAD** (`openjscad-react`)
- ❌ Uses different syntax (JavaScript-based, not OpenSCAD)
- ❌ Would require converting generated `.scad` files
- ❌ Not compatible with OpenSCAD ecosystem

---

## Installation

```bash
npm install openscad-wasm
```

**Peer Dependencies:**
```bash
npm install three @react-three/fiber @react-three/drei three-stdlib
```

---

## Basic Usage

### 1. Initialize WASM (Singleton Pattern)

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
```

### 2. Compile .scad to STL

```typescript
import { getOpenSCAD } from './client'

async function compileToSTL(scadContent: string) {
    const scad = await getOpenSCAD()
    
    // Write input file to virtual FS
    scad.FS.writeFile('input.scad', scadContent)
    
    // Compile (blocking call)
    scad.callMain(['-o', 'output.stl', 'input.scad'])
    
    // Read output STL
    const stlData = scad.FS.readFile('output.stl', { encoding: 'utf8' })
    
    // Cleanup
    scad.FS.unlink('input.scad')
    scad.FS.unlink('output.stl')
    
    return stlData
}
```

### 3. Render STL with Three.js

```typescript
import { STLLoader } from 'three-stdlib'
import { Canvas } from '@react-three/fiber'

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

export default function Viewer({ stlData }: { stlData: string }) {
    return (
        <Canvas>
            <STLMesh stlData={stlData} />
            <OrbitControls />
            <ambientLight intensity={0.5} />
            <directionalLight position={[10, 10, 5]} />
        </Canvas>
    )
}
```

---

## Complete React Component Example

```typescript
'use client'

import { useState, useEffect } from 'react'
import { compileToSTL } from '@/lib/openscad/client'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { STLLoader } from 'three-stdlib'

interface Props {
    scadContent: string
}

export default function OpenSCADPreview({ scadContent }: Props) {
    const [stl, setStl] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    
    useEffect(() => {
        let cancelled = false
        
        async function compile() {
            try {
                setLoading(true)
                const result = await compileToSTL(scadContent)
                if (!cancelled) setStl(result)
            } catch (err: any) {
                if (!cancelled) setError(err.message)
            } finally {
                if (!cancelled) setLoading(false)
            }
        }
        
        compile()
        return () => { cancelled = true }
    }, [scadContent])
    
    if (loading) return <div>Compiling...</div>
    if (error) return <div>Error: {error}</div>
    if (!stl) return null
    
    return (
        <Canvas camera={{ position: [100, 100, 100] }}>
            <STLMesh stlData={stl} />
            <OrbitControls />
            <ambientLight />
        </Canvas>
    )
}

function STLMesh({ stlData }: { stlData: string }) {
    const geometry = useMemo(() => {
        const loader = new STLLoader()
        return loader.parse(stlData)
    }, [stlData])
    
    return (
        <mesh geometry={geometry}>
            <meshStandardMaterial color="skyblue" />
        </mesh>
    )
}
```

---

## Performance Optimizations

### 1. Caching Compiled STL

```typescript
const compiledCache = useRef<Map<string, string>>(new Map())

async function getCachedSTL(scadContent: string) {
    const hash = hashString(scadContent) // simple hash
    
    if (compiledCache.current.has(hash)) {
        return compiledCache.current.get(hash)!
    }
    
    const stl = await compileToSTL(scadContent)
    compiledCache.current.set(hash, stl)
    return stl
}
```

### 2. Lazy Loading

```typescript
// Only load WASM when drawer opens
const OpenSCADPreview = lazy(() => import('./viewers/OpenSCADPreview'))

<Suspense fallback={<LoadingSpinner />}>
    <OpenSCADPreview scadContent={content} />
</Suspense>
```

### 3. Debounced Recompile (for live editing)

```typescript
const debouncedCompile = useDebouncedCallback(
    (content: string) => compileToSTL(content),
    1000 // 1s delay after typing stops
)
```

### 4. Dispose Three.js Resources

```typescript
useEffect(() => {
    return () => {
        geometry?.dispose()
        material?.dispose()
    }
}, [geometry, material])
```

---

## Error Handling

### Common Errors

**1. WASM Not Supported**
```typescript
if (typeof WebAssembly === 'undefined') {
    return <div>Your browser doesn't support WebAssembly</div>
}
```

**2. Compilation Timeout**
```typescript
const compileWithTimeout = (scadContent: string, timeout = 5000) => {
    return Promise.race([
        compileToSTL(scadContent),
        new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout')), timeout)
        )
    ])
}
```

**3. Invalid OpenSCAD Syntax**
```typescript
try {
    const stl = await compileToSTL(scadContent)
} catch (err: any) {
    setError(`OpenSCAD Error: ${err.message}`)
}
```

---

## Browser Compatibility

| Browser | WASM Support | Status |
|---------|--------------|--------|
| Chrome 57+ | ✅ Yes | Full support |
| Firefox 52+ | ✅ Yes | Full support |
| Safari 11+ | ✅ Yes | Full support |
| Edge 16+ | ✅ Yes | Full support |
| IE 11 | ❌ No | Not supported |

**Fallback Strategy:**
```typescript
if (!isWASMSupported()) {
    return <SourceCodeView content={scadContent} />
}
```

---

## Typical Compile Times

| Model Complexity | Compile Time |
|------------------|--------------|
| Simple box (50 lines) | 200-500ms |
| Typical enclosure (200 lines) | 500-1500ms |
| Complex parametric (500+ lines) | 1500-3000ms |

**UX Recommendation**: Always show loading spinner for >200ms operations.

---

## Testing

### Unit Test Example

```typescript
import { compileToSTL, isWASMSupported } from './client'

describe('OpenSCAD WASM', () => {
    it('should compile simple cube', async () => {
        const scad = 'cube([10, 10, 10]);'
        const { stl, error } = await compileToSTL(scad)
        
        expect(error).toBeUndefined()
        expect(stl).toContain('solid')
        expect(stl).toContain('facet')
    })
    
    it('should handle syntax errors', async () => {
        const scad = 'invalid syntax!!!'
        const { error } = await compileToSTL(scad)
        
        expect(error).toBeDefined()
    })
})
```

---

## References

- **Official Repository**: [github.com/openscad/openscad-wasm](https://github.com/openscad/openscad-wasm)
- **OpenSCAD Documentation**: [openscad.org/documentation](https://openscad.org/documentation.html)
- **Three.js STLLoader**: [threejs.org/docs/#examples/en/loaders/STLLoader](https://threejs.org/docs/#examples/en/loaders/STLLoader)
- **React Three Fiber**: [docs.pmnd.rs/react-three-fiber](https://docs.pmnd.rs/react-three-fiber)
