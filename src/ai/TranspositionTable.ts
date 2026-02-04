/**
 * Transposition Table for js-chess-engine v2
 *
 * Stores previously evaluated positions to avoid re-computation.
 * Uses Zobrist hashing for position identification.
 */

import { InternalMove } from '../types';
import { Score } from '../types/ai.types';
import { SCORE_MAX, SCORE_MIN } from './Evaluator';
import { isNodeEnvironment } from '../utils/environment';

/** Threshold for detecting mate scores. */
const MATE_THRESHOLD = 500;

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
            1: 0.5, // Level 1: 0.5 MB
            2: 1,   // Level 2: 1 MB
            3: 2,   // Level 3: 2 MB (default)
            4: 8,   // Level 4: 8 MB
            5: 16,  // Level 5: 16 MB
        };
        return nodeSizes[level] ?? 2;
    } else {
        // Browser - modern-device-friendly allocation (reasonable for 2024+ devices)
        const browserSizes: Record<number, number> = {
            1: 0.25, // Level 1: 0.25 MB (ultra-lightweight)
            2: 0.5,  // Level 2: 0.5 MB (mobile-friendly)
            3: 1,    // Level 3: 1 MB (balanced default)
            4: 4,    // Level 4: 4 MB (strong performance)
            5: 8,    // Level 5: 8 MB (very strong play)
        };
        return browserSizes[level] ?? 1;
    }
}

/**
 * Normalize a mate score for TT storage by removing the current ply component.
 * Mate scores use SCORE_MIN + ply (mated) or SCORE_MAX - ply (mating).
 * We store the distance-from-this-node instead.
 */
function adjustMateScoreForStorage(score: Score, ply: number): Score {
    if (score > SCORE_MAX - MATE_THRESHOLD) return score + ply;
    if (score < SCORE_MIN + MATE_THRESHOLD) return score - ply;
    return score;
}

/**
 * Denormalize a mate score retrieved from TT by adding the current ply.
 */
function adjustMateScoreForRetrieval(score: Score, ply: number): Score {
    if (score > SCORE_MAX - MATE_THRESHOLD) return score - ply;
    if (score < SCORE_MIN + MATE_THRESHOLD) return score + ply;
    return score;
}

/**
 * Types of transposition table entries
 */
export enum TTEntryType {
    EXACT = 0,      // Exact score
    LOWER_BOUND = 1, // Alpha cutoff (fail-high)
    UPPER_BOUND = 2, // Beta cutoff (fail-low)
}

/**
 * Transposition table entry
 */
export interface TTEntry {
    zobristHash: bigint;     // Position hash
    depth: number;           // Search depth
    score: Score;            // Position score
    type: TTEntryType;       // Entry type
    bestMove: InternalMove | null; // Best move found
    age: number;             // Search age (for replacement)
}

/**
 * Transposition Table
 *
 * Implements a hash table with replacement strategy for storing
 * previously evaluated positions.
 */
export class TranspositionTable {
    private table: (TTEntry | null)[];
    private size: number;
    private currentAge: number = 0;
    private hits: number = 0;
    private misses: number = 0;

    /**
     * Create a new transposition table
     *
     * @param sizeMB - Size in megabytes (default: 16MB)
     */
    constructor(sizeMB: number = 16) {
        // Each entry is approximately 40 bytes
        const entrySize = 40;
        const bytesPerMB = 1024 * 1024;
        const totalBytes = sizeMB * bytesPerMB;

        // Use power of 2 for efficient modulo with bitwise AND
        this.size = Math.pow(2, Math.floor(Math.log2(totalBytes / entrySize)));
        this.table = new Array(this.size).fill(null);
    }

    /**
     * Store a position in the transposition table
     *
     * @param zobristHash - Position hash
     * @param depth - Search depth
     * @param score - Position score
     * @param type - Entry type
     * @param bestMove - Best move found
     */
    store(
        zobristHash: bigint,
        depth: number,
        score: Score,
        type: TTEntryType,
        bestMove: InternalMove | null,
        ply: number = 0
    ): void {
        const index = this.getIndex(zobristHash);
        const existingEntry = this.table[index];

        // Replacement strategy: always replace if:
        // 1. Slot is empty
        // 2. Same position (hash match)
        // 3. New entry has greater depth
        // 4. Entry is from previous search (old age)
        const shouldReplace =
            !existingEntry ||
            existingEntry.zobristHash === zobristHash ||
            depth >= existingEntry.depth ||
            existingEntry.age < this.currentAge;

        if (shouldReplace) {
            this.table[index] = {
                zobristHash,
                depth,
                score: adjustMateScoreForStorage(score, ply),
                type,
                bestMove,
                age: this.currentAge,
            };
        }
    }

    /**
     * Probe the transposition table
     *
     * @param zobristHash - Position hash
     * @param depth - Current search depth
     * @param alpha - Alpha bound
     * @param beta - Beta bound
     * @returns Entry if found and usable, null otherwise
     */
    probe(
        zobristHash: bigint,
        depth: number,
        alpha: Score,
        beta: Score,
        ply: number = 0
    ): TTEntry | null {
        const index = this.getIndex(zobristHash);
        const entry = this.table[index];

        // Check if entry exists and matches hash
        if (!entry || entry.zobristHash !== zobristHash) {
            this.misses++;
            return null;
        }

        // Entry must be from sufficient depth to be usable
        if (entry.depth < depth) {
            this.misses++;
            return null;
        }

        // Adjust mate scores for the current ply
        const adjustedScore = adjustMateScoreForRetrieval(entry.score, ply);

        // Count hits only when usable for pruning / exact score.
        switch (entry.type) {
            case TTEntryType.EXACT:
                this.hits++;
                return { ...entry, score: adjustedScore };

            case TTEntryType.LOWER_BOUND:
                // Fail-high (score >= beta)
                if (adjustedScore >= beta) {
                    this.hits++;
                    return { ...entry, score: adjustedScore };
                }
                break;

            case TTEntryType.UPPER_BOUND:
                // Fail-low (score <= alpha)
                if (adjustedScore <= alpha) {
                    this.hits++;
                    return { ...entry, score: adjustedScore };
                }
                break;
        }

        // Not usable for pruning, but still return for move ordering.
        return { ...entry, score: adjustedScore };
    }

    /**
     * Get best move from transposition table (for move ordering)
     *
     * @param zobristHash - Position hash
     * @returns Best move if found, null otherwise
     */
    getBestMove(zobristHash: bigint): InternalMove | null {
        const index = this.getIndex(zobristHash);
        const entry = this.table[index];

        if (entry && entry.zobristHash === zobristHash) {
            return entry.bestMove;
        }

        return null;
    }

    /**
     * Clear the transposition table
     */
    clear(): void {
        this.table.fill(null);
        this.currentAge = 0;
        this.hits = 0;
        this.misses = 0;
    }

    /**
     * Increment search age (call at start of new search)
     */
    newSearch(): void {
        this.currentAge++;
    }

    /**
     * Get index for a hash value
     *
     * @param hash - Zobrist hash
     * @returns Table index
     */
    private getIndex(hash: bigint): number {
        // Use bitwise AND for fast modulo with power of 2
        return Number(hash & BigInt(this.size - 1));
    }

    /**
     * Get cache statistics
     *
     * @returns Statistics object
     */
    getStats(): { hits: number; misses: number; hitRate: number; size: number } {
        const total = this.hits + this.misses;
        const hitRate = total > 0 ? this.hits / total : 0;

        return {
            hits: this.hits,
            misses: this.misses,
            hitRate,
            size: this.size,
        };
    }
}
