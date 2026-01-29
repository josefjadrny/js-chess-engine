/**
 * AI and search-related types for js-chess-engine
 */

import { InternalMove } from './move.types';

// ==================== AI Types ====================

/**
 * AI difficulty level (1-6)
 */
export type AILevel = 1 | 2 | 3 | 4 | 5 | 6;

/**
 * Search depth
 */
export type Depth = number;

/**
 * Evaluation score (centipawns)
 * Positive = good for white, negative = good for black
 */
export type Score = number;

/**
 * Search result
 */
export interface SearchResult {
    move: InternalMove;
    score: Score;
    depth: Depth;
    nodesSearched: number;
}

/**
 * Alpha-beta search bounds
 */
export interface SearchBounds {
    alpha: Score;
    beta: Score;
}

// ==================== Transposition Table Types ====================

/**
 * Transposition table entry type
 */
export enum TTEntryType {
    EXACT = 0,      // Exact score
    LOWERBOUND = 1, // Beta cutoff (fail-high)
    UPPERBOUND = 2, // Alpha cutoff (fail-low)
}

/**
 * Transposition table entry
 */
export interface TTEntry {
    zobristHash: bigint;
    depth: Depth;
    score: Score;
    type: TTEntryType;
    bestMove: InternalMove | null;
    age: number; // For replacement strategy
}

// ==================== Move Ordering Types ====================

/**
 * Killer move table (indexed by ply)
 */
export type KillerMoves = Array<[InternalMove | null, InternalMove | null]>;

/**
 * History heuristic table
 * [from][to] -> score
 */
export type HistoryTable = number[][];

/**
 * MVV-LVA (Most Valuable Victim - Least Valuable Aggressor) score
 */
export interface MVVLVAScore {
    victim: number;
    aggressor: number;
}

// ==================== Evaluation Types ====================

/**
 * Position evaluation components
 */
export interface EvaluationComponents {
    material: Score;
    pieceSquareTables: Score;
    pawnStructure: Score;
    kingSafety: Score;
    mobility: Score;
    rookBonus: Score;
}

/**
 * Pawn structure analysis
 */
export interface PawnStructure {
    doubledPawns: number;
    isolatedPawns: number;
    passedPawns: number;
    pawnChains: number;
}

/**
 * King safety analysis
 */
export interface KingSafety {
    pawnShield: number;
    attackingPieces: number;
    attackZoneControl: number;
}
