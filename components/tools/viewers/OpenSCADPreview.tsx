'use client'

import { useState, useEffect, useRef, memo } from 'react'
import { compileToSTL, isWASMSupported } from '@/lib/openscad/client'
import STLViewer from './STLViewer'
import { Loader2, AlertTriangle } from 'lucide-react'

interface OpenSCADPreviewProps {
    scadContent: string
    filename: string
    lazy?: boolean // NEW: Only compile when explicitly requested
}

function hashString(str: string): string {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i)
        hash = (hash << 5) - hash + char
        hash |= 0 // Convert to 32bit integer
    }
    return hash.toString()
}

// Global cache shared across all instances to prevent re-compilation
const globalCompileCache = new Map<string, string>()

function OpenSCADPreview({ scadContent, filename, lazy = false }: OpenSCADPreviewProps) {
    const [stlData, setStlData] = useState<string | null>(null)
    const [isCompiling, setIsCompiling] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [shouldCompile, setShouldCompile] = useState(!lazy)

    const compileTimeoutRef = useRef<NodeJS.Timeout | null>(null)
    const contentHash = useRef(hashString(scadContent))

    useEffect(() => {
        contentHash.current = hashString(scadContent)
    }, [scadContent])

    useEffect(() => {
        if (!isWASMSupported()) {
            setError('WebAssembly is not supported in this browser.')
            return
        }

        if (!shouldCompile) {
            return
        }

        let cancelled = false

        async function compile() {
            // Check global cache first
            if (globalCompileCache.has(contentHash.current)) {
                if (!cancelled) {
                    setStlData(globalCompileCache.get(contentHash.current)!)
                    setIsCompiling(false)
                }
                return
            }

            setIsCompiling(true)
            setError(null)

            // Debounce compilation to prevent simultaneous compilations
            if (compileTimeoutRef.current) {
                clearTimeout(compileTimeoutRef.current)
            }

            compileTimeoutRef.current = setTimeout(async () => {
                try {
                    const result = await compileToSTL(scadContent, filename)

                    if (cancelled) return

                    if (result.error) {
                        setError(result.error)
                    } else if (result.stl) {
                        globalCompileCache.set(contentHash.current, result.stl)
                        setStlData(result.stl)
                    } else {
                        setError('Compilation completed but output is empty.')
                    }
                } catch (err: any) {
                    if (!cancelled) {
                        setError(err.message || 'An error occurred during OpenSCAD compilation.')
                    }
                } finally {
                    if (!cancelled) {
                        setIsCompiling(false)
                    }
                }
            }, 100) // 100ms debounce
        }

        compile()

        return () => {
            cancelled = true
            if (compileTimeoutRef.current) {
                clearTimeout(compileTimeoutRef.current)
            }
        }
    }, [scadContent, filename, shouldCompile])

    if (!shouldCompile && lazy) {
        return (
            <div className="flex items-center justify-center h-full bg-slate-900 min-h-[300px]">
                <button
                    onClick={() => setShouldCompile(true)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm transition-colors"
                >
                    Compile & Preview 3D Model
                </button>
            </div>
        )
    }

    if (isCompiling) {
        return (
            <div className="flex items-center justify-center h-full bg-slate-900 min-h-[300px]">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
                    <span className="text-sm text-slate-400">Compiling 3D Model...</span>
                    <span className="text-xs text-slate-500">This may take a few moments...</span>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-full bg-slate-900 min-h-[300px] overflow-y-auto">
                <div className="flex flex-col items-center gap-3 max-w-md p-6 text-center m-auto">
                    <AlertTriangle className="w-8 h-8 text-yellow-500" />
                    <span className="text-sm font-semibold text-slate-200">OpenSCAD Compilation Error</span>
                    <pre className="text-[10px] text-yellow-500/80 bg-black/30 p-3 rounded overflow-auto max-w-full text-left font-mono whitespace-pre-wrap max-h-48">
                        {error}
                    </pre>
                    <button
                        onClick={() => {
                            setShouldCompile(false)
                            setTimeout(() => setShouldCompile(true), 100)
                        }}
                        className="mt-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs transition-colors"
                    >
                        Retry Compilation
                    </button>
                </div>
            </div>
        )
    }

    if (!stlData) {
        return (
            <div className="flex items-center justify-center h-full bg-slate-900 min-h-[300px] text-zinc-500 italic text-sm">
                No 3D model available.
            </div>
        )
    }

    return <STLViewer stlData={stlData} />
}

// Memoize to prevent unnecessary re-renders
export default memo(OpenSCADPreview, (prev, next) => {
    return prev.scadContent === next.scadContent && prev.filename === next.filename && prev.lazy === next.lazy
})
