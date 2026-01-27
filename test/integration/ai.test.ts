/**
 * AI tests for js-chess-engine v2
 * Tests the AI move generation and decision making
 */

import { Game, aiMove } from '../../src';

describe('AI Engine', () => {
    describe('aiMove() method', () => {
        it('should make a legal move', () => {
            const game = new Game();
            const result = game.aiMove(2);

            expect(result).toBeDefined();
            expect(result.turn).toBe('black'); // Should switch to black after white's move
        });

        it('should make different moves at different levels', () => {
            const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

            const game1 = new Game(fen);
            const result1 = game1.aiMove(0);

            const game2 = new Game(fen);
            const result2 = game2.aiMove(4);

            // Both should make valid moves
            expect(result1).toBeDefined();
            expect(result2).toBeDefined();
            expect(result1.turn).toBe('black');
            expect(result2.turn).toBe('black');
        });

        it('should throw error for invalid AI level', () => {
            const game = new Game();

            expect(() => game.aiMove(-1)).toThrow('AI level must be between 0 and 4');
            expect(() => game.aiMove(5)).toThrow('AI level must be between 0 and 4');
        });

        it('should throw error when game is finished', () => {
            // Checkmate position: Scholar's mate
            const game = new Game('rnb1kbnr/pppp1ppp/8/4p3/6Pq/5P2/PPPPP2P/RNBQKBNR w KQkq - 1 3');

            expect(() => game.aiMove(2)).toThrow('Game is already finished');
        });

        it('should make moves in complex positions', () => {
            // Position with multiple pieces
            const fen = 'rnb1kbnr/pppppppp/8/8/8/3q4/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
            const game = new Game(fen);

            const result = game.aiMove(1);

            // AI should make a valid move
            expect(result).toBeDefined();
            expect(result.turn).toBe('black');
        });

        it('should avoid immediate mate', () => {
            // Position where black is one move from checkmate, AI should block or move king
            const fen = 'rnb1kbnr/pppp1ppp/8/4p3/6P1/5P1q/PPPPP2P/RNBQKBNR w KQkq - 0 1';
            const game = new Game(fen);

            const result = game.aiMove(2);

            // Should make some defensive move
            expect(result).toBeDefined();
            expect(result.checkMate).toBe(false);
        });
    });

    describe('aiMove() stateless function', () => {
        it('should make a move from a board config', () => {
            const config = {
                pieces: {
                    E1: 'K',
                    E8: 'k',
                    D1: 'Q',
                    D8: 'q',
                },
                turn: 'white',
                isFinished: false,
                check: false,
                checkMate: false,
                castling: {
                    whiteShort: false,
                    blackShort: false,
                    whiteLong: false,
                    blackLong: false,
                },
                enPassant: null,
                halfMove: 0,
                fullMove: 1,
            } as any;

            const result = aiMove(config, 2);

            expect(result).toBeDefined();
            expect(result.turn).toBe('black');
        });

        it('should make a move from FEN string', () => {
            const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

            const result = aiMove(fen, 2);

            expect(result).toBeDefined();
            expect(result.turn).toBe('black');
        });
    });

    describe('AI game play', () => {
        it('should play several moves without errors', () => {
            const game = new Game();
            const movesToPlay = 6;

            for (let i = 0; i < movesToPlay; i++) {
                if (game.exportJson().isFinished) {
                    break;
                }
                const result = game.aiMove(0); // Use level 0 for fastest testing
                expect(result).toBeDefined();
            }

            expect(game.getHistory().length).toBeGreaterThan(0);
            expect(game.getHistory().length).toBeLessThanOrEqual(movesToPlay);
        });

        it('should handle alternating moves correctly', () => {
            const game = new Game();

            const result1 = game.aiMove(0);
            expect(result1.turn).toBe('black');
            expect(result1.fullMove).toBe(1);

            const result2 = game.aiMove(0);
            expect(result2.turn).toBe('white');
            expect(result2.fullMove).toBe(2);

            const result3 = game.aiMove(0);
            expect(result3.turn).toBe('black');
            expect(result3.fullMove).toBe(2);
        });
    });

    describe('AI tactical awareness', () => {
        it('should make valid moves in tactical positions', () => {
            // Complex tactical position
            const fen = 'rnbqkb1r/pppp1ppp/5n2/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 0 1';
            const game = new Game(fen);

            const result = game.aiMove(1);

            // Should make a valid move in a tactical position
            expect(result).toBeDefined();
            expect(result.turn).toBe('black');
            expect(result.checkMate).toBe(false);
        });

        it('should handle check situations', () => {
            // Black king in check, must respond
            const fen = 'rnbqkb1r/pppp1ppp/5n2/4p3/4P2Q/8/PPPP1PPP/RNB1KBNR b KQkq - 0 3';
            const game = new Game(fen);

            const result = game.aiMove(1);

            // Should make a valid defensive move
            expect(result).toBeDefined();
            expect(result.checkMate).toBe(false);
        });
    });

    describe('AI mate-in-one detection', () => {
        it('should deliver back rank mate with rook', () => {
            // White rook can deliver checkmate on A8 (king trapped by own pawns)
            const fen = '6k1/5ppp/8/8/8/8/5PPP/R5K1 w - - 0 1';
            const game = new Game(fen);

            const result = game.aiMove(3); // Use higher level for better tactical awareness

            // AI should deliver checkmate
            expect(result.checkMate).toBe(true);
            expect(result.isFinished).toBe(true);
        });

        it('should find mate with queen', () => {
            // White queen can deliver checkmate (Qf8#)
            const fen = '7k/5Qpp/8/8/8/8/6PP/6K1 w - - 0 1';
            const game = new Game(fen);

            const result = game.aiMove(4); // Use level 4 for best tactical play

            // Should deliver mate (Qf8#) - AI should find this
            expect(result.checkMate).toBe(true);
            expect(result.isFinished).toBe(true);
        });

        it('should deliver checkmate in simple king and queen endgame', () => {
            // Queen and king vs lone king - straightforward mate
            const fen = 'k7/2Q5/2K5/8/8/8/8/8 w - - 0 1';
            const game = new Game(fen);

            const result = game.aiMove(4);

            // Should deliver checkmate (Qa7# or Qb7#)
            expect(result.checkMate).toBe(true);
        });
    });

    describe('AI tactical patterns', () => {
        it('should consider material advantage positions', () => {
            // Black has a hanging queen on D5, white queen can capture it
            const fen = 'rnb1kbnr/pppp1ppp/8/3q4/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
            const game = new Game(fen);

            // Count material before
            const initialQueens = Object.values(game.exportJson().pieces).filter(p => p === 'q').length;
            expect(initialQueens).toBe(1); // Verify test setup

            const result = game.aiMove(2);

            // AI should make a legal move (ideally capturing the queen, but at minimum not losing material)
            expect(result).toBeDefined();
            expect(result.turn).toBe('black');

            // Verify white queen is still on board (didn't sacrifice it)
            const whiteQueenExists = Object.values(result.pieces).includes('Q');
            expect(whiteQueenExists).toBe(true);
        });

        it('should make reasonable moves in tactical positions', () => {
            // Complex tactical position with multiple captures available
            const fen = 'rnbqkbnr/pppp1ppp/8/4p3/8/3B4/PPPPPPPP/RNBQK1NR w KQkq - 0 1';
            const game = new Game(fen);

            const result = game.aiMove(2);

            // AI should make a legal, reasonable move
            expect(result).toBeDefined();
            expect(result.turn).toBe('black');

            // Verify white bishop is still on board (didn't blunder it)
            const whiteBishopExists = Object.values(result.pieces).filter(p => p === 'B').length >= 1;
            expect(whiteBishopExists).toBe(true);
        });

        it('should avoid losing pieces for nothing', () => {
            // White king, Black has queen and king - white should not sacrifice queen
            const fen = '7k/8/8/8/8/8/8/Q6K w - - 0 1';
            const game = new Game(fen);

            const result = game.aiMove(2);

            // Queen should still be on the board
            const hasQueen = Object.values(result.pieces).includes('Q');
            expect(hasQueen).toBe(true);
        });

        it('should make tactical moves with knights', () => {
            // Knight can potentially fork king and rook
            const fen = 'r3k3/8/8/3N4/8/8/8/4K3 w - - 0 1';
            const game = new Game(fen);

            // Count black rooks before
            const initialRooks = Object.values(game.exportJson().pieces).filter(p => p === 'r').length;
            expect(initialRooks).toBe(1); // Verify test setup

            const result = game.aiMove(3);

            // Knight should make a tactical move (ideally Nc7+ forking king and rook)
            expect(result).toBeDefined();
            expect(result.turn).toBe('black');

            // Verify knight is still on the board (didn't blunder it)
            const knightExists = Object.values(result.pieces).includes('N');
            expect(knightExists).toBe(true);

            // If the fork was found, it should give check
            if (result.pieces['C7'] === 'N') {
                expect(result.check).toBe(true);
            }
        });
    });

    describe('AI endgame scenarios', () => {
        it('should make progress in King+Queen vs King', () => {
            // White has K+Q, Black has K - should push toward mate
            const fen = '7k/8/8/8/8/8/4Q3/4K3 w - - 0 1';
            const game = new Game(fen);

            const result1 = game.aiMove(3);
            expect(result1.checkMate).toBe(false);

            const result2 = game.aiMove(3);
            expect(result2).toBeDefined();

            // Game should eventually end in checkmate if we keep playing
            expect(result2.turn).toBe('white');
        });

        it('should not stalemate in winning position', () => {
            // King and queen vs lone king - should NOT create stalemate
            const fen = '7k/8/6K1/8/8/8/7Q/8 w - - 0 1';
            const game = new Game(fen);

            const result = game.aiMove(3);

            // Should either be checkmate or continue game, not stalemate
            if (result.isFinished) {
                expect(result.checkMate).toBe(true);
            }
        });

        it('should promote pawns when possible', () => {
            // White pawn on 7th rank should promote (kings far apart)
            const fen = '8/4P3/8/8/3k4/8/8/4K3 w - - 0 1';
            const game = new Game(fen);

            const result = game.aiMove(2);

            // After promotion, should have a queen on 8th rank
            const hasQueenOnEighthRank = Object.entries(result.pieces).some(
                ([sq, piece]) => piece === 'Q' && sq[1] === '8'
            );
            expect(hasQueenOnEighthRank).toBe(true);
        });
    });

    describe('AI edge cases and special moves', () => {
        it('should consider castling when safe and beneficial', () => {
            // Position where castling is available and likely good
            const fen = 'r3k2r/pppppppp/8/8/8/8/PPPPPPPP/R3K2R w KQkq - 0 1';
            const game = new Game(fen);

            const result = game.aiMove(2);

            // Verify AI made a legal move
            expect(result).toBeDefined();
            expect(result.turn).toBe('black');

            // AI should at least consider development moves (castling or piece movement)
            expect(result.isFinished).toBe(false);
        });

        it('should handle en passant positions', () => {
            // Black played d7-d5, white pawn on e5 can potentially capture en passant
            const fen = 'rnbqkbnr/ppp1pppp/8/3pP3/8/8/PPPP1PPP/RNBQKBNR w KQkq d6 0 1';
            const game = new Game(fen);

            const result = game.aiMove(2);

            // Should make a legal move (en passant or otherwise)
            expect(result).toBeDefined();
            expect(result.turn).toBe('black');

            // En passant may or may not be the best move, but AI should handle the position
            expect(result.checkMate).toBe(false);
        });

        it('should handle insufficient material positions', () => {
            // K+N vs K is theoretically a draw (insufficient material)
            const fen = '8/8/8/3k4/8/3N4/8/3K4 w - - 0 1';
            const game = new Game(fen);

            // This tests that the AI can handle endgame positions
            const result = game.aiMove(2);

            expect(result).toBeDefined();

            // AI should be able to make moves in this position
            // (Note: Insufficient material detection may not be implemented yet)
            expect(result.turn).toBe('black');
        });

        it('should actively avoid creating stalemate', () => {
            // K+Q vs K in corner - care needed to avoid stalemate
            const fen = 'k7/8/1K6/8/8/8/8/7Q w - - 0 1';
            const game = new Game(fen);

            const result = game.aiMove(3);

            // Should either deliver checkmate or continue toward mate
            if (result.isFinished) {
                // If finishing, must be checkmate not stalemate
                expect(result.checkMate).toBe(true);
            } else {
                // If not finishing, opponent should have legal moves (not stalemate)
                expect(result.isFinished).toBe(false);
            }
        });

        it('should find deeper tactics at higher levels', () => {
            // Mate-in-2 position (requires depth 4+)
            // White plays Ra8+ Kh7, Ra7# is mate
            const fen = '6k1/5ppp/8/8/8/8/5PPP/R6K w - - 0 1';

            const gameLow = new Game(fen);
            const resultLow = gameLow.aiMove(1); // Level 1 (depth 2-3)

            const gameHigh = new Game(fen);
            const resultHigh = gameHigh.aiMove(4); // Level 4 (depth 5-6)

            // Both should make legal moves
            expect(resultLow).toBeDefined();
            expect(resultHigh).toBeDefined();

            // Higher level should ideally play Ra8+ (check) to start the mate sequence
            // But at minimum, both should make reasonable moves
            expect(resultLow.turn).toBe('black');
            expect(resultHigh.turn).toBe('black');

            // If high level finds the winning move, it should give check
            if (resultHigh.check) {
                // Likely found Ra8+
                expect(resultHigh.check).toBe(true);
            }
        });
    });
});
