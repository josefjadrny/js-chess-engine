/**
 * Move generation for all piece types
 *
 * This module generates all legal moves for a given position using
 * bitboard-based algorithms for performance.
 */

import {
    InternalBoard,
    Bitboard,
    SquareIndex,
    Piece,
    InternalColor,
    InternalMove,
    MoveFlag,
} from '../types';
import {
    getKingAttacks,
    getKnightAttacks,
    getRookAttacks,
    getBishopAttacks,
    getQueenAttacks,
    shiftNorth,
    shiftSouth,
    shiftNorthEast,
    shiftNorthWest,
    shiftSouthEast,
    shiftSouthWest,
} from './Position';
import { isSquareAttacked } from './AttackDetector';
import { getLowestSetBit, bitboardToIndices, getRankIndex } from '../utils/conversion';
import { getPiece, isSquareEmpty, copyBoard, setPiece, removePiece } from './Board';
import { CASTLING } from '../utils/constants';

/**
 * Generate all legal moves for the current position
 *
 * @param board - Board state
 * @returns Array of legal moves
 */
export function generateLegalMoves(board: InternalBoard): InternalMove[] {
    const pseudoLegalMoves = generatePseudoLegalMoves(board);
    const currentColor = board.turn;

    // Check if the current player has a king
    const ourKingBitboard = currentColor === InternalColor.WHITE ? board.whiteKing : board.blackKing;
    if (ourKingBitboard === 0n) {
        // No king - return all pseudo-legal moves (for test scenarios)
        return pseudoLegalMoves;
    }

    // Filter to only legal moves
    return pseudoLegalMoves.filter(move => {
        // Special handling for castling - already checked in generation
        if (move.flags & MoveFlag.CASTLING) {
            return true;
        }

        // Make the move on a temporary board copy to check if it's legal
        const testBoard = copyBoard(board);
        const originalTurn = testBoard.turn;
        makeMove(testBoard, move);

        // After making the move, check if OUR king (the one that just moved) is in check
        // makeMove switches the turn, so we need to check the OPPOSITE color
        const kingBitboardAfter = originalTurn === InternalColor.WHITE ? testBoard.whiteKing : testBoard.blackKing;
        if (kingBitboardAfter === 0n) {
            return true; // King was captured (shouldn't happen in legal game)
        }

        const kingSquare = getLowestSetBit(kingBitboardAfter);
        const opponentColor = originalTurn === InternalColor.WHITE ? InternalColor.BLACK : InternalColor.WHITE;

        // The move is legal if our king is NOT being attacked after the move
        return !isSquareAttacked(testBoard, kingSquare, opponentColor);
    });
}

/**
 * Apply a move to a board (mutates the board)
 * Used internally for legal move checking
 *
 * @param board - Board to modify
 * @param move - Move to apply
 */
function makeMove(board: InternalBoard, move: InternalMove): void {
    // Handle castling specially
    if (move.flags & MoveFlag.CASTLING) {
        // Move the king
        removePiece(board, move.from);
        setPiece(board, move.to, move.piece);

        // Move the rook
        const color = board.turn;
        if (color === InternalColor.WHITE) {
            if (move.to === CASTLING.WHITE_SHORT.kingTo) {
                // White short castling
                removePiece(board, CASTLING.WHITE_SHORT.rookFrom as SquareIndex);
                setPiece(board, CASTLING.WHITE_SHORT.rookTo as SquareIndex, Piece.WHITE_ROOK);
            } else {
                // White long castling
                removePiece(board, CASTLING.WHITE_LONG.rookFrom as SquareIndex);
                setPiece(board, CASTLING.WHITE_LONG.rookTo as SquareIndex, Piece.WHITE_ROOK);
            }
        } else {
            if (move.to === CASTLING.BLACK_SHORT.kingTo) {
                // Black short castling
                removePiece(board, CASTLING.BLACK_SHORT.rookFrom as SquareIndex);
                setPiece(board, CASTLING.BLACK_SHORT.rookTo as SquareIndex, Piece.BLACK_ROOK);
            } else {
                // Black long castling
                removePiece(board, CASTLING.BLACK_LONG.rookFrom as SquareIndex);
                setPiece(board, CASTLING.BLACK_LONG.rookTo as SquareIndex, Piece.BLACK_ROOK);
            }
        }
    } else if (move.flags & MoveFlag.EN_PASSANT) {
        // En passant capture
        removePiece(board, move.from);
        setPiece(board, move.to, move.piece);

        // Remove the captured pawn (on different square than move.to)
        const capturedPawnSquare = board.turn === InternalColor.WHITE
            ? (move.to - 8) as SquareIndex  // Captured pawn is one rank below
            : (move.to + 8) as SquareIndex; // Captured pawn is one rank above
        removePiece(board, capturedPawnSquare);
    } else if (move.flags & MoveFlag.PROMOTION) {
        // Promotion
        removePiece(board, move.from);
        if (move.capturedPiece !== Piece.EMPTY) {
            removePiece(board, move.to);
        }
        setPiece(board, move.to, move.promotionPiece!);
    } else {
        // Normal move or capture
        removePiece(board, move.from);
        if (move.capturedPiece !== Piece.EMPTY) {
            removePiece(board, move.to);
        }
        setPiece(board, move.to, move.piece);
    }

    // Update en passant square
    if (move.flags & MoveFlag.PAWN_DOUBLE_PUSH) {
        const epSquare = board.turn === InternalColor.WHITE
            ? (move.from + 8) as SquareIndex
            : (move.from - 8) as SquareIndex;
        board.enPassantSquare = epSquare;
    } else {
        board.enPassantSquare = null;
    }

    // Switch turn (needed for isKingInCheck to check the right king)
    board.turn = board.turn === InternalColor.WHITE ? InternalColor.BLACK : InternalColor.WHITE;
}

/**
 * Generate all pseudo-legal moves (may leave king in check)
 *
 * @param board - Board state
 * @returns Array of pseudo-legal moves
 */
export function generatePseudoLegalMoves(board: InternalBoard): InternalMove[] {
    const moves: InternalMove[] = [];

    const color = board.turn;
    const friendlyPieces = color === InternalColor.WHITE ? board.whitePieces : board.blackPieces;
    const enemyPieces = color === InternalColor.WHITE ? board.blackPieces : board.whitePieces;

    // Generate moves for each piece type
    generatePawnMoves(board, moves, color, friendlyPieces, enemyPieces);
    generateKnightMoves(board, moves, color, friendlyPieces);
    generateBishopMoves(board, moves, color, friendlyPieces);
    generateRookMoves(board, moves, color, friendlyPieces);
    generateQueenMoves(board, moves, color, friendlyPieces);
    generateKingMoves(board, moves, color, friendlyPieces);
    generateCastlingMoves(board, moves, color);

    return moves;
}

/**
 * Generate pawn moves (including promotions and en passant)
 */
function generatePawnMoves(
    board: InternalBoard,
    moves: InternalMove[],
    color: InternalColor,
    _friendlyPieces: Bitboard,
    enemyPieces: Bitboard
): void {
    const pawns = color === InternalColor.WHITE ? board.whitePawns : board.blackPawns;
    const pawnPiece = color === InternalColor.WHITE ? Piece.WHITE_PAWN : Piece.BLACK_PAWN;
    const promotionRank = color === InternalColor.WHITE ? 7 : 0;

    const empty = ~board.allPieces;

    if (color === InternalColor.WHITE) {
        // Single push
        const singlePush = shiftNorth(pawns) & empty;
        const singlePushIndices = bitboardToIndices(singlePush);

        for (const to of singlePushIndices) {
            const from = (to - 8) as SquareIndex;
            const toRank = getRankIndex(to);

            // Check for promotion
            if (toRank === promotionRank) {
                // Add all promotion moves
                moves.push(createMove(from, to, pawnPiece, Piece.EMPTY, MoveFlag.PROMOTION, Piece.WHITE_QUEEN));
                moves.push(createMove(from, to, pawnPiece, Piece.EMPTY, MoveFlag.PROMOTION, Piece.WHITE_ROOK));
                moves.push(createMove(from, to, pawnPiece, Piece.EMPTY, MoveFlag.PROMOTION, Piece.WHITE_BISHOP));
                moves.push(createMove(from, to, pawnPiece, Piece.EMPTY, MoveFlag.PROMOTION, Piece.WHITE_KNIGHT));
            } else {
                moves.push(createMove(from, to, pawnPiece, Piece.EMPTY, MoveFlag.NONE));
            }
        }

        // Double push
        const doublePushSource = pawns & 0x000000000000FF00n; // Rank 2
        const doublePush = shiftNorth(shiftNorth(doublePushSource) & empty) & empty;
        const doublePushIndices = bitboardToIndices(doublePush);

        for (const to of doublePushIndices) {
            const from = (to - 16) as SquareIndex;
            moves.push(createMove(from, to, pawnPiece, Piece.EMPTY, MoveFlag.PAWN_DOUBLE_PUSH));
        }

        // Captures north-east
        const capturesNE = shiftNorthEast(pawns) & enemyPieces;
        const capturesNEIndices = bitboardToIndices(capturesNE);

        for (const to of capturesNEIndices) {
            const from = (to - 9) as SquareIndex;
            const capturedPiece = getPiece(board, to);
            const toRank = getRankIndex(to);

            if (toRank === promotionRank) {
                // Promotion capture
                moves.push(createMove(from, to, pawnPiece, capturedPiece, MoveFlag.PROMOTION | MoveFlag.CAPTURE, Piece.WHITE_QUEEN));
                moves.push(createMove(from, to, pawnPiece, capturedPiece, MoveFlag.PROMOTION | MoveFlag.CAPTURE, Piece.WHITE_ROOK));
                moves.push(createMove(from, to, pawnPiece, capturedPiece, MoveFlag.PROMOTION | MoveFlag.CAPTURE, Piece.WHITE_BISHOP));
                moves.push(createMove(from, to, pawnPiece, capturedPiece, MoveFlag.PROMOTION | MoveFlag.CAPTURE, Piece.WHITE_KNIGHT));
            } else {
                moves.push(createMove(from, to, pawnPiece, capturedPiece, MoveFlag.CAPTURE));
            }
        }

        // Captures north-west
        const capturesNW = shiftNorthWest(pawns) & enemyPieces;
        const capturesNWIndices = bitboardToIndices(capturesNW);

        for (const to of capturesNWIndices) {
            const from = (to - 7) as SquareIndex;
            const capturedPiece = getPiece(board, to);
            const toRank = getRankIndex(to);

            if (toRank === promotionRank) {
                // Promotion capture
                moves.push(createMove(from, to, pawnPiece, capturedPiece, MoveFlag.PROMOTION | MoveFlag.CAPTURE, Piece.WHITE_QUEEN));
                moves.push(createMove(from, to, pawnPiece, capturedPiece, MoveFlag.PROMOTION | MoveFlag.CAPTURE, Piece.WHITE_ROOK));
                moves.push(createMove(from, to, pawnPiece, capturedPiece, MoveFlag.PROMOTION | MoveFlag.CAPTURE, Piece.WHITE_BISHOP));
                moves.push(createMove(from, to, pawnPiece, capturedPiece, MoveFlag.PROMOTION | MoveFlag.CAPTURE, Piece.WHITE_KNIGHT));
            } else {
                moves.push(createMove(from, to, pawnPiece, capturedPiece, MoveFlag.CAPTURE));
            }
        }

        // En passant
        if (board.enPassantSquare !== null) {
            const epSquare = board.enPassantSquare;
            const epTarget = 1n << BigInt(epSquare);

            // Check if any pawn can capture en passant
            const canCaptureEP = (shiftSouthWest(epTarget) | shiftSouthEast(epTarget)) & pawns;

            if (canCaptureEP !== 0n) {
                const attackerIndices = bitboardToIndices(canCaptureEP);
                for (const from of attackerIndices) {
                    const capturedPiece = Piece.BLACK_PAWN;
                    moves.push(createMove(from, epSquare, pawnPiece, capturedPiece, MoveFlag.EN_PASSANT | MoveFlag.CAPTURE));
                }
            }
        }
    } else {
        // Black pawns (move south)

        // Single push
        const singlePush = shiftSouth(pawns) & empty;
        const singlePushIndices = bitboardToIndices(singlePush);

        for (const to of singlePushIndices) {
            const from = (to + 8) as SquareIndex;
            const toRank = getRankIndex(to);

            // Check for promotion
            if (toRank === promotionRank) {
                // Add all promotion moves
                moves.push(createMove(from, to, pawnPiece, Piece.EMPTY, MoveFlag.PROMOTION, Piece.BLACK_QUEEN));
                moves.push(createMove(from, to, pawnPiece, Piece.EMPTY, MoveFlag.PROMOTION, Piece.BLACK_ROOK));
                moves.push(createMove(from, to, pawnPiece, Piece.EMPTY, MoveFlag.PROMOTION, Piece.BLACK_BISHOP));
                moves.push(createMove(from, to, pawnPiece, Piece.EMPTY, MoveFlag.PROMOTION, Piece.BLACK_KNIGHT));
            } else {
                moves.push(createMove(from, to, pawnPiece, Piece.EMPTY, MoveFlag.NONE));
            }
        }

        // Double push
        const doublePushSource = pawns & 0x00FF000000000000n; // Rank 7
        const doublePush = shiftSouth(shiftSouth(doublePushSource) & empty) & empty;
        const doublePushIndices = bitboardToIndices(doublePush);

        for (const to of doublePushIndices) {
            const from = (to + 16) as SquareIndex;
            moves.push(createMove(from, to, pawnPiece, Piece.EMPTY, MoveFlag.PAWN_DOUBLE_PUSH));
        }

        // Captures south-east
        const capturesSE = shiftSouthEast(pawns) & enemyPieces;
        const capturesSEIndices = bitboardToIndices(capturesSE);

        for (const to of capturesSEIndices) {
            const from = (to + 7) as SquareIndex;
            const capturedPiece = getPiece(board, to);
            const toRank = getRankIndex(to);

            if (toRank === promotionRank) {
                // Promotion capture
                moves.push(createMove(from, to, pawnPiece, capturedPiece, MoveFlag.PROMOTION | MoveFlag.CAPTURE, Piece.BLACK_QUEEN));
                moves.push(createMove(from, to, pawnPiece, capturedPiece, MoveFlag.PROMOTION | MoveFlag.CAPTURE, Piece.BLACK_ROOK));
                moves.push(createMove(from, to, pawnPiece, capturedPiece, MoveFlag.PROMOTION | MoveFlag.CAPTURE, Piece.BLACK_BISHOP));
                moves.push(createMove(from, to, pawnPiece, capturedPiece, MoveFlag.PROMOTION | MoveFlag.CAPTURE, Piece.BLACK_KNIGHT));
            } else {
                moves.push(createMove(from, to, pawnPiece, capturedPiece, MoveFlag.CAPTURE));
            }
        }

        // Captures south-west
        const capturesSW = shiftSouthWest(pawns) & enemyPieces;
        const capturesSWIndices = bitboardToIndices(capturesSW);

        for (const to of capturesSWIndices) {
            const from = (to + 9) as SquareIndex;
            const capturedPiece = getPiece(board, to);
            const toRank = getRankIndex(to);

            if (toRank === promotionRank) {
                // Promotion capture
                moves.push(createMove(from, to, pawnPiece, capturedPiece, MoveFlag.PROMOTION | MoveFlag.CAPTURE, Piece.BLACK_QUEEN));
                moves.push(createMove(from, to, pawnPiece, capturedPiece, MoveFlag.PROMOTION | MoveFlag.CAPTURE, Piece.BLACK_ROOK));
                moves.push(createMove(from, to, pawnPiece, capturedPiece, MoveFlag.PROMOTION | MoveFlag.CAPTURE, Piece.BLACK_BISHOP));
                moves.push(createMove(from, to, pawnPiece, capturedPiece, MoveFlag.PROMOTION | MoveFlag.CAPTURE, Piece.BLACK_KNIGHT));
            } else {
                moves.push(createMove(from, to, pawnPiece, capturedPiece, MoveFlag.CAPTURE));
            }
        }

        // En passant
        if (board.enPassantSquare !== null) {
            const epSquare = board.enPassantSquare;
            const epTarget = 1n << BigInt(epSquare);

            // Check if any pawn can capture en passant
            const canCaptureEP = (shiftNorthWest(epTarget) | shiftNorthEast(epTarget)) & pawns;

            if (canCaptureEP !== 0n) {
                const attackerIndices = bitboardToIndices(canCaptureEP);
                for (const from of attackerIndices) {
                    const capturedPiece = Piece.WHITE_PAWN;
                    moves.push(createMove(from, epSquare, pawnPiece, capturedPiece, MoveFlag.EN_PASSANT | MoveFlag.CAPTURE));
                }
            }
        }
    }
}

/**
 * Generate knight moves
 */
function generateKnightMoves(
    board: InternalBoard,
    moves: InternalMove[],
    color: InternalColor,
    friendlyPieces: Bitboard
): void {
    const knights = color === InternalColor.WHITE ? board.whiteKnights : board.blackKnights;
    const knightPiece = color === InternalColor.WHITE ? Piece.WHITE_KNIGHT : Piece.BLACK_KNIGHT;

    let knightsBB = knights;
    while (knightsBB !== 0n) {
        const from = getLowestSetBit(knightsBB);
        const attacks = getKnightAttacks(from) & ~friendlyPieces;

        const attackIndices = bitboardToIndices(attacks);
        for (const to of attackIndices) {
            const capturedPiece = getPiece(board, to);
            const flags = capturedPiece !== Piece.EMPTY ? MoveFlag.CAPTURE : MoveFlag.NONE;
            moves.push(createMove(from, to, knightPiece, capturedPiece, flags));
        }

        knightsBB &= knightsBB - 1n; // Clear lowest bit
    }
}

/**
 * Generate bishop moves
 */
function generateBishopMoves(
    board: InternalBoard,
    moves: InternalMove[],
    color: InternalColor,
    friendlyPieces: Bitboard
): void {
    const bishops = color === InternalColor.WHITE ? board.whiteBishops : board.blackBishops;
    const bishopPiece = color === InternalColor.WHITE ? Piece.WHITE_BISHOP : Piece.BLACK_BISHOP;

    let bishopsBB = bishops;
    while (bishopsBB !== 0n) {
        const from = getLowestSetBit(bishopsBB);
        const attacks = getBishopAttacks(from, board.allPieces) & ~friendlyPieces;

        const attackIndices = bitboardToIndices(attacks);
        for (const to of attackIndices) {
            const capturedPiece = getPiece(board, to);
            const flags = capturedPiece !== Piece.EMPTY ? MoveFlag.CAPTURE : MoveFlag.NONE;
            moves.push(createMove(from, to, bishopPiece, capturedPiece, flags));
        }

        bishopsBB &= bishopsBB - 1n;
    }
}

/**
 * Generate rook moves
 */
function generateRookMoves(
    board: InternalBoard,
    moves: InternalMove[],
    color: InternalColor,
    friendlyPieces: Bitboard
): void {
    const rooks = color === InternalColor.WHITE ? board.whiteRooks : board.blackRooks;
    const rookPiece = color === InternalColor.WHITE ? Piece.WHITE_ROOK : Piece.BLACK_ROOK;

    let rooksBB = rooks;
    while (rooksBB !== 0n) {
        const from = getLowestSetBit(rooksBB);
        const attacks = getRookAttacks(from, board.allPieces) & ~friendlyPieces;

        const attackIndices = bitboardToIndices(attacks);
        for (const to of attackIndices) {
            const capturedPiece = getPiece(board, to);
            const flags = capturedPiece !== Piece.EMPTY ? MoveFlag.CAPTURE : MoveFlag.NONE;
            moves.push(createMove(from, to, rookPiece, capturedPiece, flags));
        }

        rooksBB &= rooksBB - 1n;
    }
}

/**
 * Generate queen moves
 */
function generateQueenMoves(
    board: InternalBoard,
    moves: InternalMove[],
    color: InternalColor,
    friendlyPieces: Bitboard
): void {
    const queens = color === InternalColor.WHITE ? board.whiteQueens : board.blackQueens;
    const queenPiece = color === InternalColor.WHITE ? Piece.WHITE_QUEEN : Piece.BLACK_QUEEN;

    let queensBB = queens;
    while (queensBB !== 0n) {
        const from = getLowestSetBit(queensBB);
        const attacks = getQueenAttacks(from, board.allPieces) & ~friendlyPieces;

        const attackIndices = bitboardToIndices(attacks);
        for (const to of attackIndices) {
            const capturedPiece = getPiece(board, to);
            const flags = capturedPiece !== Piece.EMPTY ? MoveFlag.CAPTURE : MoveFlag.NONE;
            moves.push(createMove(from, to, queenPiece, capturedPiece, flags));
        }

        queensBB &= queensBB - 1n;
    }
}

/**
 * Generate king moves (excluding castling)
 */
function generateKingMoves(
    board: InternalBoard,
    moves: InternalMove[],
    color: InternalColor,
    friendlyPieces: Bitboard
): void {
    const king = color === InternalColor.WHITE ? board.whiteKing : board.blackKing;
    const kingPiece = color === InternalColor.WHITE ? Piece.WHITE_KING : Piece.BLACK_KING;

    if (king === 0n) return;

    const from = getLowestSetBit(king);
    const attacks = getKingAttacks(from) & ~friendlyPieces;

    const attackIndices = bitboardToIndices(attacks);
    for (const to of attackIndices) {
        const capturedPiece = getPiece(board, to);
        const flags = capturedPiece !== Piece.EMPTY ? MoveFlag.CAPTURE : MoveFlag.NONE;
        moves.push(createMove(from, to, kingPiece, capturedPiece, flags));
    }
}

/**
 * Generate castling moves
 */
function generateCastlingMoves(
    board: InternalBoard,
    moves: InternalMove[],
    color: InternalColor
): void {
    const opponentColor = color === InternalColor.WHITE ? InternalColor.BLACK : InternalColor.WHITE;

    if (color === InternalColor.WHITE) {
        // White short castling (O-O)
        if (
            board.castlingRights.whiteShort &&
            getPiece(board, CASTLING.WHITE_SHORT.kingFrom as SquareIndex) === Piece.WHITE_KING &&
            getPiece(board, CASTLING.WHITE_SHORT.rookFrom as SquareIndex) === Piece.WHITE_ROOK &&
            isSquareEmpty(board, 5 as SquareIndex) && // F1
            isSquareEmpty(board, 6 as SquareIndex) && // G1
            !isSquareAttacked(board, 4 as SquareIndex, opponentColor) && // E1 not in check
            !isSquareAttacked(board, 5 as SquareIndex, opponentColor) && // F1 not attacked
            !isSquareAttacked(board, 6 as SquareIndex, opponentColor)    // G1 not attacked
        ) {
            moves.push(createMove(
                CASTLING.WHITE_SHORT.kingFrom as SquareIndex,
                CASTLING.WHITE_SHORT.kingTo as SquareIndex,
                Piece.WHITE_KING,
                Piece.EMPTY,
                MoveFlag.CASTLING
            ));
        }

        // White long castling (O-O-O)
        if (
            board.castlingRights.whiteLong &&
            getPiece(board, CASTLING.WHITE_LONG.kingFrom as SquareIndex) === Piece.WHITE_KING &&
            getPiece(board, CASTLING.WHITE_LONG.rookFrom as SquareIndex) === Piece.WHITE_ROOK &&
            isSquareEmpty(board, 1 as SquareIndex) && // B1
            isSquareEmpty(board, 2 as SquareIndex) && // C1
            isSquareEmpty(board, 3 as SquareIndex) && // D1
            !isSquareAttacked(board, 4 as SquareIndex, opponentColor) && // E1 not in check
            !isSquareAttacked(board, 3 as SquareIndex, opponentColor) && // D1 not attacked
            !isSquareAttacked(board, 2 as SquareIndex, opponentColor)    // C1 not attacked
        ) {
            moves.push(createMove(
                CASTLING.WHITE_LONG.kingFrom as SquareIndex,
                CASTLING.WHITE_LONG.kingTo as SquareIndex,
                Piece.WHITE_KING,
                Piece.EMPTY,
                MoveFlag.CASTLING
            ));
        }
    } else {
        // Black short castling (O-O)
        if (
            board.castlingRights.blackShort &&
            getPiece(board, CASTLING.BLACK_SHORT.kingFrom as SquareIndex) === Piece.BLACK_KING &&
            getPiece(board, CASTLING.BLACK_SHORT.rookFrom as SquareIndex) === Piece.BLACK_ROOK &&
            isSquareEmpty(board, 61 as SquareIndex) && // F8
            isSquareEmpty(board, 62 as SquareIndex) && // G8
            !isSquareAttacked(board, 60 as SquareIndex, opponentColor) && // E8 not in check
            !isSquareAttacked(board, 61 as SquareIndex, opponentColor) && // F8 not attacked
            !isSquareAttacked(board, 62 as SquareIndex, opponentColor)    // G8 not attacked
        ) {
            moves.push(createMove(
                CASTLING.BLACK_SHORT.kingFrom as SquareIndex,
                CASTLING.BLACK_SHORT.kingTo as SquareIndex,
                Piece.BLACK_KING,
                Piece.EMPTY,
                MoveFlag.CASTLING
            ));
        }

        // Black long castling (O-O-O)
        if (
            board.castlingRights.blackLong &&
            getPiece(board, CASTLING.BLACK_LONG.kingFrom as SquareIndex) === Piece.BLACK_KING &&
            getPiece(board, CASTLING.BLACK_LONG.rookFrom as SquareIndex) === Piece.BLACK_ROOK &&
            isSquareEmpty(board, 57 as SquareIndex) && // B8
            isSquareEmpty(board, 58 as SquareIndex) && // C8
            isSquareEmpty(board, 59 as SquareIndex) && // D8
            !isSquareAttacked(board, 60 as SquareIndex, opponentColor) && // E8 not in check
            !isSquareAttacked(board, 59 as SquareIndex, opponentColor) && // D8 not attacked
            !isSquareAttacked(board, 58 as SquareIndex, opponentColor)    // C8 not attacked
        ) {
            moves.push(createMove(
                CASTLING.BLACK_LONG.kingFrom as SquareIndex,
                CASTLING.BLACK_LONG.kingTo as SquareIndex,
                Piece.BLACK_KING,
                Piece.EMPTY,
                MoveFlag.CASTLING
            ));
        }
    }
}

/**
 * Helper to create a move object
 */
function createMove(
    from: SquareIndex,
    to: SquareIndex,
    piece: Piece,
    capturedPiece: Piece,
    flags: MoveFlag,
    promotionPiece?: Piece
): InternalMove {
    return {
        from,
        to,
        piece,
        capturedPiece,
        flags,
        promotionPiece,
    };
}

/**
 * Get all legal moves for a specific piece
 *
 * @param board - Board state
 * @param square - Square of the piece
 * @returns Array of legal moves for that piece
 */
export function getMovesForPiece(board: InternalBoard, square: SquareIndex): InternalMove[] {
    const allMoves = generateLegalMoves(board);
    return allMoves.filter(move => move.from === square);
}

/**
 * Check if a move is legal
 *
 * @param board - Board state
 * @param from - From square
 * @param to - To square
 * @returns true if move is legal
 */
export function isMoveLegal(board: InternalBoard, from: SquareIndex, to: SquareIndex): boolean {
    const legalMoves = generateLegalMoves(board);
    return legalMoves.some(move => move.from === from && move.to === to);
}

/**
 * Apply a move to the board with full state updates (mutates the board)
 * Updates turn, castling rights, en passant, move counters, and game status
 *
 * @param board - Board state to modify
 * @param move - Move to apply
 * @returns The applied move
 */
export function applyMoveComplete(board: InternalBoard, move: InternalMove): InternalMove {
    const { from, to, piece, capturedPiece, flags, promotionPiece } = move;

    // Reset en passant square (will be set if this is a double pawn push)
    board.enPassantSquare = null;

    // Handle captures
    if (capturedPiece !== Piece.EMPTY) {
        removePiece(board, to);
        board.halfMoveClock = 0;
    } else {
        board.halfMoveClock++;
    }

    // Handle en passant capture
    if (flags & MoveFlag.EN_PASSANT) {
        const captureSquare = board.turn === InternalColor.WHITE ? to - 8 : to + 8;
        removePiece(board, captureSquare as SquareIndex);
        board.halfMoveClock = 0;
    }

    // Handle castling
    if (flags & MoveFlag.CASTLING) {
        // Move the rook
        if (to === CASTLING.WHITE_SHORT.kingTo) {
            // White kingside
            removePiece(board, CASTLING.WHITE_SHORT.rookFrom as SquareIndex);
            setPiece(board, CASTLING.WHITE_SHORT.rookTo as SquareIndex, Piece.WHITE_ROOK);
        } else if (to === CASTLING.WHITE_LONG.kingTo) {
            // White queenside
            removePiece(board, CASTLING.WHITE_LONG.rookFrom as SquareIndex);
            setPiece(board, CASTLING.WHITE_LONG.rookTo as SquareIndex, Piece.WHITE_ROOK);
        } else if (to === CASTLING.BLACK_SHORT.kingTo) {
            // Black kingside
            removePiece(board, CASTLING.BLACK_SHORT.rookFrom as SquareIndex);
            setPiece(board, CASTLING.BLACK_SHORT.rookTo as SquareIndex, Piece.BLACK_ROOK);
        } else if (to === CASTLING.BLACK_LONG.kingTo) {
            // Black queenside
            removePiece(board, CASTLING.BLACK_LONG.rookFrom as SquareIndex);
            setPiece(board, CASTLING.BLACK_LONG.rookTo as SquareIndex, Piece.BLACK_ROOK);
        }
    }

    // Move the piece
    removePiece(board, from);

    // Handle promotion
    if (flags & MoveFlag.PROMOTION && promotionPiece) {
        setPiece(board, to, promotionPiece);
    } else {
        setPiece(board, to, piece);
    }

    // Reset half-move clock on pawn moves
    if (piece === Piece.WHITE_PAWN || piece === Piece.BLACK_PAWN) {
        board.halfMoveClock = 0;
    }

    // Handle double pawn push (set en passant square)
    if (flags & MoveFlag.PAWN_DOUBLE_PUSH) {
        const enPassantSquare = board.turn === InternalColor.WHITE ? from + 8 : from - 8;
        board.enPassantSquare = enPassantSquare as SquareIndex;
    }

    // Update castling rights
    updateCastlingRights(board, from, to, piece);

    // Switch turn
    board.turn = board.turn === InternalColor.WHITE ? InternalColor.BLACK : InternalColor.WHITE;

    // Increment full move number after black's move
    if (board.turn === InternalColor.WHITE) {
        board.fullMoveNumber++;
    }

    // Update game status (check, checkmate, stalemate)
    updateGameStatus(board);

    return move;
}

/**
 * Update castling rights after a move
 *
 * @param board - Board state
 * @param from - From square
 * @param to - To square
 * @param piece - Piece that moved
 */
function updateCastlingRights(
    board: InternalBoard,
    from: SquareIndex,
    to: SquareIndex,
    piece: Piece
): void {
    // If king moves, lose all castling rights for that color
    if (piece === Piece.WHITE_KING) {
        board.castlingRights.whiteShort = false;
        board.castlingRights.whiteLong = false;
    } else if (piece === Piece.BLACK_KING) {
        board.castlingRights.blackShort = false;
        board.castlingRights.blackLong = false;
    }

    // If rook moves from starting square, lose castling right for that side
    if (piece === Piece.WHITE_ROOK) {
        if (from === CASTLING.WHITE_SHORT.rookFrom) {
            board.castlingRights.whiteShort = false;
        } else if (from === CASTLING.WHITE_LONG.rookFrom) {
            board.castlingRights.whiteLong = false;
        }
    } else if (piece === Piece.BLACK_ROOK) {
        if (from === CASTLING.BLACK_SHORT.rookFrom) {
            board.castlingRights.blackShort = false;
        } else if (from === CASTLING.BLACK_LONG.rookFrom) {
            board.castlingRights.blackLong = false;
        }
    }

    // If rook is captured, lose castling right for that side
    if (to === CASTLING.WHITE_SHORT.rookFrom) {
        board.castlingRights.whiteShort = false;
    } else if (to === CASTLING.WHITE_LONG.rookFrom) {
        board.castlingRights.whiteLong = false;
    } else if (to === CASTLING.BLACK_SHORT.rookFrom) {
        board.castlingRights.blackShort = false;
    } else if (to === CASTLING.BLACK_LONG.rookFrom) {
        board.castlingRights.blackLong = false;
    }
}

/**
 * Update game status (check, checkmate, stalemate)
 *
 * @param board - Board state
 */
function updateGameStatus(board: InternalBoard): void {
    const currentColor = board.turn;
    const kingBitboard = currentColor === InternalColor.WHITE ? board.whiteKing : board.blackKing;

    if (kingBitboard === 0n) {
        board.isCheck = false;
        board.isCheckmate = false;
        board.isStalemate = false;
        return;
    }

    const kingSquare = getLowestSetBit(kingBitboard) as SquareIndex;
    const inCheck = isSquareAttacked(board, kingSquare, currentColor);

    board.isCheck = inCheck;

    // Check if there are any legal moves
    const legalMoves = generateLegalMoves(board);
    const hasLegalMoves = legalMoves.length > 0;

    if (!hasLegalMoves) {
        if (inCheck) {
            board.isCheckmate = true;
            board.isStalemate = false;
        } else {
            board.isCheckmate = false;
            board.isStalemate = true;
        }
    } else {
        board.isCheckmate = false;
        board.isStalemate = false;
    }
}
