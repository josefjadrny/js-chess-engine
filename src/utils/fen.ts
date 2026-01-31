/**
 * FEN (Forsyth-Edwards Notation) parser and formatter
 *
 * FEN format: pieces turn castling enPassant halfMove fullMove
 * Example: rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1
 */

import { InternalBoard, Piece, InternalColor, SquareIndex } from '../types';
import { createEmptyBoard, setPiece } from '../core/Board';
import { computeZobristHash } from '../core/zobrist';
import { squareToIndex, indexToSquare } from './conversion';

const FEN_CASTLING_RE = /^(-|[KQkq]{1,4})$/;
const FEN_EN_PASSANT_RE = /^(-|[a-h][36])$/;

/**
 * Parse a FEN string into an internal board
 *
 * @param fen - FEN string
 * @returns Internal board representation
 */
export function parseFEN(fen: string): InternalBoard {
    const parts = fen.trim().split(/\s+/);

    if (parts.length !== 6) {
        throw new Error(`Invalid FEN: expected 6 parts, got ${parts.length}`);
    }

    const [piecePlacement, activeColor, castling, enPassant, halfMove, fullMove] = parts;

    const board = createEmptyBoard();

    // Parse piece placement (ranks 8 to 1, separated by /)
    const ranks = piecePlacement.split('/');
    if (ranks.length !== 8) {
        throw new Error(`Invalid FEN: expected 8 ranks, got ${ranks.length}`);
    }

    for (let rank = 0; rank < 8; rank++) {
        const rankStr = ranks[rank];
        let file = 0;

        for (const char of rankStr) {
            if (char >= '1' && char <= '8') {
                // Empty squares
                file += parseInt(char, 10);
            } else {
                // Piece
                const piece = fenCharToPiece(char);
                if (piece === null) {
                    throw new Error(`Invalid FEN: unknown piece character '${char}'`);
                }

                // Convert rank/file to square index
                // FEN ranks go from 8 to 1 (top to bottom)
                // Our indices go from 0 to 63 (bottom to top, left to right)
                const squareIndex = (7 - rank) * 8 + file;
                setPiece(board, squareIndex as SquareIndex, piece);
                file++;
            }
        }

        if (file !== 8) {
            throw new Error(`Invalid FEN: rank ${8 - rank} has ${file} files instead of 8`);
        }
    }

    // Validate piece placement has exactly one king of each color
    let whiteKings = 0;
    let blackKings = 0;
    for (const p of board.mailbox) {
        if (p === Piece.WHITE_KING) whiteKings++;
        if (p === Piece.BLACK_KING) blackKings++;
    }
    if (whiteKings !== 1 || blackKings !== 1) {
        throw new Error(`Invalid FEN: expected exactly one white king and one black king`);
    }

    // Parse active color
    if (activeColor === 'w') {
        board.turn = InternalColor.WHITE;
    } else if (activeColor === 'b') {
        board.turn = InternalColor.BLACK;
    } else {
        throw new Error(`Invalid FEN: unknown active color '${activeColor}'`);
    }

    // Validate castling rights string
    if (!FEN_CASTLING_RE.test(castling)) {
        throw new Error(`Invalid FEN: invalid castling rights '${castling}'`);
    }
    if (castling !== '-') {
        const unique = new Set(castling.split(''));
        if (unique.size !== castling.length) {
            throw new Error(`Invalid FEN: duplicate castling rights '${castling}'`);
        }
    }

    // Parse castling rights
    board.castlingRights.whiteShort = castling.includes('K');
    board.castlingRights.whiteLong = castling.includes('Q');
    board.castlingRights.blackShort = castling.includes('k');
    board.castlingRights.blackLong = castling.includes('q');

    // Parse en passant square
    if (!FEN_EN_PASSANT_RE.test(enPassant)) {
        throw new Error(`Invalid FEN: invalid en passant square '${enPassant}'`);
    }
    if (enPassant !== '-') {
        // enPassant is lowercase by regex; squareToIndex expects uppercase.
        board.enPassantSquare = squareToIndex(enPassant.toUpperCase());
    }

    // Parse half-move clock (for 50-move rule)
    board.halfMoveClock = parseInt(halfMove, 10);
    if (isNaN(board.halfMoveClock)) {
        throw new Error(`Invalid FEN: invalid half-move clock '${halfMove}'`);
    }
    if (board.halfMoveClock < 0) {
        throw new Error(`Invalid FEN: half-move clock must be >= 0`);
    }

    // Parse full move number
    board.fullMoveNumber = parseInt(fullMove, 10);
    if (isNaN(board.fullMoveNumber)) {
        throw new Error(`Invalid FEN: invalid full move number '${fullMove}'`);
    }
    if (board.fullMoveNumber < 1) {
        throw new Error(`Invalid FEN: full move number must be >= 1`);
    }

    // Keep zobristHash consistent for TT caching.
    board.zobristHash = computeZobristHash(board);

    return board;
}

/**
 * Validate a FEN string.
 *
 * This is intended for user-provided input. It throws with a descriptive message
 * when the FEN is invalid.
 */
export function validateFEN(fen: string): void {
    // parseFEN already performs full validation and throws on any error.
    parseFEN(fen);
}

/**
 * Convert an internal board to a FEN string
 *
 * @param board - Internal board
 * @returns FEN string
 */
export function toFEN(board: InternalBoard): string {
    const parts: string[] = [];

    // 1. Piece placement (ranks 8 to 1)
    const rankStrings: string[] = [];
    for (let rank = 7; rank >= 0; rank--) {
        let rankStr = '';
        let emptyCount = 0;

        for (let file = 0; file < 8; file++) {
            const squareIndex = rank * 8 + file;
            const piece = board.mailbox[squareIndex];

            if (piece === Piece.EMPTY) {
                emptyCount++;
            } else {
                if (emptyCount > 0) {
                    rankStr += emptyCount.toString();
                    emptyCount = 0;
                }
                rankStr += pieceToFenChar(piece);
            }
        }

        if (emptyCount > 0) {
            rankStr += emptyCount.toString();
        }

        rankStrings.push(rankStr);
    }
    parts.push(rankStrings.join('/'));

    // 2. Active color
    parts.push(board.turn === InternalColor.WHITE ? 'w' : 'b');

    // 3. Castling rights
    let castling = '';
    if (board.castlingRights.whiteShort) castling += 'K';
    if (board.castlingRights.whiteLong) castling += 'Q';
    if (board.castlingRights.blackShort) castling += 'k';
    if (board.castlingRights.blackLong) castling += 'q';
    parts.push(castling || '-');

    // 4. En passant square
    if (board.enPassantSquare !== null) {
        parts.push(indexToSquare(board.enPassantSquare).toLowerCase());
    } else {
        parts.push('-');
    }

    // 5. Half-move clock
    parts.push(board.halfMoveClock.toString());

    // 6. Full move number
    parts.push(board.fullMoveNumber.toString());

    return parts.join(' ');
}

/**
 * Convert a FEN character to a piece enum
 *
 * @param char - FEN character (K, Q, R, B, N, P, k, q, r, b, n, p)
 * @returns Piece enum value or null if invalid
 */
function fenCharToPiece(char: string): Piece | null {
    switch (char) {
        case 'K': return Piece.WHITE_KING;
        case 'Q': return Piece.WHITE_QUEEN;
        case 'R': return Piece.WHITE_ROOK;
        case 'B': return Piece.WHITE_BISHOP;
        case 'N': return Piece.WHITE_KNIGHT;
        case 'P': return Piece.WHITE_PAWN;
        case 'k': return Piece.BLACK_KING;
        case 'q': return Piece.BLACK_QUEEN;
        case 'r': return Piece.BLACK_ROOK;
        case 'b': return Piece.BLACK_BISHOP;
        case 'n': return Piece.BLACK_KNIGHT;
        case 'p': return Piece.BLACK_PAWN;
        default: return null;
    }
}

/**
 * Convert a piece enum to a FEN character
 *
 * @param piece - Piece enum value
 * @returns FEN character
 */
function pieceToFenChar(piece: Piece): string {
    switch (piece) {
        case Piece.WHITE_KING: return 'K';
        case Piece.WHITE_QUEEN: return 'Q';
        case Piece.WHITE_ROOK: return 'R';
        case Piece.WHITE_BISHOP: return 'B';
        case Piece.WHITE_KNIGHT: return 'N';
        case Piece.WHITE_PAWN: return 'P';
        case Piece.BLACK_KING: return 'k';
        case Piece.BLACK_QUEEN: return 'q';
        case Piece.BLACK_ROOK: return 'r';
        case Piece.BLACK_BISHOP: return 'b';
        case Piece.BLACK_KNIGHT: return 'n';
        case Piece.BLACK_PAWN: return 'p';
        default: return '';
    }
}

/**
 * Get FEN for starting position
 *
 * @returns FEN string for standard chess starting position
 */
export function getStartingFEN(): string {
    return 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
}
