/**
 * Move-related types for js-chess-engine
 */

import { Square, SquareIndex, Piece } from './board.types';

// ==================== Public API Types ====================

/**
 * Public move representation
 */
export interface PublicMove {
    [from: Square]: Square;
}

// ==================== Internal Types ====================

/**
 * Move flags for special moves
 */
export enum MoveFlag {
    NONE = 0,
    EN_PASSANT = 1,
    CASTLING = 2,
    PROMOTION = 4,
    PAWN_DOUBLE_PUSH = 8,
    CAPTURE = 16,
}

/**
 * Promotion piece type
 */
export enum PromotionPiece {
    QUEEN = Piece.WHITE_QUEEN, // Or BLACK_QUEEN based on color
    ROOK = Piece.WHITE_ROOK,
    BISHOP = Piece.WHITE_BISHOP,
    KNIGHT = Piece.WHITE_KNIGHT,
}

/**
 * Internal move representation (compact)
 */
export interface InternalMove {
    from: SquareIndex;
    to: SquareIndex;
    piece: Piece;
    capturedPiece: Piece;
    flags: MoveFlag;
    promotionPiece?: Piece;
}

/**
 * Move with score for AI search
 */
export interface ScoredMove {
    move: InternalMove;
    score: number;
}

/**
 * Castling type
 */
export enum CastlingType {
    NONE = 0,
    WHITE_SHORT = 1,
    WHITE_LONG = 2,
    BLACK_SHORT = 3,
    BLACK_LONG = 4,
}

/**
 * Move ordering types
 */
export enum MoveOrderType {
    TT_MOVE = 1000000,      // Transposition table move
    WINNING_CAPTURE = 100000, // MVV-LVA captures with positive score
    KILLER_1 = 90000,       // First killer move
    KILLER_2 = 80000,       // Second killer move
    HISTORY = 0,            // History heuristic (0-70000 range)
    LOSING_CAPTURE = -10000, // MVV-LVA captures with negative score
}
