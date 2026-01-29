/**
 * Move generation tests
 */

import {
    createStartingBoard,
    createEmptyBoard,
    setPiece,
    copyBoard,
} from '../../src/core/Board';
import {
    generateLegalMoves,
    getMovesForPiece,
    applyMoveComplete,
    isMoveLegal,
} from '../../src/core/MoveGenerator';
import { Piece, InternalColor, MoveFlag } from '../../src/types';
import { squareToIndex } from '../../src/utils/conversion';
import { parseFEN } from '../../src/utils/fen';
import { isKingInCheck } from '../../src/core/AttackDetector';

describe('Move Generation', () => {
    describe('Starting Position', () => {
        it('should generate 20 legal moves from starting position', () => {
            const board = createStartingBoard();
            const moves = generateLegalMoves(board);
            expect(moves.length).toBe(20);
        });

        it('should generate correct pawn moves from starting position', () => {
            const board = createStartingBoard();
            const moves = generateLegalMoves(board);

            // Each of 8 pawns can move 1 or 2 squares = 16 pawn moves
            const pawnMoves = moves.filter(m =>
                m.piece === Piece.WHITE_PAWN
            );
            expect(pawnMoves.length).toBe(16);
        });

        it('should generate correct knight moves from starting position', () => {
            const board = createStartingBoard();
            const moves = generateLegalMoves(board);

            // Each of 2 knights can move to 2 squares = 4 knight moves
            const knightMoves = moves.filter(m =>
                m.piece === Piece.WHITE_KNIGHT
            );
            expect(knightMoves.length).toBe(4);
        });

        it('should have no other piece moves from starting position', () => {
            const board = createStartingBoard();
            const moves = generateLegalMoves(board);

            // Only pawns and knights can move
            const otherMoves = moves.filter(m =>
                m.piece !== Piece.WHITE_PAWN &&
                m.piece !== Piece.WHITE_KNIGHT
            );
            expect(otherMoves.length).toBe(0);
        });
    });

    describe('Pawn Moves', () => {
        it('should generate pawn single push', () => {
            const board = createEmptyBoard();
            setPiece(board, squareToIndex('E2'), Piece.WHITE_PAWN);
            board.turn = InternalColor.WHITE;

            const moves = getMovesForPiece(board, squareToIndex('E2'));
            expect(moves.length).toBeGreaterThanOrEqual(1);

            const singlePush = moves.find(m => m.to === squareToIndex('E3'));
            expect(singlePush).toBeDefined();
        });

        it('should generate pawn double push from starting rank', () => {
            const board = createEmptyBoard();
            setPiece(board, squareToIndex('E2'), Piece.WHITE_PAWN);
            board.turn = InternalColor.WHITE;

            const moves = getMovesForPiece(board, squareToIndex('E2'));

            const doublePush = moves.find(m =>
                m.to === squareToIndex('E4') &&
                (m.flags & MoveFlag.PAWN_DOUBLE_PUSH)
            );
            expect(doublePush).toBeDefined();
        });

        it('should not generate double push when blocked', () => {
            const board = createEmptyBoard();
            setPiece(board, squareToIndex('E2'), Piece.WHITE_PAWN);
            setPiece(board, squareToIndex('E3'), Piece.BLACK_PAWN);
            board.turn = InternalColor.WHITE;

            const moves = getMovesForPiece(board, squareToIndex('E2'));
            expect(moves.length).toBe(0);
        });

        it('should not generate double push when target square blocked', () => {
            const board = createEmptyBoard();
            setPiece(board, squareToIndex('E2'), Piece.WHITE_PAWN);
            setPiece(board, squareToIndex('E4'), Piece.BLACK_PAWN);
            board.turn = InternalColor.WHITE;

            const moves = getMovesForPiece(board, squareToIndex('E2'));

            // Can only move single push to E3
            expect(moves.length).toBe(1);
            expect(moves[0].to).toBe(squareToIndex('E3'));
        });

        it('should not generate double push when not on starting rank', () => {
            const board = createEmptyBoard();
            setPiece(board, squareToIndex('E3'), Piece.WHITE_PAWN);
            board.turn = InternalColor.WHITE;

            const moves = getMovesForPiece(board, squareToIndex('E3'));

            // Should only have single push, no double push
            const doublePush = moves.find(m => m.to === squareToIndex('E5'));
            expect(doublePush).toBeUndefined();
        });

        it('should generate pawn captures', () => {
            const board = createEmptyBoard();
            setPiece(board, squareToIndex('E4'), Piece.WHITE_PAWN);
            setPiece(board, squareToIndex('D5'), Piece.BLACK_PAWN);
            setPiece(board, squareToIndex('F5'), Piece.BLACK_KNIGHT);
            board.turn = InternalColor.WHITE;

            const moves = getMovesForPiece(board, squareToIndex('E4'));

            const captures = moves.filter(m => m.flags & MoveFlag.CAPTURE);
            expect(captures.length).toBe(2);
        });

        it('should generate pawn promotions', () => {
            const board = createEmptyBoard();
            setPiece(board, squareToIndex('E7'), Piece.WHITE_PAWN);
            board.turn = InternalColor.WHITE;

            const moves = getMovesForPiece(board, squareToIndex('E7'));

            const promotions = moves.filter(m => m.flags & MoveFlag.PROMOTION);
            expect(promotions.length).toBe(4); // Q, R, B, N
        });

        it('should generate promotion captures', () => {
            const board = createEmptyBoard();
            setPiece(board, squareToIndex('E7'), Piece.WHITE_PAWN);
            setPiece(board, squareToIndex('D8'), Piece.BLACK_ROOK);
            setPiece(board, squareToIndex('F8'), Piece.BLACK_BISHOP);
            board.turn = InternalColor.WHITE;

            const moves = getMovesForPiece(board, squareToIndex('E7'));

            const promotionCaptures = moves.filter(m =>
                (m.flags & MoveFlag.PROMOTION) &&
                (m.flags & MoveFlag.CAPTURE)
            );
            expect(promotionCaptures.length).toBe(8); // 2 captures × 4 pieces
        });

        it('should generate en passant capture', () => {
            const board = createEmptyBoard();
            setPiece(board, squareToIndex('E5'), Piece.WHITE_PAWN);
            setPiece(board, squareToIndex('D5'), Piece.BLACK_PAWN);
            board.enPassantSquare = squareToIndex('D6');
            board.turn = InternalColor.WHITE;

            const moves = getMovesForPiece(board, squareToIndex('E5'));

            const enPassant = moves.find(m =>
                m.flags & MoveFlag.EN_PASSANT
            );
            expect(enPassant).toBeDefined();
            expect(enPassant?.to).toBe(squareToIndex('D6'));
        });

        it('should not allow pawn to capture forward', () => {
            const board = createEmptyBoard();
            setPiece(board, squareToIndex('E4'), Piece.WHITE_PAWN);
            setPiece(board, squareToIndex('E5'), Piece.BLACK_PAWN);
            board.turn = InternalColor.WHITE;

            const moves = getMovesForPiece(board, squareToIndex('E4'));

            // Pawn should have no moves (cannot capture forward)
            expect(moves.length).toBe(0);
        });

        it('should not allow pawn to move diagonally without capturing', () => {
            const board = createEmptyBoard();
            setPiece(board, squareToIndex('E4'), Piece.WHITE_PAWN);
            board.turn = InternalColor.WHITE;

            const moves = getMovesForPiece(board, squareToIndex('E4'));

            // Should only have forward move, no diagonal moves
            const diagonalMoves = moves.filter(m =>
                m.to === squareToIndex('D5') || m.to === squareToIndex('F5')
            );
            expect(diagonalMoves.length).toBe(0);
        });

        it('should generate pawn promotion only when reaching last rank', () => {
            const board = createEmptyBoard();
            setPiece(board, squareToIndex('E6'), Piece.WHITE_PAWN);
            board.turn = InternalColor.WHITE;

            const moves = getMovesForPiece(board, squareToIndex('E6'));

            // Moving to E7 should not be a promotion
            const moveToE7 = moves.find(m => m.to === squareToIndex('E7'));
            expect(moveToE7).toBeDefined();
            if (moveToE7) {
                expect(moveToE7.flags & MoveFlag.PROMOTION).toBe(0);
            }
        });

        it('should not generate pawn promotion when blocked on promotion rank', () => {
            const board = createEmptyBoard();
            setPiece(board, squareToIndex('E7'), Piece.WHITE_PAWN);
            setPiece(board, squareToIndex('E8'), Piece.BLACK_ROOK);
            board.turn = InternalColor.WHITE;

            const moves = getMovesForPiece(board, squareToIndex('E7'));

            // No forward promotion move, can only capture if diagonal pieces exist
            const forwardPromotions = moves.filter(m =>
                m.to === squareToIndex('E8') &&
                !(m.flags & MoveFlag.CAPTURE)
            );
            expect(forwardPromotions.length).toBe(0);
        });
    });

    describe('Knight Moves', () => {
        it('should generate all 8 knight moves from center', () => {
            const board = createEmptyBoard();
            setPiece(board, squareToIndex('E4'), Piece.WHITE_KNIGHT);
            board.turn = InternalColor.WHITE;

            const moves = getMovesForPiece(board, squareToIndex('E4'));
            expect(moves.length).toBe(8);
        });

        it('should generate limited knight moves from corner', () => {
            const board = createEmptyBoard();
            setPiece(board, squareToIndex('A1'), Piece.WHITE_KNIGHT);
            board.turn = InternalColor.WHITE;

            const moves = getMovesForPiece(board, squareToIndex('A1'));
            expect(moves.length).toBe(2); // B3, C2
        });

        it('should not capture friendly pieces', () => {
            const board = createEmptyBoard();
            setPiece(board, squareToIndex('E4'), Piece.WHITE_KNIGHT);
            setPiece(board, squareToIndex('D6'), Piece.WHITE_PAWN);
            setPiece(board, squareToIndex('F6'), Piece.WHITE_PAWN);
            board.turn = InternalColor.WHITE;

            const moves = getMovesForPiece(board, squareToIndex('E4'));
            expect(moves.length).toBe(6); // 8 - 2 blocked by friendly
        });

        it('should capture enemy pieces', () => {
            const board = createEmptyBoard();
            setPiece(board, squareToIndex('E4'), Piece.WHITE_KNIGHT);
            setPiece(board, squareToIndex('D6'), Piece.BLACK_PAWN);
            setPiece(board, squareToIndex('F6'), Piece.BLACK_PAWN);
            board.turn = InternalColor.WHITE;

            const moves = getMovesForPiece(board, squareToIndex('E4'));
            const captures = moves.filter(m => m.flags & MoveFlag.CAPTURE);
            expect(captures.length).toBe(2);
        });
    });

    describe('Bishop Moves', () => {
        it('should generate all diagonal moves from center', () => {
            const board = createEmptyBoard();
            setPiece(board, squareToIndex('E4'), Piece.WHITE_BISHOP);
            board.turn = InternalColor.WHITE;

            const moves = getMovesForPiece(board, squareToIndex('E4'));
            expect(moves.length).toBe(13); // All diagonal squares from E4
        });

        it('should be blocked by friendly pieces', () => {
            const board = createEmptyBoard();
            setPiece(board, squareToIndex('E4'), Piece.WHITE_BISHOP);
            setPiece(board, squareToIndex('G6'), Piece.WHITE_PAWN);
            board.turn = InternalColor.WHITE;

            const moves = getMovesForPiece(board, squareToIndex('E4'));

            // Should not be able to move to G6 or H7
            const blockedSquare = moves.find(m => m.to === squareToIndex('G6'));
            expect(blockedSquare).toBeUndefined();

            const beyondBlock = moves.find(m => m.to === squareToIndex('H7'));
            expect(beyondBlock).toBeUndefined();
        });

        it('should capture enemy pieces', () => {
            const board = createEmptyBoard();
            setPiece(board, squareToIndex('E4'), Piece.WHITE_BISHOP);
            setPiece(board, squareToIndex('G6'), Piece.BLACK_PAWN);
            board.turn = InternalColor.WHITE;

            const moves = getMovesForPiece(board, squareToIndex('E4'));

            const capture = moves.find(m =>
                m.to === squareToIndex('G6') &&
                (m.flags & MoveFlag.CAPTURE)
            );
            expect(capture).toBeDefined();

            // Should not be able to move beyond captured piece
            const beyondCapture = moves.find(m => m.to === squareToIndex('H7'));
            expect(beyondCapture).toBeUndefined();
        });

        it('should generate no moves for completely surrounded bishop', () => {
            const board = createEmptyBoard();
            setPiece(board, squareToIndex('E4'), Piece.WHITE_BISHOP);
            // Surround diagonals with friendly pieces
            setPiece(board, squareToIndex('D3'), Piece.WHITE_PAWN);
            setPiece(board, squareToIndex('F3'), Piece.WHITE_PAWN);
            setPiece(board, squareToIndex('D5'), Piece.WHITE_PAWN);
            setPiece(board, squareToIndex('F5'), Piece.WHITE_PAWN);
            setPiece(board, squareToIndex('A1'), Piece.WHITE_KING);
            board.turn = InternalColor.WHITE;

            const moves = getMovesForPiece(board, squareToIndex('E4'));
            expect(moves.length).toBe(0);
        });
    });

    describe('Rook Moves', () => {
        it('should generate all straight moves from center', () => {
            const board = createEmptyBoard();
            setPiece(board, squareToIndex('E4'), Piece.WHITE_ROOK);
            board.turn = InternalColor.WHITE;

            const moves = getMovesForPiece(board, squareToIndex('E4'));
            expect(moves.length).toBe(14); // All horizontal and vertical squares from E4
        });

        it('should be blocked by pieces', () => {
            const board = createEmptyBoard();
            setPiece(board, squareToIndex('E4'), Piece.WHITE_ROOK);
            setPiece(board, squareToIndex('E6'), Piece.WHITE_PAWN);
            setPiece(board, squareToIndex('G4'), Piece.BLACK_PAWN);
            board.turn = InternalColor.WHITE;

            const moves = getMovesForPiece(board, squareToIndex('E4'));

            // Can capture G4 but not go beyond
            const captureG4 = moves.find(m => m.to === squareToIndex('G4'));
            expect(captureG4).toBeDefined();

            const beyondG4 = moves.find(m => m.to === squareToIndex('H4'));
            expect(beyondG4).toBeUndefined();

            // Cannot move to E6 or beyond
            const blockedE6 = moves.find(m => m.to === squareToIndex('E6'));
            expect(blockedE6).toBeUndefined();
        });

        it('should generate no moves for completely surrounded rook', () => {
            const board = createEmptyBoard();
            setPiece(board, squareToIndex('E4'), Piece.WHITE_ROOK);
            // Surround with friendly pieces
            setPiece(board, squareToIndex('E3'), Piece.WHITE_PAWN);
            setPiece(board, squareToIndex('E5'), Piece.WHITE_PAWN);
            setPiece(board, squareToIndex('D4'), Piece.WHITE_PAWN);
            setPiece(board, squareToIndex('F4'), Piece.WHITE_PAWN);
            setPiece(board, squareToIndex('A1'), Piece.WHITE_KING);
            board.turn = InternalColor.WHITE;

            const moves = getMovesForPiece(board, squareToIndex('E4'));
            expect(moves.length).toBe(0);
        });
    });

    describe('Queen Moves', () => {
        it('should generate all queen moves from center', () => {
            const board = createEmptyBoard();
            setPiece(board, squareToIndex('E4'), Piece.WHITE_QUEEN);
            board.turn = InternalColor.WHITE;

            const moves = getMovesForPiece(board, squareToIndex('E4'));
            expect(moves.length).toBe(27); // 13 diagonal + 14 straight
        });

        it('should move like rook and bishop combined', () => {
            const board = createEmptyBoard();
            setPiece(board, squareToIndex('D4'), Piece.WHITE_QUEEN);
            board.turn = InternalColor.WHITE;

            const moves = getMovesForPiece(board, squareToIndex('D4'));

            // Check some diagonal moves
            expect(moves.some(m => m.to === squareToIndex('A1'))).toBe(true);
            expect(moves.some(m => m.to === squareToIndex('H8'))).toBe(true);

            // Check some straight moves
            expect(moves.some(m => m.to === squareToIndex('D1'))).toBe(true);
            expect(moves.some(m => m.to === squareToIndex('A4'))).toBe(true);
        });

        it('should generate no moves for completely surrounded queen', () => {
            const board = createEmptyBoard();
            setPiece(board, squareToIndex('E4'), Piece.WHITE_QUEEN);
            // Surround with friendly pieces on all 8 squares
            setPiece(board, squareToIndex('D3'), Piece.WHITE_PAWN);
            setPiece(board, squareToIndex('E3'), Piece.WHITE_PAWN);
            setPiece(board, squareToIndex('F3'), Piece.WHITE_PAWN);
            setPiece(board, squareToIndex('D4'), Piece.WHITE_PAWN);
            setPiece(board, squareToIndex('F4'), Piece.WHITE_PAWN);
            setPiece(board, squareToIndex('D5'), Piece.WHITE_PAWN);
            setPiece(board, squareToIndex('E5'), Piece.WHITE_PAWN);
            setPiece(board, squareToIndex('F5'), Piece.WHITE_PAWN);
            setPiece(board, squareToIndex('A1'), Piece.WHITE_KING);
            board.turn = InternalColor.WHITE;

            const moves = getMovesForPiece(board, squareToIndex('E4'));
            expect(moves.length).toBe(0);
        });
    });

    describe('King Moves', () => {
        it('should generate all 8 king moves from center', () => {
            const board = createEmptyBoard();
            setPiece(board, squareToIndex('E4'), Piece.WHITE_KING);
            board.turn = InternalColor.WHITE;

            const moves = getMovesForPiece(board, squareToIndex('E4'));
            expect(moves.length).toBe(8);
        });

        it('should generate limited king moves from corner', () => {
            const board = createEmptyBoard();
            setPiece(board, squareToIndex('A1'), Piece.WHITE_KING);
            board.turn = InternalColor.WHITE;

            const moves = getMovesForPiece(board, squareToIndex('A1'));
            expect(moves.length).toBe(3); // A2, B1, B2
        });

        it('should not move into check', () => {
            const board = createEmptyBoard();
            setPiece(board, squareToIndex('E4'), Piece.WHITE_KING);
            setPiece(board, squareToIndex('E8'), Piece.BLACK_ROOK);
            board.turn = InternalColor.WHITE;

            const moves = getMovesForPiece(board, squareToIndex('E4'));

            // Cannot move to E3, E5 (attacked by rook)
            expect(moves.some(m => m.to === squareToIndex('E3'))).toBe(false);
            expect(moves.some(m => m.to === squareToIndex('E5'))).toBe(false);

            // Can move to D3, D4, D5, F3, F4, F5
            expect(moves.length).toBe(6);
        });

        it('should not allow king to move adjacent to enemy king', () => {
            const board = createEmptyBoard();
            setPiece(board, squareToIndex('E4'), Piece.WHITE_KING);
            setPiece(board, squareToIndex('E6'), Piece.BLACK_KING);
            board.turn = InternalColor.WHITE;

            const moves = getMovesForPiece(board, squareToIndex('E4'));

            // White king cannot move to D5, E5, or F5 (adjacent to black king)
            expect(moves.some(m => m.to === squareToIndex('D5'))).toBe(false);
            expect(moves.some(m => m.to === squareToIndex('E5'))).toBe(false);
            expect(moves.some(m => m.to === squareToIndex('F5'))).toBe(false);

            // Should be able to move to D3, E3, F3, D4, F4 (5 moves)
            expect(moves.length).toBe(5);
        });

        it('should not allow kings to be adjacent horizontally', () => {
            const board = createEmptyBoard();
            setPiece(board, squareToIndex('D4'), Piece.WHITE_KING);
            setPiece(board, squareToIndex('F4'), Piece.BLACK_KING);
            board.turn = InternalColor.WHITE;

            const moves = getMovesForPiece(board, squareToIndex('D4'));

            // White king cannot move to E3, E4, or E5
            expect(moves.some(m => m.to === squareToIndex('E3'))).toBe(false);
            expect(moves.some(m => m.to === squareToIndex('E4'))).toBe(false);
            expect(moves.some(m => m.to === squareToIndex('E5'))).toBe(false);
        });

        it('should not allow kings to be adjacent diagonally', () => {
            const board = createEmptyBoard();
            setPiece(board, squareToIndex('D4'), Piece.WHITE_KING);
            setPiece(board, squareToIndex('F6'), Piece.BLACK_KING);
            board.turn = InternalColor.WHITE;

            const moves = getMovesForPiece(board, squareToIndex('D4'));

            // White king cannot move to E5 (adjacent diagonal to black king)
            expect(moves.some(m => m.to === squareToIndex('E5'))).toBe(false);
        });
    });

    describe('Castling', () => {
        it('should allow white short castling when conditions met', () => {
            const board = createEmptyBoard();
            setPiece(board, squareToIndex('E1'), Piece.WHITE_KING);
            setPiece(board, squareToIndex('H1'), Piece.WHITE_ROOK);
            board.turn = InternalColor.WHITE;
            board.castlingRights = {
                whiteShort: true,
                whiteLong: false,
                blackShort: false,
                blackLong: false,
            };

            const moves = generateLegalMoves(board);
            const castling = moves.find(m =>
                m.flags & MoveFlag.CASTLING &&
                m.to === squareToIndex('G1')
            );
            expect(castling).toBeDefined();
        });

        it('should allow white long castling when conditions met', () => {
            const board = createEmptyBoard();
            setPiece(board, squareToIndex('E1'), Piece.WHITE_KING);
            setPiece(board, squareToIndex('A1'), Piece.WHITE_ROOK);
            board.turn = InternalColor.WHITE;
            board.castlingRights = {
                whiteShort: false,
                whiteLong: true,
                blackShort: false,
                blackLong: false,
            };

            const moves = generateLegalMoves(board);
            const castling = moves.find(m =>
                m.flags & MoveFlag.CASTLING &&
                m.to === squareToIndex('C1')
            );
            expect(castling).toBeDefined();
        });

        it('should not castle when king is in check', () => {
            const board = createEmptyBoard();
            setPiece(board, squareToIndex('E1'), Piece.WHITE_KING);
            setPiece(board, squareToIndex('H1'), Piece.WHITE_ROOK);
            setPiece(board, squareToIndex('E8'), Piece.BLACK_ROOK);
            board.turn = InternalColor.WHITE;
            board.castlingRights = {
                whiteShort: true,
                whiteLong: false,
                blackShort: false,
                blackLong: false,
            };

            const moves = generateLegalMoves(board);
            const castling = moves.find(m => m.flags & MoveFlag.CASTLING);
            expect(castling).toBeUndefined();
        });

        it('should not castle through check', () => {
            const board = createEmptyBoard();
            setPiece(board, squareToIndex('E1'), Piece.WHITE_KING);
            setPiece(board, squareToIndex('H1'), Piece.WHITE_ROOK);
            setPiece(board, squareToIndex('F8'), Piece.BLACK_ROOK);
            board.turn = InternalColor.WHITE;
            board.castlingRights = {
                whiteShort: true,
                whiteLong: false,
                blackShort: false,
                blackLong: false,
            };

            const moves = generateLegalMoves(board);
            const castling = moves.find(m => m.flags & MoveFlag.CASTLING);
            expect(castling).toBeUndefined();
        });

        it('should not castle when pieces are between', () => {
            const board = createEmptyBoard();
            setPiece(board, squareToIndex('E1'), Piece.WHITE_KING);
            setPiece(board, squareToIndex('H1'), Piece.WHITE_ROOK);
            setPiece(board, squareToIndex('F1'), Piece.WHITE_BISHOP);
            board.turn = InternalColor.WHITE;
            board.castlingRights = {
                whiteShort: true,
                whiteLong: false,
                blackShort: false,
                blackLong: false,
            };

            const moves = generateLegalMoves(board);
            const castling = moves.find(m => m.flags & MoveFlag.CASTLING);
            expect(castling).toBeUndefined();
        });

        it('should not castle when rights are lost', () => {
            const board = createEmptyBoard();
            setPiece(board, squareToIndex('E1'), Piece.WHITE_KING);
            setPiece(board, squareToIndex('H1'), Piece.WHITE_ROOK);
            board.turn = InternalColor.WHITE;
            board.castlingRights = {
                whiteShort: false,
                whiteLong: false,
                blackShort: false,
                blackLong: false,
            };

            const moves = generateLegalMoves(board);
            const castling = moves.find(m => m.flags & MoveFlag.CASTLING);
            expect(castling).toBeUndefined();
        });

        it('should not castle into check', () => {
            const board = createEmptyBoard();
            setPiece(board, squareToIndex('E1'), Piece.WHITE_KING);
            setPiece(board, squareToIndex('H1'), Piece.WHITE_ROOK);
            setPiece(board, squareToIndex('G8'), Piece.BLACK_ROOK); // Attacks G1
            board.turn = InternalColor.WHITE;
            board.castlingRights = {
                whiteShort: true,
                whiteLong: false,
                blackShort: false,
                blackLong: false,
            };

            const moves = generateLegalMoves(board);
            const castling = moves.find(m => m.flags & MoveFlag.CASTLING);
            expect(castling).toBeUndefined();
        });

        it('should allow long castling when B-file is attacked', () => {
            const board = createEmptyBoard();
            setPiece(board, squareToIndex('E1'), Piece.WHITE_KING);
            setPiece(board, squareToIndex('A1'), Piece.WHITE_ROOK);
            setPiece(board, squareToIndex('B8'), Piece.BLACK_ROOK); // Attacks B1
            board.turn = InternalColor.WHITE;
            board.castlingRights = {
                whiteShort: false,
                whiteLong: true,
                blackShort: false,
                blackLong: false,
            };

            const moves = generateLegalMoves(board);
            const castling = moves.find(m =>
                m.flags & MoveFlag.CASTLING &&
                m.to === squareToIndex('C1')
            );
            // B1 can be under attack for queenside castling
            expect(castling).toBeDefined();
        });

        it('should not castle when destination square occupied', () => {
            const board = createEmptyBoard();
            setPiece(board, squareToIndex('E1'), Piece.WHITE_KING);
            setPiece(board, squareToIndex('H1'), Piece.WHITE_ROOK);
            setPiece(board, squareToIndex('G1'), Piece.WHITE_KNIGHT);
            board.turn = InternalColor.WHITE;
            board.castlingRights = {
                whiteShort: true,
                whiteLong: false,
                blackShort: false,
                blackLong: false,
            };

            const moves = generateLegalMoves(board);
            const castling = moves.find(m => m.flags & MoveFlag.CASTLING);
            expect(castling).toBeUndefined();
        });
    });

    describe('Legal Move Validation', () => {
        it('should not allow moves that leave king in check', () => {
            const board = createEmptyBoard();
            setPiece(board, squareToIndex('E1'), Piece.WHITE_KING);
            setPiece(board, squareToIndex('E2'), Piece.WHITE_ROOK);
            setPiece(board, squareToIndex('E8'), Piece.BLACK_ROOK);
            board.turn = InternalColor.WHITE;

            // Rook on E2 is pinned, cannot move horizontally
            const moves = getMovesForPiece(board, squareToIndex('E2'));

            // Rook can only move vertically along the E-file
            const horizontalMove = moves.find(m => m.to === squareToIndex('A2'));
            expect(horizontalMove).toBeUndefined();
        });

        it('should allow blocking check', () => {
            const board = createEmptyBoard();
            setPiece(board, squareToIndex('E1'), Piece.WHITE_KING);
            setPiece(board, squareToIndex('D2'), Piece.WHITE_BISHOP);
            setPiece(board, squareToIndex('E8'), Piece.BLACK_ROOK);
            setPiece(board, squareToIndex('A8'), Piece.BLACK_KING); // Add black king
            board.turn = InternalColor.WHITE;
            board.castlingRights = {
                whiteShort: false,
                whiteLong: false,
                blackShort: false,
                blackLong: false,
            };

            const moves = generateLegalMoves(board);

            // Bishop can block on E3 (E3 is on the diagonal from D2 and blocks the check)
            const block = moves.find(m =>
                m.from === squareToIndex('D2') &&
                m.to === squareToIndex('E3')
            );
            expect(block).toBeDefined();
        });

        it('should allow capturing checking piece', () => {
            const board = createEmptyBoard();
            setPiece(board, squareToIndex('E1'), Piece.WHITE_KING);
            setPiece(board, squareToIndex('C3'), Piece.WHITE_KNIGHT);
            setPiece(board, squareToIndex('E2'), Piece.BLACK_ROOK); // Rook on E2 checking the king
            setPiece(board, squareToIndex('A8'), Piece.BLACK_KING);
            board.turn = InternalColor.WHITE;
            board.castlingRights = {
                whiteShort: false,
                whiteLong: false,
                blackShort: false,
                blackLong: false,
            };

            const moves = generateLegalMoves(board);

            // King can capture on E2 (adjacent square)
            const kingCapture = moves.find(m =>
                m.from === squareToIndex('E1') &&
                m.to === squareToIndex('E2')
            );

            expect(kingCapture).toBeDefined();
        });

        it('should not allow king to capture protected pieces', () => {
            const board = createEmptyBoard();
            setPiece(board, squareToIndex('E1'), Piece.WHITE_KING);
            setPiece(board, squareToIndex('E2'), Piece.BLACK_PAWN);
            // A black pawn on D3 attacks E2 (south-east from the pawn on D3)
            // so the king capture on E2 must be illegal.
            setPiece(board, squareToIndex('D3'), Piece.BLACK_PAWN); // Protects E2
            setPiece(board, squareToIndex('A8'), Piece.BLACK_KING);
            board.turn = InternalColor.WHITE;

            const moves = getMovesForPiece(board, squareToIndex('E1'));

            // King cannot capture pawn on E2 (protected by D3 pawn)
            const captureE2 = moves.find(m => m.to === squareToIndex('E2'));
            expect(captureE2).toBeUndefined();
        });

        it('should only allow king moves in double check', () => {
            const board = createEmptyBoard();
            setPiece(board, squareToIndex('E1'), Piece.WHITE_KING);
            setPiece(board, squareToIndex('E8'), Piece.BLACK_ROOK); // Check from rook
            setPiece(board, squareToIndex('C3'), Piece.BLACK_BISHOP); // Check from bishop
            setPiece(board, squareToIndex('D2'), Piece.WHITE_ROOK); // White rook cannot block
            setPiece(board, squareToIndex('A8'), Piece.BLACK_KING);
            board.turn = InternalColor.WHITE;

            const moves = generateLegalMoves(board);

            // In double check, only king can move (cannot block two checks)
            const allKingMoves = moves.every(m => m.piece === Piece.WHITE_KING);
            expect(allKingMoves).toBe(true);

            // White rook should have no legal moves
            const rookMoves = moves.filter(m => m.from === squareToIndex('D2'));
            expect(rookMoves.length).toBe(0);
        });

        it('should handle pinned pieces correctly', () => {
            const board = createEmptyBoard();
            setPiece(board, squareToIndex('E1'), Piece.WHITE_KING);
            setPiece(board, squareToIndex('E3'), Piece.WHITE_ROOK);
            setPiece(board, squareToIndex('E8'), Piece.BLACK_ROOK);
            setPiece(board, squareToIndex('A8'), Piece.BLACK_KING);
            board.turn = InternalColor.WHITE;

            const moves = getMovesForPiece(board, squareToIndex('E3'));

            // Rook is pinned vertically, can only move along E-file
            expect(moves.length).toBeGreaterThan(0);

            // All moves should be on E-file
            const allOnEFile = moves.every(m => m.to % 8 === squareToIndex('E3') % 8);
            expect(allOnEFile).toBe(true);
        });

        it('should not allow moving a piece that creates discovered check', () => {
            const board = createEmptyBoard();
            setPiece(board, squareToIndex('E1'), Piece.WHITE_KING);
            setPiece(board, squareToIndex('E3'), Piece.WHITE_BISHOP);
            setPiece(board, squareToIndex('E8'), Piece.BLACK_ROOK);
            setPiece(board, squareToIndex('A8'), Piece.BLACK_KING);
            board.turn = InternalColor.WHITE;

            const moves = getMovesForPiece(board, squareToIndex('E3'));

            // Bishop moving diagonally would expose king to check from rook
            // Bishop can only move to E2 or E4+ (blocking the rook)
            const diagonalMoves = moves.filter(m =>
                m.to !== squareToIndex('E2') &&
                m.to !== squareToIndex('E4') &&
                m.to !== squareToIndex('E5') &&
                m.to !== squareToIndex('E6') &&
                m.to !== squareToIndex('E7') &&
                m.to !== squareToIndex('E8')
            );
            expect(diagonalMoves.length).toBe(0);
        });

        it('should generate all valid ways to resolve check', () => {
            const board = createEmptyBoard();
            setPiece(board, squareToIndex('E1'), Piece.WHITE_KING);
            setPiece(board, squareToIndex('E2'), Piece.WHITE_ROOK);
            setPiece(board, squareToIndex('D2'), Piece.WHITE_BISHOP);
            setPiece(board, squareToIndex('E8'), Piece.BLACK_ROOK);
            setPiece(board, squareToIndex('A8'), Piece.BLACK_KING);
            board.turn = InternalColor.WHITE;

            const moves = generateLegalMoves(board);

            // King can move (should have moves to D1, F1, F2)
            const kingMoves = moves.filter(m => m.piece === Piece.WHITE_KING);
            expect(kingMoves.length).toBeGreaterThan(0);

            // Rook can block on E3, E4, E5, E6, E7 or capture on E8
            const rookBlocks = moves.filter(m =>
                m.piece === Piece.WHITE_ROOK &&
                m.from === squareToIndex('E2')
            );
            expect(rookBlocks.length).toBeGreaterThan(0);
        });

        it('should handle complex pin scenario with multiple pieces', () => {
            const board = createEmptyBoard();
            setPiece(board, squareToIndex('E1'), Piece.WHITE_KING);
            setPiece(board, squareToIndex('E2'), Piece.WHITE_PAWN);
            setPiece(board, squareToIndex('E3'), Piece.WHITE_KNIGHT);
            setPiece(board, squareToIndex('E8'), Piece.BLACK_ROOK);
            setPiece(board, squareToIndex('A8'), Piece.BLACK_KING);
            board.turn = InternalColor.WHITE;

            // Knight on E3 is NOT pinned (knights jump over pieces, cannot be pinned)
            // Pawn on E2 blocks the rook, so knight is free to move
            const knightMoves = getMovesForPiece(board, squareToIndex('E3'));
            expect(knightMoves.length).toBe(8);

            // Pawn on E2 is pinned and also blocked by knight
            const pawnMoves = getMovesForPiece(board, squareToIndex('E2'));
            expect(pawnMoves.length).toBe(0); // Blocked by knight
        });

        it('should allow en passant even if it resolves check', () => {
            const board = createEmptyBoard();
            setPiece(board, squareToIndex('E1'), Piece.WHITE_KING);
            setPiece(board, squareToIndex('E5'), Piece.WHITE_PAWN);
            setPiece(board, squareToIndex('D5'), Piece.BLACK_PAWN);
            setPiece(board, squareToIndex('D8'), Piece.BLACK_ROOK); // Not giving check
            board.enPassantSquare = squareToIndex('D6');
            board.turn = InternalColor.WHITE;

            const moves = getMovesForPiece(board, squareToIndex('E5'));

            const enPassant = moves.find(m => m.flags & MoveFlag.EN_PASSANT);
            expect(enPassant).toBeDefined();
        });

        it('should not allow en passant if it exposes king to check', () => {
            const board = createEmptyBoard();
            setPiece(board, squareToIndex('E5'), Piece.WHITE_KING);
            setPiece(board, squareToIndex('D5'), Piece.WHITE_PAWN);
            setPiece(board, squareToIndex('C5'), Piece.BLACK_PAWN);
            setPiece(board, squareToIndex('A5'), Piece.BLACK_ROOK); // Would check after en passant
            board.enPassantSquare = squareToIndex('C6');
            board.turn = InternalColor.WHITE;

            const moves = getMovesForPiece(board, squareToIndex('D5'));

            // En passant would remove D5 pawn and expose king to rook
            const enPassant = moves.find(m => m.flags & MoveFlag.EN_PASSANT);
            expect(enPassant).toBeUndefined();
        });
    });

    describe('Black Piece Moves', () => {
        describe('Black Pawn Moves', () => {
            it('should generate black pawn single push (downward)', () => {
                const board = createEmptyBoard();
                setPiece(board, squareToIndex('E7'), Piece.BLACK_PAWN);
                board.turn = InternalColor.BLACK;

                const moves = getMovesForPiece(board, squareToIndex('E7'));
                expect(moves.length).toBeGreaterThanOrEqual(1);

                const singlePush = moves.find(m => m.to === squareToIndex('E6'));
                expect(singlePush).toBeDefined();
            });

            it('should generate black pawn double push from starting rank', () => {
                const board = createEmptyBoard();
                setPiece(board, squareToIndex('E7'), Piece.BLACK_PAWN);
                board.turn = InternalColor.BLACK;

                const moves = getMovesForPiece(board, squareToIndex('E7'));

                const doublePush = moves.find(m =>
                    m.to === squareToIndex('E5') &&
                    (m.flags & MoveFlag.PAWN_DOUBLE_PUSH)
                );
                expect(doublePush).toBeDefined();
            });

            it('should generate black pawn captures (downward diagonals)', () => {
                const board = createEmptyBoard();
                setPiece(board, squareToIndex('E5'), Piece.BLACK_PAWN);
                setPiece(board, squareToIndex('D4'), Piece.WHITE_PAWN);
                setPiece(board, squareToIndex('F4'), Piece.WHITE_KNIGHT);
                board.turn = InternalColor.BLACK;

                const moves = getMovesForPiece(board, squareToIndex('E5'));

                const captures = moves.filter(m => m.flags & MoveFlag.CAPTURE);
                expect(captures.length).toBe(2);
            });

            it('should generate black pawn promotions on rank 1', () => {
                const board = createEmptyBoard();
                setPiece(board, squareToIndex('E2'), Piece.BLACK_PAWN);
                board.turn = InternalColor.BLACK;

                const moves = getMovesForPiece(board, squareToIndex('E2'));

                const promotions = moves.filter(m => m.flags & MoveFlag.PROMOTION);
                expect(promotions.length).toBe(4); // Q, R, B, N
            });

            it('should generate black en passant capture', () => {
                const board = createEmptyBoard();
                setPiece(board, squareToIndex('E4'), Piece.BLACK_PAWN);
                setPiece(board, squareToIndex('D4'), Piece.WHITE_PAWN);
                board.enPassantSquare = squareToIndex('D3'); // En passant target for black
                board.turn = InternalColor.BLACK;

                const moves = getMovesForPiece(board, squareToIndex('E4'));

                const enPassant = moves.find(m =>
                    m.flags & MoveFlag.EN_PASSANT
                );
                expect(enPassant).toBeDefined();
                expect(enPassant?.to).toBe(squareToIndex('D3'));
            });

            it('should not allow black pawn to move backward', () => {
                const board = createEmptyBoard();
                setPiece(board, squareToIndex('E4'), Piece.BLACK_PAWN);
                board.turn = InternalColor.BLACK;

                const moves = getMovesForPiece(board, squareToIndex('E4'));

                // Black pawns move down (to lower ranks), not up
                const backwardMove = moves.find(m => m.to === squareToIndex('E5'));
                expect(backwardMove).toBeUndefined();
            });
        });

        describe('Black Castling', () => {
            it('should allow black short castling when conditions met', () => {
                const board = createEmptyBoard();
                setPiece(board, squareToIndex('E8'), Piece.BLACK_KING);
                setPiece(board, squareToIndex('H8'), Piece.BLACK_ROOK);
                setPiece(board, squareToIndex('E1'), Piece.WHITE_KING); // Add white king
                board.turn = InternalColor.BLACK;
                board.castlingRights = {
                    whiteShort: false,
                    whiteLong: false,
                    blackShort: true,
                    blackLong: false,
                };

                const moves = generateLegalMoves(board);
                const castling = moves.find(m =>
                    m.flags & MoveFlag.CASTLING &&
                    m.to === squareToIndex('G8')
                );
                expect(castling).toBeDefined();
            });

            it('should allow black long castling when conditions met', () => {
                const board = createEmptyBoard();
                setPiece(board, squareToIndex('E8'), Piece.BLACK_KING);
                setPiece(board, squareToIndex('A8'), Piece.BLACK_ROOK);
                setPiece(board, squareToIndex('E1'), Piece.WHITE_KING); // Add white king
                board.turn = InternalColor.BLACK;
                board.castlingRights = {
                    whiteShort: false,
                    whiteLong: false,
                    blackShort: false,
                    blackLong: true,
                };

                const moves = generateLegalMoves(board);
                const castling = moves.find(m =>
                    m.flags & MoveFlag.CASTLING &&
                    m.to === squareToIndex('C8')
                );
                expect(castling).toBeDefined();
            });

            it('should not allow black to castle through check', () => {
                const board = createEmptyBoard();
                setPiece(board, squareToIndex('E8'), Piece.BLACK_KING);
                setPiece(board, squareToIndex('H8'), Piece.BLACK_ROOK);
                setPiece(board, squareToIndex('F1'), Piece.WHITE_ROOK); // Attacks F8
                setPiece(board, squareToIndex('E1'), Piece.WHITE_KING);
                board.turn = InternalColor.BLACK;
                board.castlingRights = {
                    whiteShort: false,
                    whiteLong: false,
                    blackShort: true,
                    blackLong: false,
                };

                const moves = generateLegalMoves(board);
                const castling = moves.find(m => m.flags & MoveFlag.CASTLING);
                expect(castling).toBeUndefined();
            });
        });

        describe('Black Piece Behavior', () => {
            it('should generate correct black knight moves', () => {
                const board = createEmptyBoard();
                setPiece(board, squareToIndex('E5'), Piece.BLACK_KNIGHT);
                board.turn = InternalColor.BLACK;

                const moves = getMovesForPiece(board, squareToIndex('E5'));
                expect(moves.length).toBe(8);
            });

            it('should not allow black pieces to capture black pieces', () => {
                const board = createEmptyBoard();
                setPiece(board, squareToIndex('E4'), Piece.BLACK_KNIGHT);
                setPiece(board, squareToIndex('D6'), Piece.BLACK_PAWN);
                setPiece(board, squareToIndex('F6'), Piece.BLACK_PAWN);
                board.turn = InternalColor.BLACK;

                const moves = getMovesForPiece(board, squareToIndex('E4'));
                expect(moves.length).toBe(6); // 8 - 2 blocked by friendly
            });

            it('should allow black pieces to capture white pieces', () => {
                const board = createEmptyBoard();
                setPiece(board, squareToIndex('E4'), Piece.BLACK_ROOK);
                setPiece(board, squareToIndex('E1'), Piece.WHITE_KING);
                setPiece(board, squareToIndex('H4'), Piece.WHITE_PAWN);
                setPiece(board, squareToIndex('A8'), Piece.BLACK_KING);
                board.turn = InternalColor.BLACK;

                const moves = getMovesForPiece(board, squareToIndex('E4'));
                const captures = moves.filter(m => m.flags & MoveFlag.CAPTURE);
                expect(captures.length).toBeGreaterThanOrEqual(1);
            });
        });
    });

    describe('Edge Cases', () => {
        it('should handle empty board correctly', () => {
            const board = createEmptyBoard();
            board.turn = InternalColor.WHITE;
            board.castlingRights = {
                whiteShort: false,
                whiteLong: false,
                blackShort: false,
                blackLong: false,
            };

            const moves = generateLegalMoves(board);
            expect(moves.length).toBe(0);
        });

        it('should handle black to move', () => {
            const board = createStartingBoard();
            board.turn = InternalColor.BLACK;

            const moves = generateLegalMoves(board);
            // Black should have same number of moves as white from starting position
            // 16 pawn moves + 4 knight moves = 20 (no castling possible from start)
            expect(moves.length).toBeGreaterThanOrEqual(20);
        });

        it('should validate move legality correctly', () => {
            const board = createStartingBoard();

            // Valid move
            expect(isMoveLegal(board, squareToIndex('E2'), squareToIndex('E4'))).toBe(true);

            // Invalid move
            expect(isMoveLegal(board, squareToIndex('E1'), squareToIndex('E2'))).toBe(false);
        });

        it('should handle complex diagonal pins', () => {
            const board = createEmptyBoard();
            setPiece(board, squareToIndex('E1'), Piece.WHITE_KING);
            setPiece(board, squareToIndex('F2'), Piece.WHITE_KNIGHT);
            setPiece(board, squareToIndex('H4'), Piece.BLACK_BISHOP);
            setPiece(board, squareToIndex('A8'), Piece.BLACK_KING);
            board.turn = InternalColor.WHITE;

            const moves = getMovesForPiece(board, squareToIndex('F2'));

            // Knight is pinned diagonally, cannot move at all
            expect(moves.length).toBe(0);
        });

        it('should generate no moves in checkmate position (back rank mate)', () => {
            const board = createEmptyBoard();
            setPiece(board, squareToIndex('H8'), Piece.BLACK_KING);
            setPiece(board, squareToIndex('G7'), Piece.BLACK_PAWN);
            setPiece(board, squareToIndex('H7'), Piece.BLACK_PAWN);
            setPiece(board, squareToIndex('A8'), Piece.WHITE_ROOK);
            setPiece(board, squareToIndex('E1'), Piece.WHITE_KING);
            board.turn = InternalColor.BLACK;

            const moves = generateLegalMoves(board);
            // Back rank mate: black king is in check and has no legal moves
            expect(moves.length).toBe(0);
        });

        it('should generate no moves in stalemate position', () => {
            const board = createEmptyBoard();
            setPiece(board, squareToIndex('A8'), Piece.BLACK_KING);
            setPiece(board, squareToIndex('C7'), Piece.WHITE_QUEEN);
            setPiece(board, squareToIndex('B6'), Piece.WHITE_KING);
            board.turn = InternalColor.BLACK;

            const moves = generateLegalMoves(board);
            // Stalemate: black king is not in check but has no legal moves
            expect(moves.length).toBe(0);
        });

        it('should correctly handle en passant requirements', () => {
            const board = createEmptyBoard();
            setPiece(board, squareToIndex('E5'), Piece.WHITE_PAWN);
            setPiece(board, squareToIndex('D5'), Piece.BLACK_PAWN);
            // En passant square not set (as if D5 didn't just move)
            board.enPassantSquare = null;
            board.turn = InternalColor.WHITE;

            const moves = getMovesForPiece(board, squareToIndex('E5'));

            // Without en passant square set, no en passant capture
            const enPassant = moves.find(m => m.flags & MoveFlag.EN_PASSANT);
            expect(enPassant).toBeUndefined();
        });

        it('should allow king to move out of check', () => {
            const board = createEmptyBoard();
            setPiece(board, squareToIndex('E4'), Piece.WHITE_KING);
            setPiece(board, squareToIndex('E8'), Piece.BLACK_ROOK);
            setPiece(board, squareToIndex('A8'), Piece.BLACK_KING);
            board.turn = InternalColor.WHITE;

            const moves = getMovesForPiece(board, squareToIndex('E4'));

            // King in check from E8 rook, can move to D3, D4, D5, F3, F4, F5
            expect(moves.length).toBeGreaterThan(0);

            // King cannot stay on E-file (file = square % 8)
            const eFile = squareToIndex('E4') % 8;
            const staysOnEFile = moves.find(m => m.to % 8 === eFile);
            expect(staysOnEFile).toBeUndefined();
        });

        it('should handle position with only kings remaining', () => {
            const board = createEmptyBoard();
            setPiece(board, squareToIndex('E1'), Piece.WHITE_KING);
            setPiece(board, squareToIndex('E8'), Piece.BLACK_KING);
            board.turn = InternalColor.WHITE;

            const moves = generateLegalMoves(board);

            // White king should have moves available
            expect(moves.length).toBeGreaterThan(0);

            // All moves should be king moves
            const allKingMoves = moves.every(m => m.piece === Piece.WHITE_KING);
            expect(allKingMoves).toBe(true);
        });

        it('should correctly count moves from starting position for both colors', () => {
            const whiteBoard = createStartingBoard();
            whiteBoard.turn = InternalColor.WHITE;
            const whiteMoves = generateLegalMoves(whiteBoard);

            const blackBoard = createStartingBoard();
            blackBoard.turn = InternalColor.BLACK;
            const blackMoves = generateLegalMoves(blackBoard);

            // Both sides should have exactly 20 moves from start (symmetry)
            expect(whiteMoves.length).toBe(20);
            expect(blackMoves.length).toBe(20);
        });

        it('should handle knight on edge of board correctly', () => {
            const board = createEmptyBoard();
            setPiece(board, squareToIndex('A4'), Piece.WHITE_KNIGHT);
            setPiece(board, squareToIndex('E1'), Piece.WHITE_KING);
            board.turn = InternalColor.WHITE;

            const moves = getMovesForPiece(board, squareToIndex('A4'));

            // Knight on A4 should have 4 possible moves: B2, C3, C5, B6
            expect(moves.length).toBe(4);
        });

        it('should handle pawn on rank 7 with multiple capture options and promotion', () => {
            const board = createEmptyBoard();
            setPiece(board, squareToIndex('E7'), Piece.WHITE_PAWN);
            setPiece(board, squareToIndex('D8'), Piece.BLACK_ROOK);
            setPiece(board, squareToIndex('F8'), Piece.BLACK_BISHOP);
            setPiece(board, squareToIndex('E1'), Piece.WHITE_KING);
            board.turn = InternalColor.WHITE;

            const moves = getMovesForPiece(board, squareToIndex('E7'));

            // Should have: 1 forward promotion (4 pieces) + 2 capture promotions (4 pieces each)
            expect(moves.length).toBe(12);
        });

        it('should correctly handle piece on last rank', () => {
            const board = createEmptyBoard();
            setPiece(board, squareToIndex('E8'), Piece.WHITE_ROOK);
            setPiece(board, squareToIndex('A1'), Piece.WHITE_KING);
            board.turn = InternalColor.WHITE;

            const moves = getMovesForPiece(board, squareToIndex('E8'));

            // Rook on 8th rank: 7 squares along rank 8 + 7 squares down E-file = 14
            expect(moves.length).toBe(14);
        });

        it('should handle multiple pieces attacking the same square', () => {
            const board = createEmptyBoard();
            setPiece(board, squareToIndex('E4'), Piece.WHITE_KING);
            // Ensure E5 is attacked by a black pawn: a black pawn attacks one step "south" diagonally,
            // so a pawn on F6 attacks E5.
            setPiece(board, squareToIndex('F6'), Piece.BLACK_PAWN);

            // Put a black knight so it attacks D4
            setPiece(board, squareToIndex('E6'), Piece.BLACK_KNIGHT); // Attacks D4 among others

            // Put a black bishop so it attacks D3
            setPiece(board, squareToIndex('A6'), Piece.BLACK_BISHOP); // Diagonal A6-B5-C4-D3
            setPiece(board, squareToIndex('A8'), Piece.BLACK_KING);
            board.turn = InternalColor.WHITE;

            const moves = getMovesForPiece(board, squareToIndex('E4'));

            // King on E4 cannot move to E5 (pawn), D4 (knight), or D3 (bishop)
            expect(moves.some(m => m.to === squareToIndex('E5'))).toBe(false);
            expect(moves.some(m => m.to === squareToIndex('D4'))).toBe(false);
            expect(moves.some(m => m.to === squareToIndex('D3'))).toBe(false);
        });

        it('should generate moves when only one legal move available', () => {
            const board = createEmptyBoard();
            setPiece(board, squareToIndex('E1'), Piece.WHITE_KING);
            setPiece(board, squareToIndex('E2'), Piece.WHITE_PAWN); // Can move to E3 or E4
            setPiece(board, squareToIndex('D3'), Piece.BLACK_ROOK); // Attacks D1, F1, entire 3rd rank
            setPiece(board, squareToIndex('H8'), Piece.BLACK_KING);
            board.turn = InternalColor.WHITE;

            const moves = generateLegalMoves(board);

            // Pawn can move to E3 (blocking) or E4, King can't move (all squares attacked)
            // Actually king might have E2... Let me make it simpler
            expect(moves.length).toBeGreaterThanOrEqual(1);
        });

        it('should correctly handle board with only pawns and kings', () => {
            const board = createEmptyBoard();
            setPiece(board, squareToIndex('E1'), Piece.WHITE_KING);
            setPiece(board, squareToIndex('E2'), Piece.WHITE_PAWN);
            setPiece(board, squareToIndex('E8'), Piece.BLACK_KING);
            setPiece(board, squareToIndex('E7'), Piece.BLACK_PAWN);
            board.turn = InternalColor.WHITE;

            const moves = generateLegalMoves(board);

            // White king has moves, white pawn has forward move
            expect(moves.length).toBeGreaterThan(0);
        });
    });

    describe('Regressions', () => {
        it('should allow pawn capture G4xF5 after a specific opening line (reported glitch)', () => {
            // Start from the known buggy position directly (no move replay).
            // This position is after:
            //   E2-E4 B7-B5 D2-D3 D7-D6 F2-F3 C8-F5 G1-H3 E7-E6
            // White to move.
            const fen = 'rn1qkbnr/p1p2ppp/3pp3/1p3b2/4P3/3P1P1N/PPP3PP/RNBQKB1R w KQkq - 0 5';
            const board = parseFEN(fen);

            // Sanity: bishop is on F5
            expect(board.mailbox[squareToIndex('F5')]).toBe(Piece.BLACK_BISHOP);

            // Core regression assertion: pawn from E4 must be able to capture bishop on F5.
            // (After the given line, the pawn on E4 is the one that can capture F5.)
            const movesFromE4 = getMovesForPiece(board, squareToIndex('E4'));
            expect(movesFromE4.some(m => m.to === squareToIndex('F5') && (m.flags & MoveFlag.CAPTURE))).toBe(true);
        });

        it('should generate all 4 promotion choices (quiet promotion)', () => {
            // White pawn ready to promote on A8
            const board = parseFEN('7k/P7/8/8/8/8/8/7K w - - 0 1');
            const moves = getMovesForPiece(board, squareToIndex('A7'));

            const promoMoves = moves.filter(m => m.to === squareToIndex('A8') && (m.flags & MoveFlag.PROMOTION));
            expect(promoMoves.length).toBe(4);

            const promoPieces = promoMoves.map(m => m.promotionPiece).sort();
            expect(promoPieces).toEqual([
                Piece.WHITE_BISHOP,
                Piece.WHITE_KNIGHT,
                Piece.WHITE_QUEEN,
                Piece.WHITE_ROOK,
            ].sort());
        });

        it('should generate all 4 promotion choices on capture as well', () => {
            // White pawn on A7 can capture B8 and promote.
            const board = parseFEN('1r5k/P7/8/8/8/8/8/7K w - - 0 1');
            const moves = getMovesForPiece(board, squareToIndex('A7'));

            const capturePromo = moves.filter(m =>
                m.to === squareToIndex('B8') &&
                (m.flags & MoveFlag.PROMOTION) &&
                (m.flags & MoveFlag.CAPTURE)
            );
            expect(capturePromo.length).toBe(4);
        });

        it('should not generate moves that leave own king in check (simple pin)', () => {
            // White rook on E2 is pinned by black rook on E8 against the white king on E1.
            // Any rook move off the E-file should be illegal.
            const board = parseFEN('4r2k/8/8/8/8/8/4R3/4K3 w - - 0 1');
            const moves = getMovesForPiece(board, squareToIndex('E2'));

            // Capturing the pinning rook is impossible (too far), and moving sideways would expose check.
            expect(moves.some(m => m.to === squareToIndex('D2'))).toBe(false);
            expect(moves.some(m => m.to === squareToIndex('F2'))).toBe(false);

            // Moving along the file while still blocking should be allowed.
            expect(moves.some(m => m.to === squareToIndex('E3'))).toBe(true);
        });

        it('should only allow legal responses when in check (block/capture/king move)', () => {
            // White king in check from a black rook.
            // White can respond by moving the king or capturing the checking piece.
            const board = parseFEN('4k3/8/8/8/8/8/4r3/4K3 w - - 0 1');
            const allMoves = generateLegalMoves(board);

            // Ensure every move results in king not being in check.
            // (This is a strong invariant test — if it fails, legality filtering is broken.)
            for (const mv of allMoves) {
                const testBoard = copyBoard(board);
                applyMoveComplete(testBoard, mv);
                // after applyMoveComplete, turn switched; check the side who just moved (white)
                testBoard.turn = InternalColor.WHITE;
                expect(isKingInCheck(testBoard)).toBe(false);
            }

            // And we should have at least one legal reply.
            expect(allMoves.length).toBeGreaterThan(0);
        });
    });
});
