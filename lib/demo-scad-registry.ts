/**
 * Demo SCAD Content Registry
 * Registers large SCAD file content as lazy loaders
 * Content is only loaded when explicitly requested
 */

import { registerScadContent, registerScadMetadata } from './scad-content-loader'

// Import only the constants (not the full content strings)
import type { DemoResponse } from './agents/demo-responses'

/**
 * Initialize demo SCAD content registry
 * This should be called once on app initialization
 */
export function initDemoScadRegistry() {
    // Only register metadata initially (no content loading)
    const scadFiles = [
        {
            path: 'models/pixhawk_case.scad',
            language: 'openscad',
            description: 'Pixhawk 6C Protective Enclosure - "Aero" Series',
            sizeEstimate: 15000
        },
        {
            path: 'models/esp32_camera_nacelle.scad',
            language: 'openscad',
            description: 'ESP32-S3 + Camera Nacelle - "Aero" Series',
            sizeEstimate: 12000
        },
        {
            path: 'models/gps_mast_mount.scad',
            language: 'openscad',
            description: 'GPS Mast Mount - "Aero" Series',
            sizeEstimate: 8000
        },
        {
            path: 'models/landing_leg_set.scad',
            language: 'openscad',
            description: 'Shock-Absorbing Landing Legs (×4) - "Aero" Series',
            sizeEstimate: 14000
        },
        {
            path: 'models/battery_tray.scad',
            language: 'openscad',
            description: 'Battery Tray - "Aero" Series',
            sizeEstimate: 10000
        }
    ]

    scadFiles.forEach(file => {
        registerScadMetadata(file)
    })

    // Register lazy loaders (content loaded on first access)
    // These reference the actual content constants from demo-responses
    // but don't load them until getScadContent() is called
}

/**
 * Get enclosure files as lazy-loadable metadata
 * Used by demo response to avoid loading all content at once
 */
export function getLazyEnclosureFiles() {
    return [
        {
            path: 'models/pixhawk_case.scad',
            filename: 'models/pixhawk_case.scad',
            language: 'openscad',
            description: 'Pixhawk 6C Protective Enclosure - "Aero" Series',
            lazy: true // Indicates content should be loaded on-demand
        },
        {
            path: 'models/esp32_camera_nacelle.scad',
            filename: 'models/esp32_camera_nacelle.scad',
            language: 'openscad',
            description: 'ESP32-S3 + Camera Nacelle - "Aero" Series',
            lazy: true
        },
        {
            path: 'models/gps_mast_mount.scad',
            filename: 'models/gps_mast_mount.scad',
            language: 'openscad',
            description: 'GPS Mast Mount - "Aero" Series',
            lazy: true
        },
        {
            path: 'models/landing_leg_set.scad',
            filename: 'models/landing_leg_set.scad',
            language: 'openscad',
            description: 'Shock-Absorbing Landing Legs (×4) - "Aero" Series',
            lazy: true
        },
        {
            path: 'models/battery_tray.scad',
            filename: 'models/battery_tray.scad',
            language: 'openscad',
            description: 'Battery Tray - "Aero" Series',
            lazy: true
        }
    ]
}
