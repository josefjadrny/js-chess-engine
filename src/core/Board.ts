/**
 * Internal board representation using hybrid bitboards + mailbox
 *
 * This module provides the core board state with:
 * - Bitboards for fast attack detection and piece locations
 * - Mailbox (Int8Array) for O(1) piece lookup by square
 * - Zobrist hashing for transposition table
 * - Efficient copying and comparison
 */

import {
    InternalBoard,
    Piece,
    InternalColor,
    SquareIndex,
    Bitboard,
} from '../types';
import { TOTAL_SQUARES } from '../utils/constants';

/**
 * Create a new empty internal board
 *
 * @returns Empty board with no pieces
 */
export function createEmptyBoard(): InternalBoard {
    return {
        // Mailbox (64 squares, each can hold a piece enum value)
        mailbox: new Int8Array(TOTAL_SQUARES),

        // White piece bitboards
        whitePawns: 0n,
        whiteKnights: 0n,
        whiteBishops: 0n,
        whiteRooks: 0n,
        whiteQueens: 0n,
        whiteKing: 0n,

        // Black piece bitboards
        blackPawns: 0n,
        blackKnights: 0n,
        blackBishops: 0n,
        blackRooks: 0n,
        blackQueens: 0n,
        blackKing: 0n,

        // Composite bitboards
        whitePieces: 0n,
        blackPieces: 0n,
        allPieces: 0n,

        // Game state
        turn: InternalColor.WHITE,
        castlingRights: {
            whiteShort: true,
            blackShort: true,
            whiteLong: true,
            blackLong: true,
        },
        enPassantSquare: null,
        halfMoveClock: 0,
        fullMoveNumber: 1,

        // Zobrist hash (will be computed)
        zobristHash: 0n,

        // Game status
        isCheck: false,
        isCheckmate: false,
        isStalemate: false,
    };
}

/**
 * Create a new board for the starting position
 *
 * @returns Board set up for standard chess starting position
 */
export function createStartingBoard(): InternalBoard {
    const board = createEmptyBoard();

    // White pawns (rank 2, indices 8-15)
    for (let i = 8; i < 16; i++) {
        setPiece(board, i as SquareIndex, Piece.WHITE_PAWN);
    }

    // Black pawns (rank 7, indices 48-55)
    for (let i = 48; i < 56; i++) {
        setPiece(board, i as SquareIndex, Piece.BLACK_PAWN);
    }

    // White pieces (rank 1, indices 0-7)
    setPiece(board, 0, Piece.WHITE_ROOK);   // A1
    setPiece(board, 1, Piece.WHITE_KNIGHT); // B1
    setPiece(board, 2, Piece.WHITE_BISHOP); // C1
    setPiece(board, 3, Piece.WHITE_QUEEN);  // D1
    setPiece(board, 4, Piece.WHITE_KING);   // E1
    setPiece(board, 5, Piece.WHITE_BISHOP); // F1
    setPiece(board, 6, Piece.WHITE_KNIGHT); // G1
    setPiece(board, 7, Piece.WHITE_ROOK);   // H1

    // Black pieces (rank 8, indices 56-63)
    setPiece(board, 56, Piece.BLACK_ROOK);   // A8
    setPiece(board, 57, Piece.BLACK_KNIGHT); // B8
    setPiece(board, 58, Piece.BLACK_BISHOP); // C8
    setPiece(board, 59, Piece.BLACK_QUEEN);  // D8
    setPiece(board, 60, Piece.BLACK_KING);   // E8
    setPiece(board, 61, Piece.BLACK_BISHOP); // F8
    setPiece(board, 62, Piece.BLACK_KNIGHT); // G8
    setPiece(board, 63, Piece.BLACK_ROOK);   // H8

    // Enable castling rights for starting position
    board.castlingRights = {
        whiteShort: true,
        whiteLong: true,
        blackShort: true,
        blackLong: true,
    };

    return board;
}

/**
 * Set a piece on the board
 *
 * @param board - Board to modify
 * @param index - Square index (0-63)
 * @param piece - Piece to place
 */
export function setPiece(board: InternalBoard, index: SquareIndex, piece: Piece): void {
    // Remove any existing piece at this square first
    const existingPiece = board.mailbox[index];
    if (existingPiece !== Piece.EMPTY) {
        removePiece(board, index);
    }

    // Set piece in mailbox
    board.mailbox[index] = piece;

    if (piece === Piece.EMPTY) {
        return;
    }

    // Set bit in appropriate bitboard
    const bitboard = 1n << BigInt(index);

    switch (piece) {
        case Piece.WHITE_PAWN:
            board.whitePawns |= bitboard;
            board.whitePieces |= bitboard;
            break;
        case Piece.WHITE_KNIGHT:
            board.whiteKnights |= bitboard;
            board.whitePieces |= bitboard;
            break;
        case Piece.WHITE_BISHOP:
            board.whiteBishops |= bitboard;
            board.whitePieces |= bitboard;
            break;
        case Piece.WHITE_ROOK:
            board.whiteRooks |= bitboard;
            board.whitePieces |= bitboard;
            break;
        case Piece.WHITE_QUEEN:
            board.whiteQueens |= bitboard;
            board.whitePieces |= bitboard;
            break;
        case Piece.WHITE_KING:
            board.whiteKing |= bitboard;
            board.whitePieces |= bitboard;
            break;
        case Piece.BLACK_PAWN:
            board.blackPawns |= bitboard;
            board.blackPieces |= bitboard;
            break;
        case Piece.BLACK_KNIGHT:
            board.blackKnights |= bitboard;
            board.blackPieces |= bitboard;
            break;
        case Piece.BLACK_BISHOP:
            board.blackBishops |= bitboard;
            board.blackPieces |= bitboard;
            break;
        case Piece.BLACK_ROOK:
            board.blackRooks |= bitboard;
            board.blackPieces |= bitboard;
            break;
        case Piece.BLACK_QUEEN:
            board.blackQueens |= bitboard;
            board.blackPieces |= bitboard;
            break;
        case Piece.BLACK_KING:
            board.blackKing |= bitboard;
            board.blackPieces |= bitboard;
            break;
    }

    // Update composite bitboards
    board.allPieces = board.whitePieces | board.blackPieces;
}

/**
 * Remove a piece from the board
 *
 * @param board - Board to modify
 * @param index - Square index (0-63)
 */
export function removePiece(board: InternalBoard, index: SquareIndex): void {
    const piece = board.mailbox[index];

    if (piece === Piece.EMPTY) {
        return;
    }

    // Clear piece in mailbox
    board.mailbox[index] = Piece.EMPTY;

    // Clear bit in appropriate bitboard
    const bitboard = ~(1n << BigInt(index));

    switch (piece) {
        case Piece.WHITE_PAWN:
            board.whitePawns &= bitboard;
            board.whitePieces &= bitboard;
            break;
        case Piece.WHITE_KNIGHT:
            board.whiteKnights &= bitboard;
            board.whitePieces &= bitboard;
            break;
        case Piece.WHITE_BISHOP:
            board.whiteBishops &= bitboard;
            board.whitePieces &= bitboard;
            break;
        case Piece.WHITE_ROOK:
            board.whiteRooks &= bitboard;
            board.whitePieces &= bitboard;
            break;
        case Piece.WHITE_QUEEN:
            board.whiteQueens &= bitboard;
            board.whitePieces &= bitboard;
            break;
        case Piece.WHITE_KING:
            board.whiteKing &= bitboard;
            board.whitePieces &= bitboard;
            break;
        case Piece.BLACK_PAWN:
            board.blackPawns &= bitboard;
            board.blackPieces &= bitboard;
            break;
        case Piece.BLACK_KNIGHT:
            board.blackKnights &= bitboard;
            board.blackPieces &= bitboard;
            break;
        case Piece.BLACK_BISHOP:
            board.blackBishops &= bitboard;
            board.blackPieces &= bitboard;
            break;
        case Piece.BLACK_ROOK:
            board.blackRooks &= bitboard;
            board.blackPieces &= bitboard;
            break;
        case Piece.BLACK_QUEEN:
            board.blackQueens &= bitboard;
            board.blackPieces &= bitboard;
            break;
        case Piece.BLACK_KING:
            board.blackKing &= bitboard;
            board.blackPieces &= bitboard;
            break;
    }

    // Update composite bitboards
    board.allPieces = board.whitePieces | board.blackPieces;
}

/**
 * Get the piece at a square
 *
 * @param board - Board to query
 * @param index - Square index (0-63)
 * @returns Piece at the square
 */
export function getPiece(board: InternalBoard, index: SquareIndex): Piece {
    return board.mailbox[index] as Piece;
}

/**
 * Get the bitboard for a specific piece type
 *
 * @param board - Board to query
 * @param piece - Piece type
 * @returns Bitboard with all pieces of this type
 */
export function getBitboard(board: InternalBoard, piece: Piece): Bitboard {
    switch (piece) {
        case Piece.WHITE_PAWN: return board.whitePawns;
        case Piece.WHITE_KNIGHT: return board.whiteKnights;
        case Piece.WHITE_BISHOP: return board.whiteBishops;
        case Piece.WHITE_ROOK: return board.whiteRooks;
        case Piece.WHITE_QUEEN: return board.whiteQueens;
        case Piece.WHITE_KING: return board.whiteKing;
        case Piece.BLACK_PAWN: return board.blackPawns;
        case Piece.BLACK_KNIGHT: return board.blackKnights;
        case Piece.BLACK_BISHOP: return board.blackBishops;
        case Piece.BLACK_ROOK: return board.blackRooks;
        case Piece.BLACK_QUEEN: return board.blackQueens;
        case Piece.BLACK_KING: return board.blackKing;
        default: return 0n;
    }
}

/**
 * Copy a board (efficient struct copy)
 *
 * @param source - Source board
 * @returns New board with same state
 */
export function copyBoard(source: InternalBoard): InternalBoard {
    return {
        // Copy mailbox
        mailbox: new Int8Array(source.mailbox),

        // Copy bitboards (primitives, so direct copy)
        whitePawns: source.whitePawns,
        whiteKnights: source.whiteKnights,
        whiteBishops: source.whiteBishops,
        whiteRooks: source.whiteRooks,
        whiteQueens: source.whiteQueens,
        whiteKing: source.whiteKing,
        blackPawns: source.blackPawns,
        blackKnights: source.blackKnights,
        blackBishops: source.blackBishops,
        blackRooks: source.blackRooks,
        blackQueens: source.blackQueens,
        blackKing: source.blackKing,
        whitePieces: source.whitePieces,
        blackPieces: source.blackPieces,
        allPieces: source.allPieces,

        // Copy game state
        turn: source.turn,
        castlingRights: { ...source.castlingRights },
        enPassantSquare: source.enPassantSquare,
        halfMoveClock: source.halfMoveClock,
        fullMoveNumber: source.fullMoveNumber,
        zobristHash: source.zobristHash,
        isCheck: source.isCheck,
        isCheckmate: source.isCheckmate,
        isStalemate: source.isStalemate,
    };
}

/**
 * Check if a piece belongs to a specific color
 *
 * @param piece - Piece to check
 * @param color - Color to check
 * @returns true if piece is of the given color
 */
export function isPieceColor(piece: Piece, color: InternalColor): boolean {
    if (piece === Piece.EMPTY) {
        return false;
    }

    if (color === InternalColor.WHITE) {
        return piece >= Piece.WHITE_PAWN && piece <= Piece.WHITE_KING;
    } else {
        return piece >= Piece.BLACK_PAWN && piece <= Piece.BLACK_KING;
    }
}

/**
 * Get the color of a piece
 *
 * @param piece - Piece to check
 * @returns Color of the piece, or null if empty
 */
export function getPieceColor(piece: Piece): InternalColor | null {
    if (piece === Piece.EMPTY) {
        return null;
    }
    return piece >= Piece.WHITE_PAWN && piece <= Piece.WHITE_KING
        ? InternalColor.WHITE
        : InternalColor.BLACK;
}

/**
 * Get the opposite color
 *
 * @param color - Color
 * @returns Opposite color
 */
export function oppositeColor(color: InternalColor): InternalColor {
    return color === InternalColor.WHITE ? InternalColor.BLACK : InternalColor.WHITE;
}

/**
 * Check if a square is empty
 *
 * @param board - Board to check
 * @param index - Square index
 * @returns true if square is empty
 */
export function isSquareEmpty(board: InternalBoard, index: SquareIndex): boolean {
    return board.mailbox[index] === Piece.EMPTY;
}

/**
 * Check if a square is occupied by an enemy piece
 *
 * @param board - Board to check
 * @param index - Square index
 * @param color - Our color
 * @returns true if square has enemy piece
 */
export function isSquareEnemy(board: InternalBoard, index: SquareIndex, color: InternalColor): boolean {
    const piece = board.mailbox[index];
    if (piece === Piece.EMPTY) {
        return false;
    }
    const pieceColor = getPieceColor(piece);
    return pieceColor !== null && pieceColor !== color;
}

/**
 * Check if a square is occupied by a friendly piece
 *
 * @param board - Board to check
 * @param index - Square index
 * @param color - Our color
 * @returns true if square has friendly piece
 */
export function isSquareFriendly(board: InternalBoard, index: SquareIndex, color: InternalColor): boolean {
    const piece = board.mailbox[index];
    if (piece === Piece.EMPTY) {
        return false;
    }
    return isPieceColor(piece, color);
}
