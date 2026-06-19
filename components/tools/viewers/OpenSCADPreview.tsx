'use client'

import { useState, useEffect, useRef } from 'react'
import { compileToSTL, isWASMSupported } from '@/lib/openscad/client'
import STLViewer from './STLViewer'
import { Loader2, AlertTriangle } from 'lucide-react'

interface OpenSCADPreviewProps {
    scadContent: string
    filename: string
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

export default function OpenSCADPreview({ scadContent, filename }: OpenSCADPreviewProps) {
    const [stlData, setStlData] = useState<string | null>(null)
    const [isCompiling, setIsCompiling] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Cache compiled output by hash of scadContent
    const compileCache = useRef<Map<string, string>>(new Map())

    useEffect(() => {
        if (!isWASMSupported()) {
            setError('WebAssembly is not supported in this browser.')
            setIsCompiling(false)
            return
        }

        let cancelled = false
        const contentHash = hashString(scadContent)

        async function compile() {
            setIsCompiling(true)
            setError(null)

            if (compileCache.current.has(contentHash)) {
                if (!cancelled) {
                    setStlData(compileCache.current.get(contentHash)!)
                    setIsCompiling(false)
                }
                return
            }

            try {
                const result = await compileToSTL(scadContent, filename)

                if (cancelled) return

                if (result.error) {
                    setError(result.error)
                } else if (result.stl) {
                    compileCache.current.set(contentHash, result.stl)
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
        }

        compile()

        return () => {
            cancelled = true
        }
    }, [scadContent, filename])

    if (isCompiling) {
        return (
            <div className="flex items-center justify-center h-full bg-slate-900 min-h-[300px]">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
                    <span className="text-sm text-slate-400">Compiling 3D Model...</span>
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
