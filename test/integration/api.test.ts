/**
 * API integration tests for Game class
 */

import { Game, moves, status, getFen, move as makeMove } from '../../src';

describe('Game API', () => {
    describe('Constructor', () => {
        it('should create new game with default position', () => {
            const game = new Game();
            const config = game.exportJson();

            expect(config.pieces['E1']).toBe('K');
            expect(config.pieces['E8']).toBe('k');
            expect(config.turn).toBe('white');
        });

        it('should create game from FEN string', () => {
            const fen = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1';
            const game = new Game(fen);
            const config = game.exportJson();

            expect(config.pieces['E4']).toBe('P');
            expect(config.turn).toBe('black');
        });

        it('should create game from board configuration', () => {
            const config = {
                pieces: { E1: 'K' as const, E8: 'k' as const },
                turn: 'white' as const,
                castling: {
                    whiteShort: false,
                    whiteLong: false,
                    blackShort: false,
                    blackLong: false,
                },
                enPassant: null,
                halfMove: 0,
                fullMove: 1,
                check: false,
                checkMate: false,
                isFinished: false,
            };

            const game = new Game(config);
            const exported = game.exportJson();

            expect(exported.pieces['E1']).toBe('K');
            expect(exported.pieces['E8']).toBe('k');
        });
    });

    describe('move()', () => {
        it('should make a legal move', () => {
            const game = new Game();
            const result = game.move('E2', 'E4');

            expect(result.pieces['E4']).toBe('P');
            expect(result.pieces['E2']).toBeUndefined();
            expect(result.turn).toBe('black');
        });

        it('should accept case-insensitive square notation', () => {
            const game = new Game();
            game.move('e2', 'e4');
            const config = game.exportJson();

            expect(config.pieces['E4']).toBe('P');
        });

        it('should throw error for illegal move', () => {
            const game = new Game();
            expect(() => game.move('E2', 'E5')).toThrow();
        });

        it('should update turn after move', () => {
            const game = new Game();
            game.move('E2', 'E4');
            const config = game.exportJson();

            expect(config.turn).toBe('black');
        });
    });

    describe('moves()', () => {
        it('should return all legal moves when no square specified', () => {
            const game = new Game();
            const allMoves = game.moves();

            expect(Object.keys(allMoves).length).toBeGreaterThan(0);
            expect(allMoves['E2']).toContain('E4');
            expect(allMoves['E2']).toContain('E3');
        });

        it('should return moves for specific square', () => {
            const game = new Game();
            const e2Moves = game.moves('E2');

            expect(Object.keys(e2Moves)).toEqual(['E2']);
            expect(e2Moves['E2']).toContain('E4');
            expect(e2Moves['E2']).toContain('E3');
        });

        it('should accept case-insensitive square', () => {
            const game = new Game();
            const e2Moves = game.moves('e2');

            expect(Object.keys(e2Moves)).toEqual(['E2']);
            expect(e2Moves['E2']).toContain('E4');
        });
    });

    describe('setPiece() and removePiece()', () => {
        it('should set a piece on a square', () => {
            const game = new Game();
            game.removePiece('E2');
            game.setPiece('E5', 'P');
            const config = game.exportJson();

            expect(config.pieces['E5']).toBe('P');
            expect(config.pieces['E2']).toBeUndefined();
        });

        it('should remove a piece from a square', () => {
            const game = new Game();
            game.removePiece('E2');
            const config = game.exportJson();

            expect(config.pieces['E2']).toBeUndefined();
        });

        it('should accept case-insensitive squares', () => {
            const game = new Game();
            game.removePiece('e2');
            game.setPiece('e5', 'P');
            const config = game.exportJson();

            expect(config.pieces['E5']).toBe('P');
        });
    });

    describe('getHistory()', () => {
        it('should return empty history for new game', () => {
            const game = new Game();
            const history = game.getHistory();

            expect(history).toEqual([]);
        });

        it('should track moves in history', () => {
            const game = new Game();
            game.move('E2', 'E4');
            game.move('E7', 'E5');

            const history = game.getHistory();

            expect(history.length).toBe(2);
            expect(history[0].move).toEqual({ E2: 'E4' });
            expect(history[1].move).toEqual({ E7: 'E5' });
        });

        it('should include board state after each move', () => {
            const game = new Game();
            game.move('E2', 'E4');

            const history = game.getHistory();

            expect(history[0].pieces['E4']).toBe('P');
            expect(history[0].turn).toBe('black');
        });
    });

    describe('exportJson()', () => {
        it('should export current board configuration', () => {
            const game = new Game();
            const config = game.exportJson();

            expect(config.pieces).toBeDefined();
            expect(config.turn).toBe('white');
            expect(config.castling).toBeDefined();
            expect(config.check).toBe(false);
            expect(config.checkMate).toBe(false);
        });
    });

    describe('exportFEN()', () => {
        it('should export FEN for starting position', () => {
            const game = new Game();
            const fen = game.exportFEN();

            expect(fen).toBe('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
        });
    });
});

describe('Stateless Functions', () => {
    describe('moves()', () => {
        it('should return moves for FEN string', () => {
            const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
            const allMoves = moves(fen);

            expect(Object.keys(allMoves).length).toBeGreaterThan(0);
        });
    });

    describe('status()', () => {
        it('should return board status', () => {
            const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
            const config = status(fen);

            expect(config.turn).toBe('white');
            expect(config.check).toBe(false);
        });
    });

    describe('getFen()', () => {
        it('should return FEN string', () => {
            const inputFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
            const outputFen = getFen(inputFen);

            expect(outputFen).toBe(inputFen);
        });
    });

    describe('move()', () => {
        it('should make a move and return new configuration', () => {
            const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
            const config = makeMove(fen, 'E2', 'E4');

            expect(config.pieces['E4']).toBe('P');
            expect(config.turn).toBe('black');
        });
    });
});
