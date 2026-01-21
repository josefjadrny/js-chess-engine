/**
 * Constants for js-chess-engine v2
 */

import { Color, Column, Row, PieceSymbol, Piece } from '../types';

// ==================== Board Constants ====================

export const BOARD_SIZE = 8;
export const TOTAL_SQUARES = 64;

export const COLUMNS: readonly Column[] = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
export const ROWS: readonly Row[] = ['1', '2', '3', '4', '5', '6', '7', '8'];

// ==================== Piece Constants ====================

export const PIECES = {
    KING_W: 'K' as const,
    QUEEN_W: 'Q' as const,
    ROOK_W: 'R' as const,
    BISHOP_W: 'B' as const,
    KNIGHT_W: 'N' as const,
    PAWN_W: 'P' as const,
    KING_B: 'k' as const,
    QUEEN_B: 'q' as const,
    ROOK_B: 'r' as const,
    BISHOP_B: 'b' as const,
    KNIGHT_B: 'n' as const,
    PAWN_B: 'p' as const,
} as const;

// ==================== Color Constants ====================

export const COLORS = {
    WHITE: 'white' as Color,
    BLACK: 'black' as Color,
};

// ==================== Piece Values (Centipawns) ====================

export const PIECE_VALUES: Record<Piece, number> = {
    [Piece.EMPTY]: 0,
    [Piece.WHITE_PAWN]: 100,
    [Piece.WHITE_KNIGHT]: 320,
    [Piece.WHITE_BISHOP]: 330,
    [Piece.WHITE_ROOK]: 500,
    [Piece.WHITE_QUEEN]: 900,
    [Piece.WHITE_KING]: 20000,
    [Piece.BLACK_PAWN]: 100,
    [Piece.BLACK_KNIGHT]: 320,
    [Piece.BLACK_BISHOP]: 330,
    [Piece.BLACK_ROOK]: 500,
    [Piece.BLACK_QUEEN]: 900,
    [Piece.BLACK_KING]: 20000,
};

// ==================== Piece-Square Tables ====================

/**
 * Piece-square tables for positional evaluation
 * From white's perspective (flipped for black)
 */

// Pawn piece-square table
export const PAWN_PST: readonly number[] = [
    0,   0,   0,   0,   0,   0,   0,   0,
    50,  50,  50,  50,  50,  50,  50,  50,
    10,  10,  20,  30,  30,  20,  10,  10,
    5,   5,   10,  25,  25,  10,  5,   5,
    0,   0,   0,   20,  20,  0,   0,   0,
    5,  -5,  -10,  0,   0,  -10, -5,   5,
    5,   10,  10, -20, -20,  10,  10,   5,
    0,   0,   0,   0,   0,   0,   0,   0
];

// Knight piece-square table
export const KNIGHT_PST: readonly number[] = [
    -50, -40, -30, -30, -30, -30, -40, -50,
    -40, -20,   0,   0,   0,   0, -20, -40,
    -30,   0,  10,  15,  15,  10,   0, -30,
    -30,   5,  15,  20,  20,  15,   5, -30,
    -30,   0,  15,  20,  20,  15,   0, -30,
    -30,   5,  10,  15,  15,  10,   5, -30,
    -40, -20,   0,   5,   5,   0, -20, -40,
    -50, -40, -30, -30, -30, -30, -40, -50
];

// Bishop piece-square table
export const BISHOP_PST: readonly number[] = [
    -20, -10, -10, -10, -10, -10, -10, -20,
    -10,   0,   0,   0,   0,   0,   0, -10,
    -10,   0,   5,  10,  10,   5,   0, -10,
    -10,   5,   5,  10,  10,   5,   5, -10,
    -10,   0,  10,  10,  10,  10,   0, -10,
    -10,  10,  10,  10,  10,  10,  10, -10,
    -10,   5,   0,   0,   0,   0,   5, -10,
    -20, -10, -10, -10, -10, -10, -10, -20
];

// Rook piece-square table
export const ROOK_PST: readonly number[] = [
    0,   0,   0,   0,   0,   0,   0,   0,
    5,  10,  10,  10,  10,  10,  10,   5,
    -5,   0,   0,   0,   0,   0,   0,  -5,
    -5,   0,   0,   0,   0,   0,   0,  -5,
    -5,   0,   0,   0,   0,   0,   0,  -5,
    -5,   0,   0,   0,   0,   0,   0,  -5,
    -5,   0,   0,   0,   0,   0,   0,  -5,
    0,   0,   0,   5,   5,   0,   0,   0
];

// Queen piece-square table
export const QUEEN_PST: readonly number[] = [
    -20, -10, -10,  -5,  -5, -10, -10, -20,
    -10,   0,   0,   0,   0,   0,   0, -10,
    -10,   0,   5,   5,   5,   5,   0, -10,
    -5,    0,   5,   5,   5,   5,   0,  -5,
    0,     0,   5,   5,   5,   5,   0,  -5,
    -10,   5,   5,   5,   5,   5,   0, -10,
    -10,   0,   5,   0,   0,   0,   0, -10,
    -20, -10, -10,  -5,  -5, -10, -10, -20
];

// King piece-square table (middlegame)
export const KING_PST_MG: readonly number[] = [
    -30, -40, -40, -50, -50, -40, -40, -30,
    -30, -40, -40, -50, -50, -40, -40, -30,
    -30, -40, -40, -50, -50, -40, -40, -30,
    -30, -40, -40, -50, -50, -40, -40, -30,
    -20, -30, -30, -40, -40, -30, -30, -20,
    -10, -20, -20, -20, -20, -20, -20, -10,
    20,  20,   0,   0,   0,   0,  20,  20,
    20,  30,  10,   0,   0,  10,  30,  20
];

// King piece-square table (endgame)
export const KING_PST_EG: readonly number[] = [
    -50, -40, -30, -20, -20, -30, -40, -50,
    -30, -20, -10,   0,   0, -10, -20, -30,
    -30, -10,  20,  30,  30,  20, -10, -30,
    -30, -10,  30,  40,  40,  30, -10, -30,
    -30, -10,  30,  40,  40,  30, -10, -30,
    -30, -10,  20,  30,  30,  20, -10, -30,
    -30, -30,   0,   0,   0,   0, -30, -30,
    -50, -30, -30, -30, -30, -30, -30, -50
];

// ==================== AI Constants ====================

export const AI_LEVELS = [0, 1, 2, 3, 4] as const;

/**
 * AI depth mapping by level
 */
export const AI_DEPTH_BY_LEVEL: Record<number, { BASE: number; EXTENDED: number }> = {
    0: { BASE: 1, EXTENDED: 2 },
    1: { BASE: 2, EXTENDED: 2 },
    2: { BASE: 3, EXTENDED: 4 }, // Increased from v1 (was 2-4)
    3: { BASE: 4, EXTENDED: 5 }, // Increased from v1 (was 3-4)
    4: { BASE: 5, EXTENDED: 6 },
};

// ==================== Score Constants ====================

export const SCORE = {
    MIN: -20000,
    MAX: 20000,
    MATE: 19000,
    DRAW: 0,
    INFINITE: 30000,
};

// ==================== Direction Offsets ====================

/**
 * Direction offsets for piece movement (0-based indexing)
 *
 * Board layout (0-63):
 * 56 57 58 59 60 61 62 63  (Rank 8)
 * 48 49 50 51 52 53 54 55  (Rank 7)
 * ...
 *  8  9 10 11 12 13 14 15  (Rank 2)
 *  0  1  2  3  4  5  6  7  (Rank 1)
 *  A  B  C  D  E  F  G  H
 */
export const DIRECTION = {
    NORTH: 8,
    SOUTH: -8,
    EAST: 1,
    WEST: -1,
    NORTH_EAST: 9,
    NORTH_WEST: 7,
    SOUTH_EAST: -7,
    SOUTH_WEST: -9,
};

// Knight move offsets
export const KNIGHT_MOVES = [
    -17, -15, -10, -6, 6, 10, 15, 17
];

// King move offsets
export const KING_MOVES = [
    -9, -8, -7, -1, 1, 7, 8, 9
];

// ==================== Castling Constants ====================

export const CASTLING = {
    WHITE_SHORT: {
        kingFrom: 4,  // E1
        kingTo: 6,    // G1
        rookFrom: 7,  // H1
        rookTo: 5,    // F1
    },
    WHITE_LONG: {
        kingFrom: 4,  // E1
        kingTo: 2,    // C1
        rookFrom: 0,  // A1
        rookTo: 3,    // D1
    },
    BLACK_SHORT: {
        kingFrom: 60, // E8
        kingTo: 62,   // G8
        rookFrom: 63, // H8
        rookTo: 61,   // F8
    },
    BLACK_LONG: {
        kingFrom: 60, // E8
        kingTo: 58,   // C8
        rookFrom: 56, // A8
        rookTo: 59,   // D8
    },
};

// ==================== Transposition Table Constants ====================

export const TT_SIZE = 1000000; // 1M entries (~100MB)

// ==================== FEN Constants ====================

export const STARTING_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

// ==================== Piece Symbol Mapping ====================

/**
 * Map internal piece enum to public piece symbol
 */
export const PIECE_TO_SYMBOL: Record<Piece, PieceSymbol | null> = {
    [Piece.EMPTY]: null,
    [Piece.WHITE_PAWN]: 'P',
    [Piece.WHITE_KNIGHT]: 'N',
    [Piece.WHITE_BISHOP]: 'B',
    [Piece.WHITE_ROOK]: 'R',
    [Piece.WHITE_QUEEN]: 'Q',
    [Piece.WHITE_KING]: 'K',
    [Piece.BLACK_PAWN]: 'p',
    [Piece.BLACK_KNIGHT]: 'n',
    [Piece.BLACK_BISHOP]: 'b',
    [Piece.BLACK_ROOK]: 'r',
    [Piece.BLACK_QUEEN]: 'q',
    [Piece.BLACK_KING]: 'k',
};

/**
 * Map public piece symbol to internal piece enum
 */
export const SYMBOL_TO_PIECE: Record<PieceSymbol, Piece> = {
    'P': Piece.WHITE_PAWN,
    'N': Piece.WHITE_KNIGHT,
    'B': Piece.WHITE_BISHOP,
    'R': Piece.WHITE_ROOK,
    'Q': Piece.WHITE_QUEEN,
    'K': Piece.WHITE_KING,
    'p': Piece.BLACK_PAWN,
    'n': Piece.BLACK_KNIGHT,
    'b': Piece.BLACK_BISHOP,
    'r': Piece.BLACK_ROOK,
    'q': Piece.BLACK_QUEEN,
    'k': Piece.BLACK_KING,
};

// ==================== Evaluation Weights ====================

export const EVAL_WEIGHTS = {
    DOUBLED_PAWN: -10,
    ISOLATED_PAWN: -20,
    PASSED_PAWN: 50,
    PAWN_CHAIN: 10,
    ROOK_OPEN_FILE: 15,
    ROOK_SEVENTH_RANK: 20,
    MOBILITY: 5,
    KING_PAWN_SHIELD: 10,
};
