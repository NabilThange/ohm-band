/**
 * Lazy SCAD Content Loader
 * Only loads file content when explicitly requested
 * Prevents large string allocations on drawer open
 */

type ContentLoader = () => string

const scadContentRegistry = new Map<string, ContentLoader>()

/**
 * Register a SCAD file with a lazy loader function
 */
export function registerScadContent(path: string, loader: ContentLoader) {
    scadContentRegistry.set(path, loader)
}

/**
 * Get SCAD content on-demand (only loads when called)
 */
export function getScadContent(path: string): string | null {
    const loader = scadContentRegistry.get(path)
    return loader ? loader() : null
}

/**
 * Check if content is registered (without loading it)
 */
export function hasScadContent(path: string): boolean {
    return scadContentRegistry.has(path)
}

/**
 * Get file metadata without loading content
 */
export interface ScadFileMetadata {
    path: string
    language: string
    description?: string
    sizeEstimate: number // Approximate size in bytes
}

const metadataRegistry = new Map<string, ScadFileMetadata>()

export function registerScadMetadata(metadata: ScadFileMetadata) {
    metadataRegistry.set(metadata.path, metadata)
}

export function getScadMetadata(path: string): ScadFileMetadata | null {
    return metadataRegistry.get(path) || null
}

export function getAllScadMetadata(): ScadFileMetadata[] {
    return Array.from(metadataRegistry.values())
}

/**
 * Clear all registrations (useful for testing)
 */
export function clearScadRegistry() {
    scadContentRegistry.clear()
    metadataRegistry.clear()
}
