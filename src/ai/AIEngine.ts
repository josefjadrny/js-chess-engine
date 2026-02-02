/**
 * AI Engine for js-chess-engine v2
 *
 * Orchestrates the AI search and provides level-based difficulty settings.
 */

import { InternalBoard, InternalMove } from '../types';
import { AILevel } from '../types/ai.types';
import { Search } from './Search';
import { generateLegalMoves } from '../core/MoveGenerator';
import { Piece } from '../types';

/**
 * AI difficulty level configuration
 * Maps AI levels (1-5) to search depths
 */
interface LevelConfig {
    baseDepth: number;      // Base search depth
    extendedDepth: number;  // Max additional adaptive depth allowed
    checkExtension: boolean; // Whether to extend search on checks
    qMaxDepth: number;      // Quiescence search max depth
}

/**
 * AI level to depth mapping
 * Based on v1 behavior for compatibility
 */
const LEVEL_CONFIG: Record<AILevel, LevelConfig> = {
    // NOTE: Depth is the single biggest speed lever.
    // These values are intentionally conservative for browser-friendliness.
    1: { baseDepth: 1, extendedDepth: 1, checkExtension: true, qMaxDepth: 1 },   // Beginner
    2: { baseDepth: 2, extendedDepth: 1, checkExtension: true, qMaxDepth: 1 },   // Easy
    3: { baseDepth: 3, extendedDepth: 2, checkExtension: true, qMaxDepth: 2 },   // Intermediate (default)
    4: { baseDepth: 3, extendedDepth: 3, checkExtension: true, qMaxDepth: 3 },   // Advanced
    5: { baseDepth: 4, extendedDepth: 3, checkExtension: true, qMaxDepth: 4 },   // Expert
};

/**
 * AI Engine class
 * Manages AI move selection and search
 */
export class AIEngine {
    private search: Search;
    private currentTTSize: number = 16;

    constructor() {
        this.search = new Search(this.currentTTSize);
    }

    /**
     * Find the best move for the current position
     *
     * @param board - Current board state
    * @param level - AI difficulty level (1-5, default 3)
     * @param ttSizeMB - Transposition table size in MB (0 to disable, 0.25-256 MB, auto-scaled by level)
     * @returns Best move found by the AI
     */
    findBestMove(board: InternalBoard, level: AILevel = 3, ttSizeMB: number = 16, depth?: { base?: number; extended?: number; check?: boolean; quiescence?: number }): InternalMove | null {
        // Recreate search if TT size changed
        if (ttSizeMB !== this.currentTTSize) {
            this.currentTTSize = ttSizeMB;
            this.search = new Search(ttSizeMB);
        }

        // Get depth configuration for this level, then apply overrides
        const config = LEVEL_CONFIG[level];
        const baseDepth = depth?.base ?? config.baseDepth;
        const extendedDepth = depth?.extended ?? config.extendedDepth;
        const qMaxDepth = depth?.quiescence ?? config.qMaxDepth;
        const checkExtension = depth?.check ?? config.checkExtension;

        // Pick an effective depth based on current position complexity.
        // This keeps early/midgame conservative, but lets endgames search deeper.
    const effectiveDepth = this.getAdaptiveDepth(board, baseDepth, extendedDepth);

        // Perform search
        const result = this.search.findBestMove(
            board,
            effectiveDepth,
            qMaxDepth,
            checkExtension
        );

        return result ? result.move : null;
    }

    /**
    * Get the search depth for a given AI level
     *
    * @param level - AI level (1-5)
     * @returns Depth configuration
     */
    static getLevelDepth(level: AILevel): LevelConfig {
        return LEVEL_CONFIG[level];
    }

    /**
     * Adaptive depth heuristic.
     *
     * Contract:
     * - Input: board + baseDepth (from level)
     * - Output: adjusted depth (>= 1)
     *
    * Heuristic goals:
    * - Never search shallower than the requested level depth.
    * - If there are very few root legal moves (tactical / constrained), allow +1.
    * - If the position is simplified (few pieces), allow +1 or +2.
     */
    private getAdaptiveDepth(board: InternalBoard, baseDepth: number, allowedExtendedDepth: number): number {
        if (allowedExtendedDepth <= 0) return Math.max(1, baseDepth);

        // Root branching factor (legal moves only)
        const rootMoves = generateLegalMoves(board).length;

        // Material simplification proxy: count non-empty pieces.
        // (Mailbox is Int8Array, so iterating it is cheap.)
        let pieceCount = 0;
        for (const p of board.mailbox) {
            if (p !== Piece.EMPTY) pieceCount++;
        }

        let depth = baseDepth;

        // Simplified endgames: search deeper.
        // 32 pieces = starting position. Kings-only = 2.
        if (pieceCount <= 10) depth += 2;
        else if (pieceCount <= 18) depth += 1;

        // Constrained positions: deeper can be affordable and tactically valuable.
        if (rootMoves <= 12) depth += 1;

        // Safety rails
        if (depth < baseDepth) depth = baseDepth;
        if (depth < 1) depth = 1;
        const maxDepth = baseDepth + allowedExtendedDepth;
        if (depth > maxDepth) depth = maxDepth;

        return depth;
    }
}
