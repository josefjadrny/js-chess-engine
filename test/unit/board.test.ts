/**
 * Unit tests for internal board structure
 */

import {
    createEmptyBoard,
    createStartingBoard,
    setPiece,
    removePiece,
    getPiece,
    getBitboard,
    copyBoard,
    isPieceColor,
    getPieceColor,
    oppositeColor,
    isSquareEmpty,
    isSquareEnemy,
    isSquareFriendly,
} from '../../src/core/Board';
import { Piece, InternalColor } from '../../src/types';
import { popCount } from '../../src/utils/conversion';

describe('Board Creation', () => {
    describe('createEmptyBoard', () => {
        it('should create empty board with no pieces', () => {
            const board = createEmptyBoard();

            // Check all squares are empty
            for (let i = 0; i < 64; i++) {
                expect(board.mailbox[i]).toBe(Piece.EMPTY);
            }

            // Check all bitboards are zero
            expect(board.whitePawns).toBe(0n);
            expect(board.whiteKnights).toBe(0n);
            expect(board.whiteBishops).toBe(0n);
            expect(board.whiteRooks).toBe(0n);
            expect(board.whiteQueens).toBe(0n);
            expect(board.whiteKing).toBe(0n);
            expect(board.blackPawns).toBe(0n);
            expect(board.blackKnights).toBe(0n);
            expect(board.blackBishops).toBe(0n);
            expect(board.blackRooks).toBe(0n);
            expect(board.blackQueens).toBe(0n);
            expect(board.blackKing).toBe(0n);
            expect(board.whitePieces).toBe(0n);
            expect(board.blackPieces).toBe(0n);
            expect(board.allPieces).toBe(0n);
        });

        it('should initialize game state', () => {
            const board = createEmptyBoard();

            expect(board.turn).toBe(InternalColor.WHITE);
            expect(board.castlingRights).toEqual({
                whiteShort: true,
                blackShort: true,
                whiteLong: true,
                blackLong: true,
            });
            expect(board.enPassantSquare).toBe(null);
            expect(board.halfMoveClock).toBe(0);
            expect(board.fullMoveNumber).toBe(1);
            expect(board.isCheck).toBe(false);
            expect(board.isCheckmate).toBe(false);
            expect(board.isStalemate).toBe(false);
        });
    });

    describe('createStartingBoard', () => {
        it('should create standard starting position', () => {
            const board = createStartingBoard();

            // Check white pawns (rank 2)
            for (let i = 8; i < 16; i++) {
                expect(board.mailbox[i]).toBe(Piece.WHITE_PAWN);
            }

            // Check black pawns (rank 7)
            for (let i = 48; i < 56; i++) {
                expect(board.mailbox[i]).toBe(Piece.BLACK_PAWN);
            }

            // Check white pieces (rank 1)
            expect(board.mailbox[0]).toBe(Piece.WHITE_ROOK);
            expect(board.mailbox[1]).toBe(Piece.WHITE_KNIGHT);
            expect(board.mailbox[2]).toBe(Piece.WHITE_BISHOP);
            expect(board.mailbox[3]).toBe(Piece.WHITE_QUEEN);
            expect(board.mailbox[4]).toBe(Piece.WHITE_KING);
            expect(board.mailbox[5]).toBe(Piece.WHITE_BISHOP);
            expect(board.mailbox[6]).toBe(Piece.WHITE_KNIGHT);
            expect(board.mailbox[7]).toBe(Piece.WHITE_ROOK);

            // Check black pieces (rank 8)
            expect(board.mailbox[56]).toBe(Piece.BLACK_ROOK);
            expect(board.mailbox[57]).toBe(Piece.BLACK_KNIGHT);
            expect(board.mailbox[58]).toBe(Piece.BLACK_BISHOP);
            expect(board.mailbox[59]).toBe(Piece.BLACK_QUEEN);
            expect(board.mailbox[60]).toBe(Piece.BLACK_KING);
            expect(board.mailbox[61]).toBe(Piece.BLACK_BISHOP);
            expect(board.mailbox[62]).toBe(Piece.BLACK_KNIGHT);
            expect(board.mailbox[63]).toBe(Piece.BLACK_ROOK);

            // Check empty squares (ranks 3-6)
            for (let i = 16; i < 48; i++) {
                expect(board.mailbox[i]).toBe(Piece.EMPTY);
            }
        });

        it('should have correct piece counts', () => {
            const board = createStartingBoard();

            // Each side should have 16 pieces
            expect(popCount(board.whitePieces)).toBe(16);
            expect(popCount(board.blackPieces)).toBe(16);
            expect(popCount(board.allPieces)).toBe(32);

            // Specific piece counts
            expect(popCount(board.whitePawns)).toBe(8);
            expect(popCount(board.blackPawns)).toBe(8);
            expect(popCount(board.whiteKnights)).toBe(2);
            expect(popCount(board.blackKnights)).toBe(2);
            expect(popCount(board.whiteBishops)).toBe(2);
            expect(popCount(board.blackBishops)).toBe(2);
            expect(popCount(board.whiteRooks)).toBe(2);
            expect(popCount(board.blackRooks)).toBe(2);
            expect(popCount(board.whiteQueens)).toBe(1);
            expect(popCount(board.blackQueens)).toBe(1);
            expect(popCount(board.whiteKing)).toBe(1);
            expect(popCount(board.blackKing)).toBe(1);
        });
    });
});

describe('Piece Manipulation', () => {
    describe('setPiece', () => {
        it('should add piece to empty square', () => {
            const board = createEmptyBoard();
            setPiece(board, 28, Piece.WHITE_PAWN); // E4

            expect(getPiece(board, 28)).toBe(Piece.WHITE_PAWN);
            expect(board.whitePawns).toBe(1n << 28n);
            expect(board.whitePieces).toBe(1n << 28n);
            expect(board.allPieces).toBe(1n << 28n);
        });

        it('should replace existing piece', () => {
            const board = createEmptyBoard();
            setPiece(board, 28, Piece.WHITE_PAWN);
            setPiece(board, 28, Piece.WHITE_QUEEN);

            expect(getPiece(board, 28)).toBe(Piece.WHITE_QUEEN);
            expect(board.whitePawns).toBe(0n);
            expect(board.whiteQueens).toBe(1n << 28n);
        });

        it('should update bitboards for all piece types', () => {
            const board = createEmptyBoard();

            setPiece(board, 0, Piece.WHITE_PAWN);
            expect(board.whitePawns).toBe(1n);

            setPiece(board, 1, Piece.WHITE_KNIGHT);
            expect(board.whiteKnights).toBe(2n);

            setPiece(board, 2, Piece.BLACK_ROOK);
            expect(board.blackRooks).toBe(4n);
            expect(board.blackPieces).toBe(4n);
        });
    });

    describe('removePiece', () => {
        it('should remove piece from square', () => {
            const board = createEmptyBoard();
            setPiece(board, 28, Piece.WHITE_PAWN);
            removePiece(board, 28);

            expect(getPiece(board, 28)).toBe(Piece.EMPTY);
            expect(board.whitePawns).toBe(0n);
            expect(board.whitePieces).toBe(0n);
            expect(board.allPieces).toBe(0n);
        });

        it('should do nothing on empty square', () => {
            const board = createEmptyBoard();
            removePiece(board, 28);

            expect(getPiece(board, 28)).toBe(Piece.EMPTY);
        });
    });

    describe('getPiece', () => {
        it('should return piece at square', () => {
            const board = createStartingBoard();

            expect(getPiece(board, 0)).toBe(Piece.WHITE_ROOK);
            expect(getPiece(board, 4)).toBe(Piece.WHITE_KING);
            expect(getPiece(board, 60)).toBe(Piece.BLACK_KING);
            expect(getPiece(board, 28)).toBe(Piece.EMPTY);
        });
    });

    describe('getBitboard', () => {
        it('should return bitboard for piece type', () => {
            const board = createStartingBoard();

            // White pawns on rank 2
            const whitePawns = getBitboard(board, Piece.WHITE_PAWN);
            expect(popCount(whitePawns)).toBe(8);

            // White king on E1 (index 4)
            const whiteKing = getBitboard(board, Piece.WHITE_KING);
            expect(whiteKing).toBe(1n << 4n);
        });
    });
});

describe('Board Copy', () => {
    it('should create independent copy', () => {
        const original = createStartingBoard();
        const copy = copyBoard(original);

        // Modify copy
        setPiece(copy, 28, Piece.WHITE_QUEEN);
        copy.turn = InternalColor.BLACK;

        // Original should be unchanged
        expect(getPiece(original, 28)).toBe(Piece.EMPTY);
        expect(original.turn).toBe(InternalColor.WHITE);
    });

    it('should copy all properties', () => {
        const original = createStartingBoard();
        original.enPassantSquare = 20;
        original.halfMoveClock = 5;
        original.fullMoveNumber = 10;
        original.zobristHash = 12345n;

        const copy = copyBoard(original);

        expect(copy.enPassantSquare).toBe(20);
        expect(copy.halfMoveClock).toBe(5);
        expect(copy.fullMoveNumber).toBe(10);
        expect(copy.zobristHash).toBe(12345n);
    });
});

describe('Piece Color Functions', () => {
    describe('isPieceColor', () => {
        it('should identify white pieces', () => {
            expect(isPieceColor(Piece.WHITE_PAWN, InternalColor.WHITE)).toBe(true);
            expect(isPieceColor(Piece.WHITE_KING, InternalColor.WHITE)).toBe(true);
            expect(isPieceColor(Piece.BLACK_PAWN, InternalColor.WHITE)).toBe(false);
            expect(isPieceColor(Piece.EMPTY, InternalColor.WHITE)).toBe(false);
        });

        it('should identify black pieces', () => {
            expect(isPieceColor(Piece.BLACK_PAWN, InternalColor.BLACK)).toBe(true);
            expect(isPieceColor(Piece.BLACK_KING, InternalColor.BLACK)).toBe(true);
            expect(isPieceColor(Piece.WHITE_PAWN, InternalColor.BLACK)).toBe(false);
            expect(isPieceColor(Piece.EMPTY, InternalColor.BLACK)).toBe(false);
        });
    });

    describe('getPieceColor', () => {
        it('should return piece color', () => {
            expect(getPieceColor(Piece.WHITE_PAWN)).toBe(InternalColor.WHITE);
            expect(getPieceColor(Piece.WHITE_KING)).toBe(InternalColor.WHITE);
            expect(getPieceColor(Piece.BLACK_PAWN)).toBe(InternalColor.BLACK);
            expect(getPieceColor(Piece.BLACK_KING)).toBe(InternalColor.BLACK);
            expect(getPieceColor(Piece.EMPTY)).toBe(null);
        });
    });

    describe('oppositeColor', () => {
        it('should return opposite color', () => {
            expect(oppositeColor(InternalColor.WHITE)).toBe(InternalColor.BLACK);
            expect(oppositeColor(InternalColor.BLACK)).toBe(InternalColor.WHITE);
        });
    });
});

describe('Square Query Functions', () => {
    let board: any;

    beforeEach(() => {
        board = createEmptyBoard();
        setPiece(board, 28, Piece.WHITE_PAWN); // E4
        setPiece(board, 36, Piece.BLACK_PAWN); // E5
    });

    describe('isSquareEmpty', () => {
        it('should identify empty squares', () => {
            expect(isSquareEmpty(board, 0)).toBe(true);
            expect(isSquareEmpty(board, 28)).toBe(false);
        });
    });

    describe('isSquareEnemy', () => {
        it('should identify enemy pieces', () => {
            expect(isSquareEnemy(board, 36, InternalColor.WHITE)).toBe(true);
            expect(isSquareEnemy(board, 28, InternalColor.WHITE)).toBe(false);
            expect(isSquareEnemy(board, 0, InternalColor.WHITE)).toBe(false);
        });
    });

    describe('isSquareFriendly', () => {
        it('should identify friendly pieces', () => {
            expect(isSquareFriendly(board, 28, InternalColor.WHITE)).toBe(true);
            expect(isSquareFriendly(board, 36, InternalColor.WHITE)).toBe(false);
            expect(isSquareFriendly(board, 0, InternalColor.WHITE)).toBe(false);
        });
    });
});
