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
 * @param level - AI difficulty level (1-5)
 * @returns Recommended TT size in MB
 */
export function getRecommendedTTSize(level: number): number {
    if (isNodeEnvironment()) {
        // Node.js - more generous memory allocation
        const nodeSizes: Record<number, number> = {
            1: 2,   // Level 1: 2 MB
            2: 4,   // Level 2: 4 MB
            3: 16,  // Level 3: 16 MB (default)
            4: 32,  // Level 4: 32 MB
            5: 64,  // Level 5: 64 MB
        };
        return nodeSizes[level] ?? 16;
    } else {
        // Browser - modern-device-friendly allocation (reasonable for 2024+ devices)
        const browserSizes: Record<number, number> = {
            1: 1,    // Level 1: 1 MB (lightweight, older devices)
            2: 2,    // Level 2: 2 MB (mobile-friendly)
            3: 8,    // Level 3: 8 MB (balanced default - appropriate for modern browsers)
            4: 16,   // Level 4: 16 MB (strong performance)
            5: 32,   // Level 5: 32 MB (maximum strength)
        };
        return browserSizes[level] ?? 8;
    }
}
