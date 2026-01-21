/**
 * js-chess-engine v2
 *
 * Public API - Phase 1 placeholder
 * Full implementation in Phase 3
 */

// Export types for TypeScript users
export * from './types';

// Placeholder - will be implemented in Phase 3
export class Game {
    constructor(_configuration?: any) {
        throw new Error('Game class not yet implemented - Phase 3');
    }
}

// Placeholder stateless functions - will be implemented in Phase 3
export function moves(_config: any): any {
    throw new Error('moves() not yet implemented - Phase 3');
}

export function status(_config: any): any {
    throw new Error('status() not yet implemented - Phase 3');
}

export function getFen(_config: any): string {
    throw new Error('getFen() not yet implemented - Phase 3');
}

export function move(_config: any, _from: string, _to: string): any {
    throw new Error('move() not yet implemented - Phase 3');
}

export function aiMove(_config: any, _level?: number): any {
    throw new Error('aiMove() not yet implemented - Phase 3');
}
