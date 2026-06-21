/**
 * Demo SCAD Content Provider
 * Provides SCAD file content on-demand
 * This file is NOT imported until content is needed
 */

export const scadContentMap: Record<string, () => Promise<string>> = {
    'models/pixhawk_case.scad': () => import('./agents/demo-responses').then(m => m.pixhawkCaseScadContent || ''),
    'models/esp32_camera_nacelle.scad': () => import('./agents/demo-responses').then(m => m.esp32CameraNacelleScadContent || ''),
    'models/gps_mast_mount.scad': () => import('./agents/demo-responses').then(m => m.gpsMastMountScadContent || ''),
    'models/landing_leg_set.scad': () => import('./agents/demo-responses').then(m => m.landingLegSetScadContent || ''),
    'models/battery_tray.scad': () => import('./agents/demo-responses').then(m => m.batteryTrayScadContent || ''),
}

export async function getScadContentAsync(path: string): Promise<string | null> {
    const loader = scadContentMap[path]
    if (!loader) return null
    
    try {
        return await loader()
    } catch (error) {
        console.error(`Failed to load SCAD content for ${path}:`, error)
        return null
    }
}
