import type { OpenSCADInstance } from 'openscad-wasm'

let openscadInstance: OpenSCADInstance | null = null
let initPromise: Promise<OpenSCADInstance> | null = null

/**
 * Singleton: Initialize OpenSCAD WASM once
 */
export async function getOpenSCAD(): Promise<OpenSCADInstance> {
    if (openscadInstance) return openscadInstance
    
    if (!initPromise) {
        initPromise = (async () => {
            const { createOpenSCAD } = await import('openscad-wasm')
            openscadInstance = await createOpenSCAD()
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
        const instance = await getOpenSCAD()
        const stlData = await instance.renderToStl(scadContent)
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
