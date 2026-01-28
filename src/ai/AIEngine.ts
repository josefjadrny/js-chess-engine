/**
 * AI Engine for js-chess-engine v2
 *
 * Orchestrates the AI search and provides level-based difficulty settings.
 */

import { InternalBoard, InternalMove } from '../types';
import { AILevel } from '../types/ai.types';
import { Search } from './Search';

/**
 * AI difficulty level configuration
 * Maps AI levels (0-4) to search depths
 */
interface LevelConfig {
    baseDepth: number;      // Base search depth
    extendedDepth: number;  // Extended search depth for checks/captures
}

/**
 * AI level to depth mapping
 * Based on v1 behavior for compatibility
 */
const LEVEL_CONFIG: Record<AILevel, LevelConfig> = {
    0: { baseDepth: 1, extendedDepth: 2 },  // Very easy
    1: { baseDepth: 2, extendedDepth: 3 },  // Easy
    2: { baseDepth: 3, extendedDepth: 4 },  // Medium (default)
    3: { baseDepth: 4, extendedDepth: 5 },  // Hard
    4: { baseDepth: 5, extendedDepth: 6 },  // Very hard
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
     * @param level - AI difficulty level (0-4, default 2)
     * @param ttSizeMB - Transposition table size in MB (0 to disable, 0.25-256 MB, default 16)
     * @returns Best move found by the AI
     */
    findBestMove(board: InternalBoard, level: AILevel = 2, ttSizeMB: number = 16): InternalMove | null {
        // Recreate search if TT size changed
        if (ttSizeMB !== this.currentTTSize) {
            this.currentTTSize = ttSizeMB;
            this.search = new Search(ttSizeMB);
        }

        // Get depth configuration for this level
        const config = LEVEL_CONFIG[level];

        // Perform search
        const result = this.search.findBestMove(
            board,
            config.baseDepth,
            config.extendedDepth
        );

        return result ? result.move : null;
    }

    /**
     * Get the search depth for a given AI level
     *
     * @param level - AI level (0-4)
     * @returns Depth configuration
     */
    static getLevelDepth(level: AILevel): LevelConfig {
        return LEVEL_CONFIG[level];
    }
}
