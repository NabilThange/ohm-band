import {
    showKeyFailureToast,
    showAllKeysExhaustedToast,
    showKeyRotationSuccessToast,
    showKeyManagerInitToast
} from './toast-notifications';

/**
 * Production-Grade Key Manager with Health Tracking
 * Manages rotation and health status of Multi-Provider API keys
 */
export interface KeyRotationEvent {
    type: 'key_failed' | 'key_rotated' | 'all_keys_exhausted';
    failedKeyIndex?: number;
    newKeyIndex?: number;
    remainingKeys?: number;
    totalKeys?: number;
    message?: string;
}

export class KeyManager {
    private static instance: KeyManager;
    private keys: string[] = [];
    private currentIndex: number = 0;
    private currentProvider: string = ''; // Track current provider
    private failedKeys: Set<number> = new Set();
    private metrics = {
        usage: new Map<number, number>(),
        errors: new Map<number, number>(),
        lastRotation: Date.now()
    };
    private lastEvent: KeyRotationEvent | null = null;

    private constructor() {
        this.loadKeys();
    }

    static getInstance(): KeyManager {
        if (!KeyManager.instance) {
            KeyManager.instance = new KeyManager();
        }
        return KeyManager.instance;
    }

    /**
     * Get and clear the last rotation event (for API routes to return to client)
     */
    getAndClearLastEvent(): KeyRotationEvent | null {
        const event = this.lastEvent;
        this.lastEvent = null;
        return event;
    }

    /**
     * Load keys from environment with fallback support
     * Supports dynamic provider keys based on LLM_PROVIDER (e.g., OPENROUTER_API_KEY_1, GROQ_API_KEY_1, etc.)
     */
    private loadKeys(provider?: string) {
        const keys: string[] = [];
        const activeProvider = provider || process.env.LLM_PROVIDER || 'openrouter';
        this.currentProvider = activeProvider;
        
        // Provider-specific key patterns
        const keyPatterns: Record<string, string[]> = {
            'openrouter': ['OPENROUTER_API_KEY', 'NEXT_PUBLIC_OPENROUTER_API_KEY'],
            'groq': ['GROQ_API_KEY', 'NEXT_PUBLIC_GROQ_API_KEY'],
            'aiml': ['AIML_API_KEY', 'NEXT_PUBLIC_AIML_API_KEY']
        };
        
        const patterns = keyPatterns[activeProvider] || keyPatterns['openrouter'];
        
        // Try numbered format: PROVIDER_API_KEY_1, PROVIDER_API_KEY_2, etc. (limit to 2 per provider)
        for (let i = 1; i <= 2; i++) {
            const key = process.env[`${patterns[0]}_${i}`] || process.env[`${patterns[1]}_${i}`];
            if (key && key.trim().length > 0) {
                keys.push(key.trim());
            }
        }
        
        // Fallback to comma-separated or single key
        if (keys.length === 0) {
            const keysString = process.env[`${patterns[0]}S`] || ""; // e.g., OPENROUTER_API_KEYS
            const legacyKey = process.env[patterns[0]] || process.env[patterns[1]];
            
            const parsedKeys = keysString.split(",").map(k => k.trim()).filter(k => k.length > 0).slice(0, 2);
            
            if (parsedKeys.length > 0) {
                keys.push(...parsedKeys);
            } else if (legacyKey) {
                keys.push(legacyKey);
            }
        }
        
        if (keys.length === 0) {
            throw new Error(`❌ CRITICAL: No ${activeProvider.toUpperCase()} API keys found. Please set ${patterns[0]}_1, ${patterns[0]}_2, etc.`);
        }
        
        this.keys = keys;
        this.currentIndex = 0;
        this.failedKeys.clear(); // Reset failed keys for new provider
        console.log(`🔑 KeyManager loaded ${this.keys.length} keys for ${activeProvider}`);

        // Show toast notification if running in browser
        if (typeof window !== 'undefined') {
            showKeyManagerInitToast(this.keys.length);
        }
    }

    /**
     * Get current active key
     */
    getCurrentKey(): string {
        if (this.keys.length === 0) {
            throw new Error("No API keys available");
        }
        if (this.failedKeys.has(this.currentIndex)) {
            throw new Error("Current key is marked as failed");
        }
        return this.keys[this.currentIndex];
    }

    /**
     * Get current provider name
     */
    getCurrentProvider(): string {
        return this.currentProvider;
    }

    /**
     * Reload keys for a specific provider (public method)
     * This allows dynamic provider switching at runtime
     */
    reloadKeysForProvider(provider: string): void {
        this.loadKeys(provider);
    }

    /**
     * Switch to a different provider and reload keys
     * Returns true if switch was successful
     */
    switchProvider(newProvider: string): boolean {
        try {
            console.log(`🔄 Switching provider: ${this.currentProvider} → ${newProvider}`);
            this.loadKeys(newProvider);
            return true;
        } catch (error: any) {
            console.error(`❌ Failed to switch to ${newProvider}:`, error.message);
            return false;
        }
    }

    /**
     * Check if all keys for current provider are exhausted
     */
    allKeysExhausted(): boolean {
        return this.failedKeys.size >= this.keys.length;
    }

    /**
     * Rotate to next healthy key (skips failed ones)
     * Returns true if rotation succeeded, false if all keys exhausted
     */
    rotateKey(): boolean {
        const startIndex = this.currentIndex;
        let attempts = 0;

        do {
            this.currentIndex = (this.currentIndex + 1) % this.keys.length;
            attempts++;

            // Skip failed keys
            if (!this.failedKeys.has(this.currentIndex)) {
                console.log(`🔄 Rotated: Key #${startIndex + 1} → Key #${this.currentIndex + 1}`);
                this.metrics.lastRotation = Date.now();

                // Record event for API to return to client
                this.lastEvent = {
                    type: 'key_rotated',
                    failedKeyIndex: startIndex,
                    newKeyIndex: this.currentIndex,
                    remainingKeys: this.getHealthyKeyCount(),
                    totalKeys: this.keys.length,
                    message: `Rotated to backup key #${this.currentIndex + 1}`
                };

                // Show success toast for rotation (only if running in browser)
                if (typeof window !== 'undefined') {
                    showKeyRotationSuccessToast(this.currentIndex);
                }

                return true;
            }

            // Prevent infinite loop - if we've checked all keys, fail
            if (attempts >= this.keys.length) {
                console.error(`❌ All keys exhausted for ${this.currentProvider}`);

                // Record event for API to return to client
                this.lastEvent = {
                    type: 'all_keys_exhausted',
                    totalKeys: this.keys.length,
                    remainingKeys: 0,
                    message: `All ${this.keys.length} API keys exhausted for ${this.currentProvider}`
                };

                // Show error toast when all keys exhausted (only if running in browser)
                if (typeof window !== 'undefined') {
                    showAllKeysExhaustedToast(this.keys.length);
                }

                return false;
            }
        } while (true);
    }

    /**
     * Mark current key as permanently failed
     */
    markCurrentKeyAsFailed() {
        this.failedKeys.add(this.currentIndex);
        const errorCount = (this.metrics.errors.get(this.currentIndex) || 0) + 1;
        this.metrics.errors.set(this.currentIndex, errorCount);
        console.warn(`💀 Key #${this.currentIndex + 1} marked as FAILED (${errorCount} errors)`);

        // Record event for API to return to client
        this.lastEvent = {
            type: 'key_failed',
            failedKeyIndex: this.currentIndex,
            remainingKeys: this.getHealthyKeyCount(),
            totalKeys: this.keys.length,
            message: `API Key #${this.currentIndex + 1} failed`
        };

        // Show warning toast for key failure (only if running in browser)
        if (typeof window !== 'undefined') {
            const remainingKeys = this.getHealthyKeyCount();
            showKeyFailureToast(this.currentIndex, this.keys.length, `${remainingKeys} backup keys available`);
        }
    }

    /**
     * Record successful API call
     */
    recordSuccess() {
        const count = (this.metrics.usage.get(this.currentIndex) || 0) + 1;
        this.metrics.usage.set(this.currentIndex, count);
    }

    /**
     * Get total number of keys
     */
    getTotalKeys(): number {
        return this.keys.length;
    }

    /**
     * Get number of healthy (non-failed) keys
     */
    getHealthyKeyCount(): number {
        return this.keys.length - this.failedKeys.size;
    }

    /**
     * Get detailed status for monitoring
     */
    getStatus(): string {
        const healthy = this.getHealthyKeyCount();
        const total = this.getTotalKeys();
        const status = Array.from({ length: total }, (_, i) => {
            const isCurrent = i === this.currentIndex;
            const isFailed = this.failedKeys.has(i);
            const usage = this.metrics.usage.get(i) || 0;
            const errors = this.metrics.errors.get(i) || 0;

            let icon = isFailed ? '❌' : (isCurrent ? '✅' : '⏸️');
            return `${icon} Key #${i + 1}: ${usage} calls, ${errors} errors`;
        });

        return `🔑 API Keys: ${healthy}/${total} healthy\n${status.join('\n')}`;
    }

    /**
     * Reset all failed keys (for manual recovery)
     */
    resetFailedKeys() {
        this.failedKeys.clear();
        console.log("♻️ Reset all failed key markers");
    }

    /**
     * FOR TESTING ONLY - Inject mock keys
     */
    static createTestInstance(mockKeys: string[]): KeyManager {
        const instance = new KeyManager();
        instance.keys = mockKeys;
        KeyManager.instance = instance;
        return instance;
    }
}
