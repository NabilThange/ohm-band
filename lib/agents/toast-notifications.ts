'use client';

import { createToaster } from '@ark-ui/react/toast';
import type { CreateToasterReturn } from '@ark-ui/react/toast';

/**
 * Global Toast Manager for API Key Failover Notifications
 * Lazy-initialized to prevent server-side execution
 */
let apiToaster: CreateToasterReturn | null = null;
let toasterInitTime: number | null = null;

function getToaster(): CreateToasterReturn {
    const startTime = performance.now();

    if (!apiToaster) {
        console.log('[Toast Debug] 🔧 Initializing toaster for the first time...');
        apiToaster = createToaster({
            placement: 'top-end',
            overlap: true,
            gap: 16,
            max: 5,
            duration: 5000,
        });
        toasterInitTime = performance.now();
        console.log('[Toast Debug] ✅ Toaster initialized in', (toasterInitTime - startTime).toFixed(2), 'ms');
    } else {
        const timeSinceInit = toasterInitTime ? (performance.now() - toasterInitTime).toFixed(2) : 'unknown';
        console.log('[Toast Debug] ♻️ Reusing existing toaster (initialized', timeSinceInit, 'ms ago)');
    }

    return apiToaster;
}

/**
 * Show a warning toast when an API key fails
 */
export function showKeyFailureToast(keyIndex: number, totalKeys: number, error: string) {
    console.log('[Toast Debug] 🔴 showKeyFailureToast called:', { keyIndex, totalKeys, error });
    if (typeof window === 'undefined') {
        console.log('[Toast Debug] Skipping - server side');
        return;
    }

    const remainingKeys = totalKeys - keyIndex - 1;
    console.log('[Toast Debug] Creating warning toast...');
    getToaster().warning({
        title: `🔄 API Key Rotation`,
        description: `Key #${keyIndex + 1} exhausted. Switching to backup... (${remainingKeys} backup${remainingKeys !== 1 ? 's' : ''} available)`,
        duration: 5000,
    });
    console.log('[Toast Debug] Warning toast created');
}

/**
 * Show an error toast when all keys are exhausted
 */
export function showAllKeysExhaustedToast(totalKeys: number) {
    if (typeof window === 'undefined') return; // Server-side guard

    getToaster().error({
        title: 'All API Keys Exhausted',
        description: `All ${totalKeys} API keys have run out of credits. Please add credits or new keys.`,
        duration: Infinity, // Stay until dismissed
    });
}

/**
 * Show a success toast when a key rotation succeeds
 */
export function showKeyRotationSuccessToast(newKeyIndex: number) {
    console.log('[Toast Debug] 🟢 showKeyRotationSuccessToast called:', { newKeyIndex });
    if (typeof window === 'undefined') {
        console.log('[Toast Debug] Skipping - server side');
        return;
    }

    console.log('[Toast Debug] Creating success toast...');
    getToaster().success({
        title: '✅ API Key Rotated Successfully',
        description: `Now using backup key #${newKeyIndex + 1}. Continuing your request...`,
        duration: 5000,
    });
    console.log('[Toast Debug] Success toast created');
}

/**
 * Show an info toast when the system initializes
 */
export function showKeyManagerInitToast(keyCount: number) {
    if (typeof window === 'undefined') return; // Server-side guard

    if (keyCount > 1) {
        getToaster().info({
            title: 'API Failover Active',
            description: `${keyCount} API keys loaded. Automatic failover enabled.`,
            duration: 5000,
        });
    }
}

import { getAgentIdentity } from './agent-identities';

/**
 * Show a toast when the orchestrator switches agents
 */
export function showAgentChangeToast(agentId: string) {
    const callTime = performance.now();
    console.log('[Toast Debug] 🤖 showAgentChangeToast called at', callTime.toFixed(2), 'ms:', { agentId });
    if (typeof window === 'undefined') {
        console.log('[Toast Debug] Skipping - server side');
        return;
    }

    const agentIdentity = getAgentIdentity(agentId);
    console.log('[Toast Debug] Agent identity:', agentIdentity);

    console.log('[Toast Debug] Creating agent change toast...');
    const toastStartTime = performance.now();
    getToaster().success({
        title: 'Agent Active',
        description: `${agentIdentity.icon} ${agentIdentity.name} is now handling your request.`,
        duration: 5000,
    });
    const toastEndTime = performance.now();
    console.log('[Toast Debug] ✅ Agent change toast created in', (toastEndTime - toastStartTime).toFixed(2), 'ms');
    console.log('[Toast Debug] 📊 Total time from call to creation:', (toastEndTime - callTime).toFixed(2), 'ms');
}

/**
 * Tool call display names and icons
 */
const TOOL_DISPLAY_NAMES: Record<string, { name: string; icon: string }> = {
    // New simplified tools
    read: { name: 'Artifact Read', icon: '📖' },
    write: { name: 'Artifact Updated', icon: '✍️' },
    delete: { name: 'Artifact Deleted', icon: '🗑️' },
    open_drawer: { name: 'Drawer Opened', icon: '📂' },
    
    // Legacy tools (for backward compatibility)
    update_context: { name: 'Context Updated', icon: '📝' },
    update_mvp: { name: 'MVP Updated', icon: '🎯' },
    update_prd: { name: 'PRD Updated', icon: '📋' },
    update_bom: { name: 'BOM Generated', icon: '🔧' },
    add_code_file: { name: 'Code Generated', icon: '💻' },
    update_wiring: { name: 'Wiring Diagram Created', icon: '🔌' },
    update_budget: { name: 'Budget Analysis Complete', icon: '💰' },
};

/**
 * Show a toast when a tool is executed
 * Format: "Agent called [tool_name]"
 */
export function showToolCallToast(toolName: string) {
    const callTime = performance.now();
    console.log('[Toast Debug] 🔧 showToolCallToast called at', callTime.toFixed(2), 'ms:', { toolName });
    if (typeof window === 'undefined') {
        console.log('[Toast Debug] Skipping - server side');
        return;
    }

    const display = TOOL_DISPLAY_NAMES[toolName] || { name: toolName, icon: '⚙️' };

    console.log('[Toast Debug] Creating tool call toast for:', display.name);
    const toastStartTime = performance.now();
    getToaster().success({
        title: `Agent called ${toolName}`,
        description: `${display.icon} ${display.name}`,
        duration: 4000,
    });
    const toastEndTime = performance.now();
    console.log('[Toast Debug] ✅ Tool call toast created in', (toastEndTime - toastStartTime).toFixed(2), 'ms');
    console.log('[Toast Debug] 📊 Total time from call to creation:', (toastEndTime - callTime).toFixed(2), 'ms');
}

/**
 * Show a toast recommending the user configure their maker profile
 */
export function showMakerProfileToast() {
    if (typeof window === 'undefined') return;
    getToaster().info({
        title: "Configure Maker Profile 🛠️",
        description: "Set your available tools, preferred microcontrollers & spare parts for tailored designs.",
        duration: 7000,
    });
}

// Export toaster getter for ToastProvider
export { getToaster };
