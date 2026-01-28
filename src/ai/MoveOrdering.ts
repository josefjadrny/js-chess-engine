/**
 * Move ordering for js-chess-engine v2
 *
 * Orders moves to improve alpha-beta pruning efficiency.
 * Better move ordering = more cutoffs = faster search.
 */

import { InternalMove, Piece, MoveFlag } from '../types';

/**
 * Piece values for MVV-LVA (Most Valuable Victim - Least Valuable Attacker)
 */
const MVV_LVA_VALUES: Record<Piece, number> = {
    [Piece.EMPTY]: 0,
    [Piece.WHITE_PAWN]: 1,
    [Piece.BLACK_PAWN]: 1,
    [Piece.WHITE_KNIGHT]: 3,
    [Piece.BLACK_KNIGHT]: 3,
    [Piece.WHITE_BISHOP]: 3,
    [Piece.BLACK_BISHOP]: 3,
    [Piece.WHITE_ROOK]: 5,
    [Piece.BLACK_ROOK]: 5,
    [Piece.WHITE_QUEEN]: 9,
    [Piece.BLACK_QUEEN]: 9,
    [Piece.WHITE_KING]: 10,
    [Piece.BLACK_KING]: 10,
};

/**
 * Move ordering scores
 */
const SCORE_PV_MOVE = 1000000;          // PV move (from transposition table)
const SCORE_WINNING_CAPTURE = 900000;   // Captures with positive SEE
const SCORE_QUEEN_PROMOTION = 800000;   // Queen promotion
const SCORE_KILLER_MOVE = 700000;       // Killer move
const SCORE_LOSING_CAPTURE = -100000;   // Captures with negative SEE (bad)

/**
 * Killer moves storage
 * Stores moves that caused beta cutoffs at each ply
 */
export class KillerMoves {
    private killers: (InternalMove | null)[][];
    private maxPly: number = 64;

    constructor() {
        // Store 2 killer moves per ply
        this.killers = Array.from({ length: this.maxPly }, () => [null, null]);
    }

    /**
     * Store a killer move
     *
     * @param move - Move that caused beta cutoff
     * @param ply - Current ply
     */
    store(move: InternalMove, ply: number): void {
        if (ply >= this.maxPly) return;

        // Don't store captures as killers (they're ordered separately)
        if (move.flags & MoveFlag.CAPTURE) return;

        const moves = this.killers[ply];

        // Don't duplicate
        if (this.isSameMove(moves[0], move)) return;

        // Shift and insert (keep 2 most recent)
        moves[1] = moves[0];
        moves[0] = move;
    }

    /**
     * Check if a move is a killer move
     *
     * @param move - Move to check
     * @param ply - Current ply
     * @returns true if killer move
     */
    isKiller(move: InternalMove, ply: number): boolean {
        if (ply >= this.maxPly) return false;

        const moves = this.killers[ply];
        return this.isSameMove(moves[0], move) || this.isSameMove(moves[1], move);
    }

    /**
     * Clear all killer moves
     */
    clear(): void {
        this.killers = Array.from({ length: this.maxPly }, () => [null, null]);
    }

    /**
     * Check if two moves are the same
     */
    private isSameMove(m1: InternalMove | null, m2: InternalMove | null): boolean {
        if (!m1 || !m2) return false;
        return m1.from === m2.from && m1.to === m2.to;
    }
}

/**
 * Calculate MVV-LVA score for a capture
 *
 * @param capturedPiece - Piece being captured
 * @param attackerPiece - Piece doing the capture
 * @returns MVV-LVA score (higher = better)
 */
function getMVVLVAScore(capturedPiece: Piece, attackerPiece: Piece): number {
    const victimValue = MVV_LVA_VALUES[capturedPiece] || 0;
    const attackerValue = MVV_LVA_VALUES[attackerPiece] || 0;

    // Most valuable victim first, then least valuable attacker
    // Multiply victim value by 10 to prioritize victim over attacker
    return victimValue * 10 - attackerValue;
}

/**
 * Score a move for ordering
 *
 * @param move - Move to score
 * @param pvMove - PV move from transposition table (if any)
 * @param killerMoves - Killer moves instance
 * @param ply - Current ply
 * @returns Move score (higher = better)
 */
export function scoreMove(
    move: InternalMove,
    pvMove: InternalMove | null,
    killerMoves: KillerMoves | null,
    ply: number
): number {
    // 1. PV move (from transposition table) - highest priority
    if (pvMove && move.from === pvMove.from && move.to === pvMove.to) {
        return SCORE_PV_MOVE;
    }

    // 2. Queen promotions
    if (
        (move.flags & MoveFlag.PROMOTION) &&
        (move.promotionPiece === Piece.WHITE_QUEEN || move.promotionPiece === Piece.BLACK_QUEEN)
    ) {
        return SCORE_QUEEN_PROMOTION;
    }

    // 3. Captures - use MVV-LVA
    if (move.flags & MoveFlag.CAPTURE) {
        const mvvLvaScore = getMVVLVAScore(move.capturedPiece, move.piece);

        // Winning captures (capturing more valuable piece)
        if (mvvLvaScore > 0) {
            return SCORE_WINNING_CAPTURE + mvvLvaScore;
        }

        // Equal captures (e.g., pawn takes pawn)
        if (mvvLvaScore === 0) {
            return SCORE_WINNING_CAPTURE;
        }

        // Losing captures (capturing less valuable piece) - usually bad
        return SCORE_LOSING_CAPTURE + mvvLvaScore;
    }

    // 4. Killer moves (non-captures that caused beta cutoff)
    if (killerMoves && killerMoves.isKiller(move, ply)) {
        return SCORE_KILLER_MOVE;
    }

    // 5. All other moves get neutral score
    return 0;
}

/**
 * Order moves for search
 *
 * @param moves - Moves to order
 * @param pvMove - PV move from transposition table (if any)
 * @param killerMoves - Killer moves instance
 * @param ply - Current ply
 * @returns Ordered moves (best first)
 */
export function orderMoves(
    moves: InternalMove[],
    pvMove: InternalMove | null = null,
    killerMoves: KillerMoves | null = null,
    ply: number = 0
): InternalMove[] {
    // Score all moves
    const scoredMoves = moves.map(move => ({
        move,
        score: scoreMove(move, pvMove, killerMoves, ply),
    }));

    // Sort by score (descending - highest first)
    scoredMoves.sort((a, b) => b.score - a.score);

    // Return ordered moves
    return scoredMoves.map(sm => sm.move);
}
