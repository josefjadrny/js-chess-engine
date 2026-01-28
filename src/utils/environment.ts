/**
 * Environment detection utilities
 * Helps optimize memory usage based on runtime environment
 */

/**
 * Detect if code is running in Node.js environment
 *
 * @returns true if running in Node.js, false if in browser
 */
export function isNodeEnvironment(): boolean {
    // Check for Node.js-specific globals
    return (
        typeof process !== 'undefined' &&
        process.versions != null &&
        process.versions.node != null
    );
}

/**
 * Detect if code is running in browser environment
 *
 * @returns true if running in browser, false if in Node.js
 */
export function isBrowserEnvironment(): boolean {
    return !isNodeEnvironment();
}

/**
 * Get default transposition table size based on environment
 *
 * Node.js: 16 MB (ample memory available)
 * Browser: 1 MB (more conservative for web/mobile)
 *
 * @returns Recommended TT size in MB
 */
export function getDefaultTTSize(): number {
    return isNodeEnvironment() ? 16 : 1;
}

/**
 * Get recommended TT size for a given AI level and environment
 *
 * @param level - AI difficulty level (0-4)
 * @returns Recommended TT size in MB
 */
export function getRecommendedTTSize(level: number): number {
    if (isNodeEnvironment()) {
        // Node.js - more generous memory allocation
        const nodeSizes: Record<number, number> = {
            0: 2,   // Level 0: 2 MB
            1: 4,   // Level 1: 4 MB
            2: 16,  // Level 2: 16 MB (default)
            3: 32,  // Level 3: 32 MB
            4: 64,  // Level 4: 64 MB
        };
        return nodeSizes[level] ?? 16;
    } else {
        // Browser - conservative memory allocation
        const browserSizes: Record<number, number> = {
            0: 0.5,  // Level 0: 512 KB
            1: 1,    // Level 1: 1 MB (default)
            2: 2,    // Level 2: 2 MB
            3: 4,    // Level 3: 4 MB
            4: 8,    // Level 4: 8 MB
        };
        return browserSizes[level] ?? 1;
    }
}
