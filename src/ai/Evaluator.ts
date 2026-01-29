/**
 * Position evaluator for js-chess-engine v2
 *
 * Evaluates chess positions using material count and piece-square tables.
 * Based on v1 implementation for API parity.
 */

import { InternalBoard, Piece, InternalColor } from '../types';
import { Score } from '../types/ai.types';

// ==================== Constants ====================

/**
 * Material values (base unit = 1 pawn)
 */
const PIECE_VALUES: Record<number, number> = {
    [Piece.WHITE_PAWN]: 1,
    [Piece.WHITE_KNIGHT]: 3,
    [Piece.WHITE_BISHOP]: 3,
    [Piece.WHITE_ROOK]: 5,
    // Queen is intentionally valued a bit higher to better discourage
    // shallow-search blunders where the queen is sacrificed for minor material.
    [Piece.WHITE_QUEEN]: 12,
    [Piece.WHITE_KING]: 10,
    [Piece.BLACK_PAWN]: 1,
    [Piece.BLACK_KNIGHT]: 3,
    [Piece.BLACK_BISHOP]: 3,
    [Piece.BLACK_ROOK]: 5,
    [Piece.BLACK_QUEEN]: 12,
    [Piece.BLACK_KING]: 10,
};

/**
 * Score bounds for special positions
 */
export const SCORE_MIN = -1000;
export const SCORE_MAX = 1000;

/**
 * Material score multiplier (v1 compatibility)
 */
const PIECE_VALUE_MULTIPLIER = 10;

/**
 * Piece-square table multiplier (v1 compatibility)
 */
const PST_MULTIPLIER = 0.5;

// ==================== Piece-Square Tables ====================
// From white's perspective (rank 0 = rank 1, rank 7 = rank 8)

/**
 * Pawn piece-square table (white perspective)
 */
const PAWN_PST = [
    [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
    [5.0, 5.0, 5.0, 5.0, 5.0, 5.0, 5.0, 5.0],
    [1.0, 1.0, 2.0, 3.0, 3.0, 2.0, 1.0, 1.0],
    [0.5, 0.5, 1.0, 2.5, 2.5, 1.0, 0.5, 0.5],
    [0.0, 0.0, 0.0, 2.0, 2.0, 0.0, 0.0, 0.0],
    [0.5, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.5],
    [0.5, 0.0, 0.0, -2.0, -2.0, 0.0, 0.0, 0.5],
    [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
];

/**
 * Knight piece-square table
 */
const KNIGHT_PST = [
    [-4.0, -3.0, -2.0, -2.0, -2.0, -2.0, -3.0, -4.0],
    [-3.0, -2.0, 0.0, 0.0, 0.0, 0.0, -2.0, -3.0],
    [-2.0, 0.0, 1.0, 1.5, 1.5, 1.0, 0.0, -2.0],
    [-2.0, 0.5, 1.5, 2.0, 2.0, 1.5, 0.5, -2.0],
    [-2.0, 0.0, 1.5, 2.0, 2.0, 1.5, 0.0, -2.0],
    [-2.0, 0.5, 1.0, 1.5, 1.5, 1.0, 0.5, -2.0],
    [-3.0, -2.0, 0.0, 0.5, 0.5, 0.0, -2.0, -3.0],
    [-4.0, -3.0, -2.0, -2.0, -2.0, -2.0, -3.0, -4.0],
];

/**
 * Bishop piece-square table
 */
const BISHOP_PST = [
    [-2.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -2.0],
    [-1.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, -1.0],
    [-1.0, 0.0, 0.5, 1.0, 1.0, 0.5, 0.0, -1.0],
    [-1.0, 0.5, 0.5, 1.0, 1.0, 0.5, 0.5, -1.0],
    [-1.0, 0.0, 1.0, 1.0, 1.0, 1.0, 0.0, -1.0],
    [-1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, -1.0],
    [-1.0, 0.5, 0.0, 0.0, 0.0, 0.0, 0.5, -1.0],
    [-2.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -2.0],
];

/**
 * Rook piece-square table
 */
const ROOK_PST = [
    [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
    [0.5, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 0.5],
    [-0.5, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, -0.5],
    [-0.5, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, -0.5],
    [-0.5, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, -0.5],
    [-0.5, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, -0.5],
    [-0.5, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, -0.5],
    [0.0, 0.0, 0.0, 0.5, 0.5, 0.0, 0.0, 0.0],
];

/**
 * Queen piece-square table
 */
const QUEEN_PST = [
    [-2.0, -1.0, -1.0, -0.5, -0.5, -1.0, -1.0, -2.0],
    [-1.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, -1.0],
    [-1.0, 0.0, 0.5, 0.5, 0.5, 0.5, 0.0, -1.0],
    [-0.5, 0.0, 0.5, 0.5, 0.5, 0.5, 0.0, -0.5],
    [0.0, 0.0, 0.5, 0.5, 0.5, 0.5, 0.0, -0.5],
    [-1.0, 0.5, 0.5, 0.5, 0.5, 0.5, 0.0, -1.0],
    [-1.0, 0.0, 0.5, 0.0, 0.0, 0.0, 0.0, -1.0],
    [-2.0, -1.0, -1.0, -0.5, -0.5, -1.0, -1.0, -2.0],
];

/**
 * King piece-square table (middlegame)
 */
const KING_PST = [
    [-3.0, -4.0, -4.0, -5.0, -5.0, -4.0, -4.0, -3.0],
    [-3.0, -4.0, -4.0, -5.0, -5.0, -4.0, -4.0, -3.0],
    [-3.0, -4.0, -4.0, -5.0, -5.0, -4.0, -4.0, -3.0],
    [-3.0, -4.0, -4.0, -5.0, -5.0, -4.0, -4.0, -3.0],
    [-2.0, -3.0, -3.0, -4.0, -4.0, -3.0, -3.0, -2.0],
    [-1.0, -2.0, -2.0, -2.0, -2.0, -2.0, -2.0, -1.0],
    [2.0, 2.0, 0.0, 0.0, 0.0, 0.0, 2.0, 2.0],
    [2.0, 3.0, 1.0, 0.0, 0.0, 1.0, 3.0, 2.0],
];

/**
 * Piece-square table map
 * White pieces use tables as-is, black pieces use vertically flipped tables
 */
const PST_MAP: Record<number, number[][]> = {
    [Piece.WHITE_PAWN]: reverseTable(PAWN_PST),
    [Piece.BLACK_PAWN]: PAWN_PST,
    [Piece.WHITE_KNIGHT]: reverseTable(KNIGHT_PST),
    [Piece.BLACK_KNIGHT]: KNIGHT_PST,
    [Piece.WHITE_BISHOP]: reverseTable(BISHOP_PST),
    [Piece.BLACK_BISHOP]: BISHOP_PST,
    [Piece.WHITE_ROOK]: reverseTable(ROOK_PST),
    [Piece.BLACK_ROOK]: ROOK_PST,
    [Piece.WHITE_QUEEN]: reverseTable(QUEEN_PST),
    [Piece.BLACK_QUEEN]: QUEEN_PST,
    [Piece.WHITE_KING]: reverseTable(KING_PST),
    [Piece.BLACK_KING]: KING_PST,
};

/**
 * Reverse table vertically (for white pieces)
 */
function reverseTable(table: number[][]): number[][] {
    return table.slice().reverse();
}

// ==================== Evaluator Class ====================

export class Evaluator {
    /**
     * Evaluate a position from the perspective of the specified color
     *
     * @param board - Board to evaluate
     * @param playerColor - Color to evaluate for (positive = good for this color)
     * @param depth - Current search depth (used for mate scoring)
     * @returns Score in centipawns (positive = good for playerColor)
     */
    static evaluate(board: InternalBoard, playerColor: InternalColor, depth: number = 0): Score {
        // Check for checkmate
        if (board.isCheckmate) {
            if (board.turn === playerColor) {
                // We're in checkmate - very bad
                return SCORE_MIN + depth; // Prefer longer mates (from opponent's perspective)
            } else {
                // Opponent is in checkmate - very good
                return SCORE_MAX - depth; // Prefer shorter mates
            }
        }

        // Check for stalemate (draw)
        if (board.isStalemate) {
            return 0; // Draw is neutral
        }

        // Material + piece-square tables
        const materialScore = this.evaluateMaterial(board, playerColor);
        const positionalScore = this.evaluatePieceSquareTables(board, playerColor);

        return materialScore + positionalScore;
    }

    /**
     * Evaluate material balance
     *
     * @param board - Board to evaluate
     * @param playerColor - Color to evaluate for
     * @returns Material score
     */
    private static evaluateMaterial(board: InternalBoard, playerColor: InternalColor): Score {
        let score = 0;

        for (let square = 0; square < 64; square++) {
            const piece = board.mailbox[square];
            if (piece === Piece.EMPTY) continue;

            const pieceValue = PIECE_VALUES[piece] * PIECE_VALUE_MULTIPLIER;
            const pieceColor = piece <= Piece.WHITE_KING ? InternalColor.WHITE : InternalColor.BLACK;

            if (pieceColor === playerColor) {
                score += pieceValue;
            } else {
                score -= pieceValue;
            }
        }

        return score;
    }

    /**
     * Evaluate piece-square table bonuses
     *
     * @param board - Board to evaluate
     * @param playerColor - Color to evaluate for
     * @returns Positional score
     */
    private static evaluatePieceSquareTables(board: InternalBoard, playerColor: InternalColor): Score {
        let score = 0;

        for (let square = 0; square < 64; square++) {
            const piece = board.mailbox[square];
            if (piece === Piece.EMPTY) continue;

            const table = PST_MAP[piece];
            if (!table) continue;

            const rank = Math.floor(square / 8);
            const file = square % 8;
            const tableValue = table[rank][file] * PST_MULTIPLIER;

            const pieceColor = piece <= Piece.WHITE_KING ? InternalColor.WHITE : InternalColor.BLACK;

            if (pieceColor === playerColor) {
                score += tableValue;
            } else {
                score -= tableValue;
            }
        }

        return score;
    }

    /**
     * Get total material value on the board (used for endgame detection)
     *
     * @param board - Board to evaluate
     * @returns Total material value
     */
    static getTotalMaterialValue(board: InternalBoard): number {
        let total = 0;

        for (let square = 0; square < 64; square++) {
            const piece = board.mailbox[square];
            if (piece === Piece.EMPTY) continue;

            total += PIECE_VALUES[piece];
        }

        return total;
    }
}
