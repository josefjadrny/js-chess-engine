/**
 * FEN import/export integration tests (ported from v1)
 */

import { Game } from '../../src';

describe('FEN Export', () => {
    it('should export FEN for new board', () => {
        const expectedFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
        const game = new Game();
        expect(game.exportFEN()).toEqual(expectedFen);
    });

    it('should export FEN after E2 to E4', () => {
        const expectedFen = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1';
        const game = new Game();
        game.move('E2', 'E4');
        expect(game.exportFEN()).toEqual(expectedFen);
    });

    it('should export FEN after E2-E4 and C7-C5', () => {
        const expectedFen = 'rnbqkbnr/pp1ppppp/8/2p5/4P3/8/PPPP1PPP/RNBQKBNR w KQkq c6 0 2';
        const game = new Game();
        game.move('E2', 'E4');
        game.move('C7', 'C5');
        expect(game.exportFEN()).toEqual(expectedFen);
    });

    it('should export FEN after E2-E4, C7-C5, E1-E2 (white king moves)', () => {
        const expectedFen = 'rnbqkbnr/pp1ppppp/8/2p5/4P3/8/PPPPKPPP/RNBQ1BNR b kq - 1 2';
        const game = new Game();
        game.move('E2', 'E4');
        game.move('C7', 'C5');
        game.move('E1', 'E2');
        expect(game.exportFEN()).toEqual(expectedFen);
    });

    it('should export FEN after E2-E4, C7-C5, E1-E2, D7-D6', () => {
        const expectedFen = 'rnbqkbnr/pp2pppp/3p4/2p5/4P3/8/PPPPKPPP/RNBQ1BNR w kq - 0 3';
        const game = new Game();
        game.move('E2', 'E4');
        game.move('C7', 'C5');
        game.move('E1', 'E2');
        game.move('D7', 'D6');
        expect(game.exportFEN()).toEqual(expectedFen);
    });

    it('should export FEN after E2-E4, C7-C5, E1-E2, D7-D6, G1-F3', () => {
        const expectedFen = 'rnbqkbnr/pp2pppp/3p4/2p5/4P3/5N2/PPPPKPPP/RNBQ1B1R b kq - 1 3';
        const game = new Game();
        game.move('E2', 'E4');
        game.move('C7', 'C5');
        game.move('E1', 'E2');
        game.move('D7', 'D6');
        game.move('G1', 'F3');
        expect(game.exportFEN()).toEqual(expectedFen);
    });

    it('should export FEN after E2-E4, C7-C5, E1-E2, D7-D6, G1-F3, E8-D7 (both kings moved)', () => {
        const expectedFen = 'rnbq1bnr/pp1kpppp/3p4/2p5/4P3/5N2/PPPPKPPP/RNBQ1B1R w - - 2 4';
        const game = new Game();
        game.move('E2', 'E4');
        game.move('C7', 'C5');
        game.move('E1', 'E2');
        game.move('D7', 'D6');
        game.move('G1', 'F3');
        game.move('E8', 'D7');
        expect(game.exportFEN()).toEqual(expectedFen);
    });
});

describe('FEN Import', () => {
    it('should import FEN for new board and match entire board state', () => {
        const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
        const game = new Game(fen);

        // Verify round-trip: import FEN → export FEN → should match original
        expect(game.exportFEN()).toEqual(fen);

        // Also verify key properties
        const config = game.exportJson();
        expect(config.turn).toEqual('white');
        expect(config.castling.whiteShort).toBe(true);
        expect(config.castling.whiteLong).toBe(true);
        expect(config.castling.blackShort).toBe(true);
        expect(config.castling.blackLong).toBe(true);
        expect(config.halfMove).toBe(0);
        expect(config.fullMove).toBe(1);

        // Count total pieces to ensure all 32 are present
        expect(Object.keys(config.pieces).length).toBe(32);
    });

    it('should import FEN after E2-E4 and match entire board state', () => {
        const fen = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1';
        const game = new Game(fen);

        // Verify round-trip FEN conversion
        expect(game.exportFEN()).toEqual(fen);

        const config = game.exportJson();
        expect(config.turn).toEqual('black');
        expect(config.enPassant).toEqual('E3');
        expect(config.halfMove).toBe(0);
        expect(config.fullMove).toBe(1);
        expect(Object.keys(config.pieces).length).toBe(32);
    });

    it('should import FEN after E2-E4, C7-C5, E1-E2 and match entire board state', () => {
        const fen = 'rnbqkbnr/pp1ppppp/8/2p5/4P3/8/PPPPKPPP/RNBQ1BNR b kq - 1 2';
        const game = new Game(fen);

        // Verify round-trip FEN conversion
        expect(game.exportFEN()).toEqual(fen);

        const config = game.exportJson();
        expect(config.turn).toEqual('black');
        expect(config.halfMove).toBe(1);
        expect(config.fullMove).toBe(2);
        expect(config.castling.whiteLong).toBe(false);
        expect(config.castling.whiteShort).toBe(false);
        expect(config.castling.blackLong).toBe(true);
        expect(config.castling.blackShort).toBe(true);
        expect(Object.keys(config.pieces).length).toBe(32);
    });

    it('should import complex position with captures and match entire board state', () => {
        // Position after Scholar's Mate attempt: 1.e4 e5 2.Bc4 Nc6 3.Qh5 Nf6 4.Qxf7# (modified to avoid checkmate)
        const fen = 'r1bqkb1r/pppp1Qpp/2n2n2/4p3/2B1P3/8/PPPP1PPP/RNB1K1NR b KQkq - 0 4';
        const game = new Game(fen);

        // Verify round-trip FEN conversion
        expect(game.exportFEN()).toEqual(fen);

        const config = game.exportJson();
        expect(config.turn).toEqual('black');
        expect(config.halfMove).toBe(0);
        expect(config.fullMove).toBe(4);
        // Should have 31 pieces (1 pawn captured - f7)
        expect(Object.keys(config.pieces).length).toBe(31);
    });

    it('should import position with no castling rights and match entire board state', () => {
        const fen = 'rnbq1bnr/pp1kpppp/3p4/2p5/4P3/5N2/PPPPKPPP/RNBQ1B1R w - - 2 4';
        const game = new Game(fen);

        // Verify round-trip FEN conversion
        expect(game.exportFEN()).toEqual(fen);

        const config = game.exportJson();
        expect(config.turn).toEqual('white');
        expect(config.castling.whiteShort).toBe(false);
        expect(config.castling.whiteLong).toBe(false);
        expect(config.castling.blackShort).toBe(false);
        expect(config.castling.blackLong).toBe(false);
        expect(config.enPassant).toBeNull();
        expect(config.halfMove).toBe(2);
        expect(config.fullMove).toBe(4);
    });

    it('should import position with partial castling rights and match entire board state', () => {
        const fen = 'r3k2r/pppppppp/8/8/8/8/PPPPPPPP/R3K2R w KQkq - 0 1';
        const game = new Game(fen);

        // Verify round-trip FEN conversion
        expect(game.exportFEN()).toEqual(fen);

        const config = game.exportJson();
        expect(config.turn).toEqual('white');
        expect(config.castling.whiteShort).toBe(true);
        expect(config.castling.whiteLong).toBe(true);
        expect(config.castling.blackShort).toBe(true);
        expect(config.castling.blackLong).toBe(true);
        // Should have 22 pieces (2 kings, 4 rooks, 16 pawns)
        expect(Object.keys(config.pieces).length).toBe(22);
    });

    it('should recognize stalemate when importing a stalemate position via FEN', () => {
        // Black king on A8, white queen on B6, white king on D6 — black to move, no legal moves, not in check
        const fen = 'k7/8/1Q1K4/8/8/8/8/8 b - - 0 1';
        const game = new Game(fen);
        const config = game.exportJson();

        expect(config.check).toBe(false);
        expect(config.checkMate).toBe(false);
        expect(config.isFinished).toBe(true);
        expect(config.turn).toBe('black');
        expect(config.castling.whiteShort).toBe(false);
        expect(config.castling.whiteLong).toBe(false);
        expect(config.castling.blackShort).toBe(false);
        expect(config.castling.blackLong).toBe(false);
        expect(config.enPassant).toBeNull();
        expect(config.halfMove).toBe(0);
        expect(config.fullMove).toBe(1);
        expect(Object.keys(config.pieces).length).toBe(3);
        expect(game.exportFEN()).toEqual(fen);

        // No legal moves in stalemate
        const legalMoves = game.moves();
        expect(Object.keys(legalMoves).length).toBe(0);
    });

    it('should recognize check when importing a check position via FEN', () => {
        // White queen on E7 checking black king on E8
        const fen = 'rnbqkbnr/ppppQppp/8/8/4P3/8/PPPP1PPP/RNB1KBNR b KQkq - 0 2';
        const game = new Game(fen);
        const config = game.exportJson();

        expect(config.check).toBe(true);
        expect(config.checkMate).toBe(false);
        expect(config.isFinished).toBe(false);
        expect(config.turn).toBe('black');
        expect(config.castling.whiteShort).toBe(true);
        expect(config.castling.whiteLong).toBe(true);
        expect(config.castling.blackShort).toBe(true);
        expect(config.castling.blackLong).toBe(true);
        expect(config.enPassant).toBeNull();
        expect(config.halfMove).toBe(0);
        expect(config.fullMove).toBe(2);
        expect(Object.keys(config.pieces).length).toBe(31);
        expect(game.exportFEN()).toEqual(fen);

        // Must have legal moves (not checkmate)
        const legalMoves = game.moves();
        expect(Object.keys(legalMoves).length).toBeGreaterThan(0);
    });

    it('should recognize checkmate when importing a checkmate position via FEN', () => {
        // Scholar's Mate final position: 1.e4 e5 2.Bc4 Nc6 3.Qh5 Nf6?? 4.Qxf7#
        const fen = 'r1bqkb1r/pppp1Qpp/2n2n2/4p3/2B1P3/8/PPPP1PPP/RNB1K1NR b KQkq - 0 4';
        const game = new Game(fen);
        const config = game.exportJson();

        expect(config.check).toBe(true);
        expect(config.checkMate).toBe(true);
        expect(config.isFinished).toBe(true);
        expect(config.turn).toBe('black');
        expect(config.castling.whiteShort).toBe(true);
        expect(config.castling.whiteLong).toBe(true);
        expect(config.castling.blackShort).toBe(true);
        expect(config.castling.blackLong).toBe(true);
        expect(config.enPassant).toBeNull();
        expect(config.halfMove).toBe(0);
        expect(config.fullMove).toBe(4);
        expect(Object.keys(config.pieces).length).toBe(31);
        expect(game.exportFEN()).toEqual(fen);

        // No legal moves in checkmate
        const legalMoves = game.moves();
        expect(Object.keys(legalMoves).length).toBe(0);
    });

    it('should import position with high move counters and match entire board state', () => {
        const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 50 100';
        const game = new Game(fen);

        // Verify round-trip FEN conversion
        expect(game.exportFEN()).toEqual(fen);

        const config = game.exportJson();
        expect(config.halfMove).toBe(50);
        expect(config.fullMove).toBe(100);
    });
});
