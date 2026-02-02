/**
 * Board-related types for js-chess-engine
 */

// ==================== Public API Types ====================

/**
 * Color of a piece or player
 */
export type Color = 'white' | 'black';

/**
 * Piece notation using standard chess symbols
 * Uppercase = white, lowercase = black
 */
export type PieceSymbol = 'K' | 'Q' | 'R' | 'B' | 'N' | 'P' | 'k' | 'q' | 'r' | 'b' | 'n' | 'p';

/**
 * Piece type (without color)
 */
export type PieceType = 'king' | 'queen' | 'rook' | 'bishop' | 'knight' | 'pawn';

/**
 * Square notation (A1-H8)
 */
export type Square = string;

/**
 * Column notation (A-H)
 */
export type Column = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H';

/**
 * Row notation (1-8)
 */
export type Row = '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8';

/**
 * Castling rights configuration
 */
export interface CastlingRights {
    whiteShort: boolean;
    blackShort: boolean;
    whiteLong: boolean;
    blackLong: boolean;
}

/**
 * Public board configuration (API format)
 * Maps square strings (e.g., "E1", "A8") to piece symbols
 */
export interface BoardConfig {
    pieces: Record<Square, PieceSymbol>;
    turn: Color;
    isFinished: boolean;
    check: boolean;
    checkMate: boolean;
    staleMate: boolean;
    castling: CastlingRights;
    enPassant: Square | null;
    halfMove: number;
    fullMove: number;
}

/**
 * Move history entry
 */
export interface HistoryEntry {
    [from: Square]: Square;
}

/**
 * Possible moves map (API format)
 * Maps from-square to array of to-squares
 */
export type MovesMap = Record<Square, Square[]>;

// ==================== Internal Types ====================

/**
 * Square index (0-63)
 * 0 = A1, 7 = H1, 56 = A8, 63 = H8
 */
export type SquareIndex = number;

/**
 * Internal piece representation
 */
export enum Piece {
    EMPTY = 0,
    WHITE_PAWN = 1,
    WHITE_KNIGHT = 2,
    WHITE_BISHOP = 3,
    WHITE_ROOK = 4,
    WHITE_QUEEN = 5,
    WHITE_KING = 6,
    BLACK_PAWN = 7,
    BLACK_KNIGHT = 8,
    BLACK_BISHOP = 9,
    BLACK_ROOK = 10,
    BLACK_QUEEN = 11,
    BLACK_KING = 12,
}

/**
 * Internal color representation
 */
export enum InternalColor {
    WHITE = 0,
    BLACK = 1,
}

/**
 * Bitboard (64-bit integer for piece positions)
 */
export type Bitboard = bigint;

/**
 * Internal board state using bitboards and mailbox
 */
export interface InternalBoard {
    // Mailbox representation (64 squares)
    mailbox: Int8Array;

    // Bitboards for each piece type
    whitePawns: Bitboard;
    whiteKnights: Bitboard;
    whiteBishops: Bitboard;
    whiteRooks: Bitboard;
    whiteQueens: Bitboard;
    whiteKing: Bitboard;
    blackPawns: Bitboard;
    blackKnights: Bitboard;
    blackBishops: Bitboard;
    blackRooks: Bitboard;
    blackQueens: Bitboard;
    blackKing: Bitboard;

    // Composite bitboards
    whitePieces: Bitboard;
    blackPieces: Bitboard;
    allPieces: Bitboard;

    // Game state
    turn: InternalColor;
    castlingRights: CastlingRights;
    enPassantSquare: SquareIndex | null;
    halfMoveClock: number;
    fullMoveNumber: number;

    // Zobrist hash for transposition table
    zobristHash: bigint;

    // Game status
    isCheck: boolean;
    isCheckmate: boolean;
    isStalemate: boolean;
}

/**
 * Direction offset for piece movement
 */
export type Direction = number;

/**
 * File index (0-7 for A-H)
 */
export type FileIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

/**
 * Rank index (0-7 for 1-8)
 */
export type RankIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;
