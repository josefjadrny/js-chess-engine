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
    it('should import FEN for new board', () => {
        const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
        const game = new Game(fen);
        const config = game.exportJson();

        expect(config.pieces['E1']).toEqual('K');
        expect(config.pieces['E8']).toEqual('k');
        expect(config.pieces['A1']).toEqual('R');
        expect(config.pieces['H8']).toEqual('r');
        expect(config.turn).toEqual('white');
        expect(config.castling.whiteShort).toBe(true);
        expect(config.castling.whiteLong).toBe(true);
        expect(config.castling.blackShort).toBe(true);
        expect(config.castling.blackLong).toBe(true);
    });

    it('should import FEN after E2-E4', () => {
        const fen = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1';
        const game = new Game(fen);
        const config = game.exportJson();

        expect(config.turn).toEqual('black');
        expect(config.pieces['E4']).toEqual('P');
        expect(config.pieces['E2']).toBeUndefined();
        expect(config.enPassant).toEqual('E3');
    });

    it('should import FEN after E2-E4, C7-C5, E1-E2', () => {
        const fen = 'rnbqkbnr/pp1ppppp/8/2p5/4P3/8/PPPPKPPP/RNBQ1BNR b kq - 1 2';
        const game = new Game(fen);
        const config = game.exportJson();

        expect(config.turn).toEqual('black');
        expect(config.pieces['E4']).toEqual('P');
        expect(config.pieces['C5']).toEqual('p');
        expect(config.pieces['E2']).toEqual('K');
        expect(config.pieces['E1']).toBeUndefined();
        expect(config.halfMove).toBe(1);
        expect(config.fullMove).toBe(2);
        expect(config.castling.whiteLong).toBe(false);
        expect(config.castling.whiteShort).toBe(false);
        expect(config.castling.blackLong).toBe(true);
        expect(config.castling.blackShort).toBe(true);
    });
});
