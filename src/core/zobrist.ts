/**
 * Zobrist hashing for position identification
 *
 * Zobrist hashing provides a fast way to uniquely identify board positions
 * for use in the transposition table. Each piece on each square gets a random
 * 64-bit number, and the hash is the XOR of all piece positions plus state.
 */

import { Piece, SquareIndex, InternalColor, InternalBoard } from '../types';
import { TOTAL_SQUARES } from '../utils/constants';

// ==================== Zobrist Key Tables ====================

/**
 * Random 64-bit numbers for Zobrist hashing
 * [piece][square] -> random bigint
 */
let pieceKeys: bigint[][] = [];

/**
 * Random number for side to move (white)
 */
let sideKey: bigint = 0n;

/**
 * Random numbers for castling rights
 * [0] = white short, [1] = white long, [2] = black short, [3] = black long
 */
let castlingKeys: bigint[] = [];

/**
 * Random numbers for en passant file
 * [file] -> random bigint (8 files)
 */
let enPassantKeys: bigint[] = [];

/**
 * Flag to check if Zobrist keys are initialized
 */
let initialized = false;

// ==================== Initialization ====================

/**
 * Initialize Zobrist hash tables with random 64-bit numbers
 *
 * This should be called once at startup. Uses a simple PRNG seeded
 * with a fixed value for deterministic hashing.
 */
export function initZobrist(): void {
    if (initialized) {
        return;
    }

    // Initialize pseudo-random number generator with seed
    let seed = 12345n;
    const rand64 = (): bigint => {
        // Simple XORShift64 PRNG
        seed ^= seed << 13n;
        seed ^= seed >> 7n;
        seed ^= seed << 17n;
        return seed;
    };

    // Initialize piece keys [piece type][square]
    pieceKeys = [];
    for (let piece = 0; piece <= 12; piece++) {
        pieceKeys[piece] = [];
        for (let square = 0; square < TOTAL_SQUARES; square++) {
            pieceKeys[piece][square] = rand64();
        }
    }

    // Initialize side key (for white to move)
    sideKey = rand64();

    // Initialize castling keys
    castlingKeys = [
        rand64(), // white short
        rand64(), // white long
        rand64(), // black short
        rand64(), // black long
    ];

    // Initialize en passant keys (one per file)
    enPassantKeys = [];
    for (let file = 0; file < 8; file++) {
        enPassantKeys[file] = rand64();
    }

    initialized = true;
}

// ==================== Hash Computation ====================

/**
 * Compute the Zobrist hash for a board position
 *
 * @param board - Board to hash
 * @returns 64-bit Zobrist hash
 */
export function computeZobristHash(board: InternalBoard): bigint {
    if (!initialized) {
        initZobrist();
    }

    let hash = 0n;

    // XOR piece positions
    for (let square = 0; square < TOTAL_SQUARES; square++) {
        const piece = board.mailbox[square];
        if (piece !== Piece.EMPTY) {
            hash ^= pieceKeys[piece][square];
        }
    }

    // XOR side to move (if white)
    if (board.turn === InternalColor.WHITE) {
        hash ^= sideKey;
    }

    // XOR castling rights
    if (board.castlingRights.whiteShort) {
        hash ^= castlingKeys[0];
    }
    if (board.castlingRights.whiteLong) {
        hash ^= castlingKeys[1];
    }
    if (board.castlingRights.blackShort) {
        hash ^= castlingKeys[2];
    }
    if (board.castlingRights.blackLong) {
        hash ^= castlingKeys[3];
    }

    // XOR en passant square
    if (board.enPassantSquare !== null) {
        const file = board.enPassantSquare % 8;
        hash ^= enPassantKeys[file];
    }

    return hash;
}

/**
 * Update hash after moving a piece
 *
 * This is more efficient than recomputing the entire hash.
 *
 * @param hash - Current hash
 * @param piece - Piece being moved
 * @param from - Source square
 * @param to - Destination square
 * @returns Updated hash
 */
export function updateHashMove(
    hash: bigint,
    piece: Piece,
    from: SquareIndex,
    to: SquareIndex
): bigint {
    if (!initialized) {
        initZobrist();
    }

    // Remove piece from old square
    hash ^= pieceKeys[piece][from];

    // Add piece to new square
    hash ^= pieceKeys[piece][to];

    return hash;
}

/**
 * Update hash after capturing a piece
 *
 * @param hash - Current hash
 * @param capturedPiece - Piece being captured
 * @param square - Square where capture occurred
 * @returns Updated hash
 */
export function updateHashCapture(
    hash: bigint,
    capturedPiece: Piece,
    square: SquareIndex
): bigint {
    if (!initialized) {
        initZobrist();
    }

    // Remove captured piece
    hash ^= pieceKeys[capturedPiece][square];

    return hash;
}

/**
 * Toggle side to move in hash
 *
 * @param hash - Current hash
 * @returns Updated hash with toggled side
 */
export function toggleSide(hash: bigint): bigint {
    if (!initialized) {
        initZobrist();
    }

    return hash ^ sideKey;
}

/**
 * Update hash for castling rights change
 *
 * @param hash - Current hash
 * @param whiteShortOld - Old white short castling right
 * @param whiteShortNew - New white short castling right
 * @param whiteLongOld - Old white long castling right
 * @param whiteLongNew - New white long castling right
 * @param blackShortOld - Old black short castling right
 * @param blackShortNew - New black short castling right
 * @param blackLongOld - Old black long castling right
 * @param blackLongNew - New black long castling right
 * @returns Updated hash
 */
export function updateHashCastling(
    hash: bigint,
    whiteShortOld: boolean,
    whiteShortNew: boolean,
    whiteLongOld: boolean,
    whiteLongNew: boolean,
    blackShortOld: boolean,
    blackShortNew: boolean,
    blackLongOld: boolean,
    blackLongNew: boolean
): bigint {
    if (!initialized) {
        initZobrist();
    }

    // XOR out old castling rights
    if (whiteShortOld) hash ^= castlingKeys[0];
    if (whiteLongOld) hash ^= castlingKeys[1];
    if (blackShortOld) hash ^= castlingKeys[2];
    if (blackLongOld) hash ^= castlingKeys[3];

    // XOR in new castling rights
    if (whiteShortNew) hash ^= castlingKeys[0];
    if (whiteLongNew) hash ^= castlingKeys[1];
    if (blackShortNew) hash ^= castlingKeys[2];
    if (blackLongNew) hash ^= castlingKeys[3];

    return hash;
}

/**
 * Update hash for en passant square change
 *
 * @param hash - Current hash
 * @param oldSquare - Old en passant square (or null)
 * @param newSquare - New en passant square (or null)
 * @returns Updated hash
 */
export function updateHashEnPassant(
    hash: bigint,
    oldSquare: SquareIndex | null,
    newSquare: SquareIndex | null
): bigint {
    if (!initialized) {
        initZobrist();
    }

    // XOR out old en passant
    if (oldSquare !== null) {
        const oldFile = oldSquare % 8;
        hash ^= enPassantKeys[oldFile];
    }

    // XOR in new en passant
    if (newSquare !== null) {
        const newFile = newSquare % 8;
        hash ^= enPassantKeys[newFile];
    }

    return hash;
}

/**
 * Add a piece to the hash
 *
 * @param hash - Current hash
 * @param piece - Piece to add
 * @param square - Square where piece is added
 * @returns Updated hash
 */
export function addPieceToHash(hash: bigint, piece: Piece, square: SquareIndex): bigint {
    if (!initialized) {
        initZobrist();
    }

    return hash ^ pieceKeys[piece][square];
}

/**
 * Remove a piece from the hash
 *
 * @param hash - Current hash
 * @param piece - Piece to remove
 * @param square - Square where piece is removed
 * @returns Updated hash
 */
export function removePieceFromHash(hash: bigint, piece: Piece, square: SquareIndex): bigint {
    if (!initialized) {
        initZobrist();
    }

    return hash ^ pieceKeys[piece][square];
}

// Initialize on module load
initZobrist();
