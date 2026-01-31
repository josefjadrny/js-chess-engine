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
 * Maps AI levels (1-6) to search depths
 */
interface LevelConfig {
    baseDepth: number;      // Base search depth
}

/**
 * AI level to depth mapping
 * Based on v1 behavior for compatibility
 */
const LEVEL_CONFIG: Record<AILevel, LevelConfig> = {
    // NOTE: Depth is the single biggest speed lever.
    // These values are intentionally conservative for browser-friendliness.
    1: { baseDepth: 1 },   // Beginner
    2: { baseDepth: 2 },   // Easy
    3: { baseDepth: 3 },   // Intermediate (default)
    4: { baseDepth: 3 },   // Advanced
    5: { baseDepth: 4 },   // Expert
    6: { baseDepth: 5 },   // Highest difficulty
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
    * @param level - AI difficulty level (1-6, default 3)
     * @param ttSizeMB - Transposition table size in MB (0 to disable, 0.25-256 MB, auto-scaled by level)
     * @returns Best move found by the AI
     */
    findBestMove(board: InternalBoard, level: AILevel = 3, ttSizeMB: number = 16): InternalMove | null {
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
            config.baseDepth
        );

        return result ? result.move : null;
    }

    /**
     * Get the search depth for a given AI level
     *
    * @param level - AI level (1-6)
     * @returns Depth configuration
     */
    static getLevelDepth(level: AILevel): LevelConfig {
        return LEVEL_CONFIG[level];
    }
}
