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
 * Node.js: 8 MB (ample memory available)
 * Browser: 4 MB (more conservative for web/mobile)
 *
 * @returns Recommended TT size in MB
 */
export function getDefaultTTSize(): number {
    return isNodeEnvironment() ? 8 : 4;
}
