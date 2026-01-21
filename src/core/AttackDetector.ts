/**
 * Attack detection for chess positions
 *
 * This module provides fast attack detection using bitboards for:
 * - Checking if a square is under attack
 * - Detecting check and checkmate
 * - Generating attack bitboards
 */

import {
    InternalBoard,
    Bitboard,
    SquareIndex,
    Piece,
    InternalColor,
} from '../types';
import {
    getKingAttacks,
    getKnightAttacks,
    getRookAttacks,
    getBishopAttacks,
    getQueenAttacks,
    getWhitePawnAttacks,
    getBlackPawnAttacks,
} from './Position';
import { getLowestSetBit } from '../utils/conversion';

/**
 * Check if a square is attacked by a specific color
 *
 * @param board - Board to check
 * @param square - Square index to check
 * @param attackerColor - Color of attacking pieces
 * @returns true if square is attacked by attackerColor
 */
export function isSquareAttacked(
    board: InternalBoard,
    square: SquareIndex,
    attackerColor: InternalColor
): boolean {
    const attackers = attackerColor === InternalColor.WHITE ? board.whitePieces : board.blackPieces;

    // Check pawn attacks
    const pawnAttacks = attackerColor === InternalColor.WHITE
        ? getBlackPawnAttacks(square) // If white attacks, check where black pawns would be
        : getWhitePawnAttacks(square); // If black attacks, check where white pawns would be

    const pawns = attackerColor === InternalColor.WHITE ? board.whitePawns : board.blackPawns;
    if ((pawnAttacks & pawns) !== 0n) {
        return true;
    }

    // Check knight attacks
    const knightAttacks = getKnightAttacks(square);
    const knights = attackerColor === InternalColor.WHITE ? board.whiteKnights : board.blackKnights;
    if ((knightAttacks & knights) !== 0n) {
        return true;
    }

    // Check bishop and queen diagonal attacks
    const bishopAttacks = getBishopAttacks(square, board.allPieces);
    const bishops = attackerColor === InternalColor.WHITE ? board.whiteBishops : board.blackBishops;
    const queens = attackerColor === InternalColor.WHITE ? board.whiteQueens : board.blackQueens;
    if ((bishopAttacks & (bishops | queens)) !== 0n) {
        return true;
    }

    // Check rook and queen straight attacks
    const rookAttacks = getRookAttacks(square, board.allPieces);
    const rooks = attackerColor === InternalColor.WHITE ? board.whiteRooks : board.blackRooks;
    if ((rookAttacks & (rooks | queens)) !== 0n) {
        return true;
    }

    // Check king attacks
    const kingAttacks = getKingAttacks(square);
    const king = attackerColor === InternalColor.WHITE ? board.whiteKing : board.blackKing;
    if ((kingAttacks & king) !== 0n) {
        return true;
    }

    return false;
}

/**
 * Check if the current player's king is in check
 *
 * @param board - Board to check
 * @returns true if king is in check
 */
export function isKingInCheck(board: InternalBoard): boolean {
    const kingBitboard = board.turn === InternalColor.WHITE ? board.whiteKing : board.blackKing;

    if (kingBitboard === 0n) {
        return false; // No king (shouldn't happen in real game)
    }

    const kingSquare = getLowestSetBit(kingBitboard);
    const opponentColor = board.turn === InternalColor.WHITE ? InternalColor.BLACK : InternalColor.WHITE;

    return isSquareAttacked(board, kingSquare, opponentColor);
}

/**
 * Get all squares attacked by a specific color
 *
 * @param board - Board to check
 * @param attackerColor - Color of attacking pieces
 * @returns Bitboard of all attacked squares
 */
export function getAttackedSquares(board: InternalBoard, attackerColor: InternalColor): Bitboard {
    let attacked = 0n;

    // Pawn attacks
    const pawns = attackerColor === InternalColor.WHITE ? board.whitePawns : board.blackPawns;
    if (attackerColor === InternalColor.WHITE) {
        // White pawns attack north-east and north-west
        attacked |= ((pawns & 0xFEFEFEFEFEFEFEFEn) << 9n); // North-East (not on H-file)
        attacked |= ((pawns & 0x7F7F7F7F7F7F7F7Fn) << 7n); // North-West (not on A-file)
    } else {
        // Black pawns attack south-east and south-west
        attacked |= ((pawns & 0xFEFEFEFEFEFEFEFEn) >> 7n); // South-East (not on H-file)
        attacked |= ((pawns & 0x7F7F7F7F7F7F7F7Fn) >> 9n); // South-West (not on A-file)
    }

    // Knight attacks
    const knights = attackerColor === InternalColor.WHITE ? board.whiteKnights : board.blackKnights;
    let knightsBB = knights;
    while (knightsBB !== 0n) {
        const sq = getLowestSetBit(knightsBB);
        attacked |= getKnightAttacks(sq);
        knightsBB &= knightsBB - 1n; // Clear lowest bit
    }

    // Bishop attacks
    const bishops = attackerColor === InternalColor.WHITE ? board.whiteBishops : board.blackBishops;
    let bishopsBB = bishops;
    while (bishopsBB !== 0n) {
        const sq = getLowestSetBit(bishopsBB);
        attacked |= getBishopAttacks(sq, board.allPieces);
        bishopsBB &= bishopsBB - 1n;
    }

    // Rook attacks
    const rooks = attackerColor === InternalColor.WHITE ? board.whiteRooks : board.blackRooks;
    let rooksBB = rooks;
    while (rooksBB !== 0n) {
        const sq = getLowestSetBit(rooksBB);
        attacked |= getRookAttacks(sq, board.allPieces);
        rooksBB &= rooksBB - 1n;
    }

    // Queen attacks
    const queens = attackerColor === InternalColor.WHITE ? board.whiteQueens : board.blackQueens;
    let queensBB = queens;
    while (queensBB !== 0n) {
        const sq = getLowestSetBit(queensBB);
        attacked |= getQueenAttacks(sq, board.allPieces);
        queensBB &= queensBB - 1n;
    }

    // King attacks
    const king = attackerColor === InternalColor.WHITE ? board.whiteKing : board.blackKing;
    if (king !== 0n) {
        const kingSquare = getLowestSetBit(king);
        attacked |= getKingAttacks(kingSquare);
    }

    return attacked;
}

/**
 * Get all pieces attacking a specific square
 *
 * @param board - Board to check
 * @param square - Square being attacked
 * @param attackerColor - Color of attacking pieces
 * @returns Bitboard of all pieces attacking the square
 */
export function getAttackers(
    board: InternalBoard,
    square: SquareIndex,
    attackerColor: InternalColor
): Bitboard {
    let attackers = 0n;

    // Pawn attackers
    const pawnAttacks = attackerColor === InternalColor.WHITE
        ? getBlackPawnAttacks(square)
        : getWhitePawnAttacks(square);
    const pawns = attackerColor === InternalColor.WHITE ? board.whitePawns : board.blackPawns;
    attackers |= pawnAttacks & pawns;

    // Knight attackers
    const knightAttacks = getKnightAttacks(square);
    const knights = attackerColor === InternalColor.WHITE ? board.whiteKnights : board.blackKnights;
    attackers |= knightAttacks & knights;

    // Bishop and queen diagonal attackers
    const bishopAttacks = getBishopAttacks(square, board.allPieces);
    const bishops = attackerColor === InternalColor.WHITE ? board.whiteBishops : board.blackBishops;
    const queens = attackerColor === InternalColor.WHITE ? board.whiteQueens : board.blackQueens;
    attackers |= bishopAttacks & (bishops | queens);

    // Rook and queen straight attackers
    const rookAttacks = getRookAttacks(square, board.allPieces);
    const rooks = attackerColor === InternalColor.WHITE ? board.whiteRooks : board.blackRooks;
    attackers |= rookAttacks & (rooks | queens);

    // King attackers
    const kingAttacks = getKingAttacks(square);
    const king = attackerColor === InternalColor.WHITE ? board.whiteKing : board.blackKing;
    attackers |= kingAttacks & king;

    return attackers;
}

/**
 * Check if moving a piece would leave the king in check (pinned piece detection)
 *
 * @param board - Board state
 * @param from - Square piece is moving from
 * @param to - Square piece is moving to
 * @returns true if move would leave king in check
 */
export function wouldLeaveKingInCheck(
    board: InternalBoard,
    from: SquareIndex,
    to: SquareIndex
): boolean {
    const piece = board.mailbox[from];
    const capturedPiece = board.mailbox[to];
    const color = board.turn;

    // Make the move temporarily
    board.mailbox[from] = Piece.EMPTY;
    board.mailbox[to] = piece;

    // Update bitboards
    const fromBit = 1n << BigInt(from);
    const toBit = 1n << BigInt(to);
    const moveBits = fromBit | toBit;

    // Save original bitboard state
    let originalPieceBB: Bitboard;
    let originalCapturedBB: Bitboard | null = null;

    // Update piece bitboard
    switch (piece) {
        case Piece.WHITE_PAWN:
            originalPieceBB = board.whitePawns;
            board.whitePawns = (board.whitePawns & ~fromBit) | toBit;
            break;
        case Piece.WHITE_KNIGHT:
            originalPieceBB = board.whiteKnights;
            board.whiteKnights = (board.whiteKnights & ~fromBit) | toBit;
            break;
        case Piece.WHITE_BISHOP:
            originalPieceBB = board.whiteBishops;
            board.whiteBishops = (board.whiteBishops & ~fromBit) | toBit;
            break;
        case Piece.WHITE_ROOK:
            originalPieceBB = board.whiteRooks;
            board.whiteRooks = (board.whiteRooks & ~fromBit) | toBit;
            break;
        case Piece.WHITE_QUEEN:
            originalPieceBB = board.whiteQueens;
            board.whiteQueens = (board.whiteQueens & ~fromBit) | toBit;
            break;
        case Piece.WHITE_KING:
            originalPieceBB = board.whiteKing;
            board.whiteKing = (board.whiteKing & ~fromBit) | toBit;
            break;
        case Piece.BLACK_PAWN:
            originalPieceBB = board.blackPawns;
            board.blackPawns = (board.blackPawns & ~fromBit) | toBit;
            break;
        case Piece.BLACK_KNIGHT:
            originalPieceBB = board.blackKnights;
            board.blackKnights = (board.blackKnights & ~fromBit) | toBit;
            break;
        case Piece.BLACK_BISHOP:
            originalPieceBB = board.blackBishops;
            board.blackBishops = (board.blackBishops & ~fromBit) | toBit;
            break;
        case Piece.BLACK_ROOK:
            originalPieceBB = board.blackRooks;
            board.blackRooks = (board.blackRooks & ~fromBit) | toBit;
            break;
        case Piece.BLACK_QUEEN:
            originalPieceBB = board.blackQueens;
            board.blackQueens = (board.blackQueens & ~fromBit) | toBit;
            break;
        case Piece.BLACK_KING:
            originalPieceBB = board.blackKing;
            board.blackKing = (board.blackKing & ~fromBit) | toBit;
            break;
        default:
            originalPieceBB = 0n;
    }

    // Update captured piece bitboard if there's a capture
    if (capturedPiece !== Piece.EMPTY) {
        switch (capturedPiece) {
            case Piece.WHITE_PAWN:
                originalCapturedBB = board.whitePawns;
                board.whitePawns &= ~toBit;
                break;
            case Piece.WHITE_KNIGHT:
                originalCapturedBB = board.whiteKnights;
                board.whiteKnights &= ~toBit;
                break;
            case Piece.WHITE_BISHOP:
                originalCapturedBB = board.whiteBishops;
                board.whiteBishops &= ~toBit;
                break;
            case Piece.WHITE_ROOK:
                originalCapturedBB = board.whiteRooks;
                board.whiteRooks &= ~toBit;
                break;
            case Piece.WHITE_QUEEN:
                originalCapturedBB = board.whiteQueens;
                board.whiteQueens &= ~toBit;
                break;
            case Piece.BLACK_PAWN:
                originalCapturedBB = board.blackPawns;
                board.blackPawns &= ~toBit;
                break;
            case Piece.BLACK_KNIGHT:
                originalCapturedBB = board.blackKnights;
                board.blackKnights &= ~toBit;
                break;
            case Piece.BLACK_BISHOP:
                originalCapturedBB = board.blackBishops;
                board.blackBishops &= ~toBit;
                break;
            case Piece.BLACK_ROOK:
                originalCapturedBB = board.blackRooks;
                board.blackRooks &= ~toBit;
                break;
            case Piece.BLACK_QUEEN:
                originalCapturedBB = board.blackQueens;
                board.blackQueens &= ~toBit;
                break;
        }
    }

    // Update composite bitboards
    const originalWhitePieces = board.whitePieces;
    const originalBlackPieces = board.blackPieces;
    const originalAllPieces = board.allPieces;

    board.whitePieces = board.whitePawns | board.whiteKnights | board.whiteBishops |
                        board.whiteRooks | board.whiteQueens | board.whiteKing;
    board.blackPieces = board.blackPawns | board.blackKnights | board.blackBishops |
                        board.blackRooks | board.blackQueens | board.blackKing;
    board.allPieces = board.whitePieces | board.blackPieces;

    // Check if king is in check
    const inCheck = isKingInCheck(board);

    // Undo the move
    board.mailbox[from] = piece;
    board.mailbox[to] = capturedPiece;

    // Restore bitboards
    switch (piece) {
        case Piece.WHITE_PAWN: board.whitePawns = originalPieceBB; break;
        case Piece.WHITE_KNIGHT: board.whiteKnights = originalPieceBB; break;
        case Piece.WHITE_BISHOP: board.whiteBishops = originalPieceBB; break;
        case Piece.WHITE_ROOK: board.whiteRooks = originalPieceBB; break;
        case Piece.WHITE_QUEEN: board.whiteQueens = originalPieceBB; break;
        case Piece.WHITE_KING: board.whiteKing = originalPieceBB; break;
        case Piece.BLACK_PAWN: board.blackPawns = originalPieceBB; break;
        case Piece.BLACK_KNIGHT: board.blackKnights = originalPieceBB; break;
        case Piece.BLACK_BISHOP: board.blackBishops = originalPieceBB; break;
        case Piece.BLACK_ROOK: board.blackRooks = originalPieceBB; break;
        case Piece.BLACK_QUEEN: board.blackQueens = originalPieceBB; break;
        case Piece.BLACK_KING: board.blackKing = originalPieceBB; break;
    }

    if (originalCapturedBB !== null) {
        switch (capturedPiece) {
            case Piece.WHITE_PAWN: board.whitePawns = originalCapturedBB; break;
            case Piece.WHITE_KNIGHT: board.whiteKnights = originalCapturedBB; break;
            case Piece.WHITE_BISHOP: board.whiteBishops = originalCapturedBB; break;
            case Piece.WHITE_ROOK: board.whiteRooks = originalCapturedBB; break;
            case Piece.WHITE_QUEEN: board.whiteQueens = originalCapturedBB; break;
            case Piece.BLACK_PAWN: board.blackPawns = originalCapturedBB; break;
            case Piece.BLACK_KNIGHT: board.blackKnights = originalCapturedBB; break;
            case Piece.BLACK_BISHOP: board.blackBishops = originalCapturedBB; break;
            case Piece.BLACK_ROOK: board.blackRooks = originalCapturedBB; break;
            case Piece.BLACK_QUEEN: board.blackQueens = originalCapturedBB; break;
        }
    }

    board.whitePieces = originalWhitePieces;
    board.blackPieces = originalBlackPieces;
    board.allPieces = originalAllPieces;

    return inCheck;
}
