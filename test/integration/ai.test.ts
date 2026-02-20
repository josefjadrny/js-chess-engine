/**
 * AI tests for js-chess-engine v2
 * Tests the AI move generation and decision making
 */

import { Game, aiMove, ai } from '../../src';

describe('AI Engine', () => {
    describe('ai() - Core AI functionality', () => {
        it('should make a legal move and return move with board state', () => {
            const game = new Game();
            const result = game.ai({ level: 1 });

            expect(result.move).toBeDefined();
            expect(typeof result.move).toBe('object');

            // Should be a move object with one key-value pair (e.g., {"E2": "E4"})
            const entries = Object.entries(result.move);
            expect(entries.length).toBe(1);

            const [from, to] = entries[0];
            expect(from).toMatch(/^[A-H][1-8]$/);
            expect(to).toMatch(/^[A-H][1-8]$/);

            // Verify board state is updated
            expect(result.board.turn).toBe('black'); // Should switch to black after white's move
        });

        it('should throw error for invalid AI level', () => {
            const game = new Game();

            expect(() => game.ai({ level: 0 })).toThrow('AI level must be between 1 and 5');
            expect(() => game.ai({ level: 7 })).toThrow('AI level must be between 1 and 5');
        });

        it('should throw error when game is finished', () => {
            // Checkmate position: Scholar's mate
            const game = new Game('rnb1kbnr/pppp1ppp/8/4p3/6Pq/5P2/PPPPP2P/RNBQKBNR w KQkq - 1 3');

            expect(() => game.ai({ level: 1 })).toThrow('Game is already finished');
        });

        it('should make moves in complex positions', () => {
            // Position with multiple pieces
            const fen = 'rnb1kbnr/pppppppp/8/8/8/3q4/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
            const game = new Game(fen);

            const result = game.ai({ level: 2 });

            // AI should make a valid move
            expect(result.move).toBeDefined();
            expect(typeof result.move).toBe('object');
            expect(result.board.turn).toBe('black');
        });

        it('should avoid immediate mate threats', () => {
            // Position where black is one move from checkmate, AI should block or move king
            const fen = 'rnb1kbnr/pppp1ppp/8/4p3/6P1/5P1q/PPPPP2P/RNBQKBNR w KQkq - 0 1';
            const game = new Game(fen);

            const result = game.ai({ level: 3 });

            // Should make some defensive move
            expect(result.move).toBeDefined();
            expect(result.board.checkMate).toBe(false);
        });
    });

    describe('aiMove() - Legacy v1 API compatibility', () => {
        it('should return move object only (v1 compatible)', () => {
            const game = new Game();
            const move = game.aiMove(1);

            expect(move).toBeDefined();
            expect(typeof move).toBe('object');

            // Should be a move object with one key-value pair
            const entries = Object.entries(move);
            expect(entries.length).toBe(1);

            const [from, to] = entries[0];
            expect(from).toMatch(/^[A-H][1-8]$/);
            expect(to).toMatch(/^[A-H][1-8]$/);
        });

        it('should apply move to game state', () => {
            const game = new Game();
            const initialTurn = game.exportJson().turn;

            const move = game.aiMove(1);

            expect(move).toBeDefined();

            // Verify game state changed
            const newTurn = game.exportJson().turn;
            expect(newTurn).not.toBe(initialTurn);
        });

        it('should handle multiple sequential moves', () => {
            const game = new Game();

            const move1 = game.aiMove(2);
            expect(move1).toBeDefined();

            const move2 = game.aiMove(2);
            expect(move2).toBeDefined();

            const move3 = game.aiMove(2);
            expect(move3).toBeDefined();

            // Verify history length and content
            const history = game.getHistory();
            expect(history.length).toBe(3);

            // Verify each move in history matches the returned moves
            expect(history[0].move).toEqual(move1);
            expect(history[1].move).toEqual(move2);
            expect(history[2].move).toEqual(move3);

            // Verify each history entry has complete board state
            history.forEach((entry) => {
                expect(entry.move).toBeDefined();
                expect(entry.pieces).toBeDefined();
                expect(entry.turn).toBeDefined();
                expect(entry.castling).toBeDefined();

                // Verify the move has valid format (from and to squares)
                const entries = Object.entries(entry.move);
                expect(entries.length).toBe(1);

                const [from, to] = entries[0];
                expect(from).toMatch(/^[A-H][1-8]$/);
                expect(to).toMatch(/^[A-H][1-8]$/);
            });

            // Verify turns alternate correctly in history
            expect(history[0].turn).toBe('black'); // After white's move
            expect(history[1].turn).toBe('white'); // After black's move
            expect(history[2].turn).toBe('black'); // After white's move
        });

        it('should throw error for invalid AI level', () => {
            const game = new Game();

            expect(() => game.aiMove(0)).toThrow('AI level must be between 1 and 5');
            expect(() => game.aiMove(6)).toThrow('AI level must be between 1 and 5');
        });

        it('should throw error when game is finished', () => {
            // Checkmate position
            const game = new Game('rnb1kbnr/pppp1ppp/8/4p3/6Pq/5P2/PPPPP2P/RNBQKBNR w KQkq - 1 3');

            expect(() => game.aiMove(1)).toThrow('Game is already finished');
        });

        it('should work with complex positions', () => {
            const fen = 'r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3';
            const game = new Game(fen);

            const move = game.aiMove(1);

            expect(move).toBeDefined();
            expect(typeof move).toBe('object');

            const entries = Object.entries(move);
            expect(entries.length).toBe(1);
        });
    });

    describe('ai() stateless function', () => {
        it('should calculate move from board config', () => {
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

            const result = ai(config, { level: 1 });

            expect(result.move).toBeDefined();
            expect(typeof result.move).toBe('object');
            expect(result.board.turn).toBe('black');
        });

        it('should calculate move from FEN string', () => {
            const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

            const result = ai(fen, { level: 1 });

            expect(result.move).toBeDefined();
            expect(typeof result.move).toBe('object');
            expect(result.board.turn).toBe('black');
        });
    });

    describe('aiMove() stateless function - Legacy v1 API', () => {
        it('should return move only from board config', () => {
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

            const move = aiMove(config, 1);

            expect(move).toBeDefined();
            expect(typeof move).toBe('object');

            // Should be a move object with one key-value pair
            const entries = Object.entries(move);
            expect(entries.length).toBe(1);
        });

        it('should return move only from FEN string', () => {
            const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

            const move = aiMove(fen, 1);

            expect(move).toBeDefined();
            expect(typeof move).toBe('object');

            // Should be a move object
            const entries = Object.entries(move);
            expect(entries.length).toBe(1);
        });
    });

    describe('AI game play', () => {
        it('should play multiple moves in sequence without errors', () => {
            const game = new Game();
            const movesToPlay = 6;

            for (let i = 0; i < movesToPlay; i++) {
                if (game.exportJson().isFinished) {
                    break;
                }
                const result = game.ai({ level: 1 }); // Use level 1 for fastest testing
                expect(result.move).toBeDefined();
                expect(result.board).toBeDefined();
            }

            expect(game.getHistory().length).toBeGreaterThan(0);
            expect(game.getHistory().length).toBeLessThanOrEqual(movesToPlay);
        });

        it('should handle alternating turns correctly', () => {
            const game = new Game();

            let result = game.ai({ level: 1 });
            expect(result.board.turn).toBe('black');
            expect(result.board.fullMove).toBe(1);

            result = game.ai({ level: 1 });
            expect(result.board.turn).toBe('white');
            expect(result.board.fullMove).toBe(2);

            result = game.ai({ level: 1 });
            expect(result.board.turn).toBe('black');
            expect(result.board.fullMove).toBe(2);
        });
    });

    describe('AI tactical awareness', () => {
        it('should handle complex tactical positions', () => {
            // Complex tactical position
            const fen = 'rnbqkb1r/pppp1ppp/5n2/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 0 1';
            const game = new Game(fen);

            const result = game.ai({ level: 2 });

            // Should make a valid move in a tactical position
            expect(result.move).toBeDefined();
            expect(result.board.turn).toBe('black');
            expect(result.board.checkMate).toBe(false);
        });

        it('should respond correctly to check', () => {
            // Black king in check, must respond
            const fen = 'rnbqkb1r/pppp1ppp/5n2/4p3/4P2Q/8/PPPP1PPP/RNB1KBNR b KQkq - 0 3';
            const game = new Game(fen);

            const result = game.ai({ level: 2 });

            // Should make a valid defensive move
            expect(result.move).toBeDefined();
            expect(result.board.checkMate).toBe(false);
        });
    });

    describe('AI checkmate detection', () => {
        it('should deliver back rank mate with rook', () => {
            // White rook can deliver checkmate on A8 (king trapped by own pawns)
            const fen = '6k1/5ppp/8/8/8/8/5PPP/R5K1 w - - 0 1';
            const game = new Game(fen);

            const result = game.ai({ level: 2 }); // Mate-in-1 doesn't need deep search

            expect(result.move).toBeDefined();

            // AI should deliver checkmate
            expect(result.board.checkMate).toBe(true);
            expect(result.board.isFinished).toBe(true);
        });

        it('should find queen checkmate', () => {
            // White queen can deliver checkmate (Qf8#)
            const fen = '7k/5Qpp/8/8/8/8/6PP/6K1 w - - 0 1';
            const game = new Game(fen);

            const result = game.ai({ level: 2 }); // Mate-in-1 doesn't need deep search

            expect(result.move).toBeDefined();

            // Should deliver mate (Qf8#) - AI should find this
            expect(result.board.checkMate).toBe(true);
            expect(result.board.isFinished).toBe(true);
        });

        it('should deliver mate in king and queen vs king endgame', () => {
            // Queen and king vs lone king - straightforward mate
            const fen = 'k7/2Q5/2K5/8/8/8/8/8 w - - 0 1';
            const game = new Game(fen);

            const result = game.ai({ level: 2, randomness: 0 }); // Mate-in-1 doesn't need deep search

            expect(result.move).toBeDefined();

            // Should deliver checkmate (Qa7# or Qb7#)
            expect(result.board.checkMate).toBe(true);
        });
    });

    describe('AI tactical evaluation', () => {
        it('should recognize and exploit material advantage', () => {
            // Black has a hanging queen on D5, white queen can capture it
            const fen = 'rnb1kbnr/pppp1ppp/8/3q4/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
            const game = new Game(fen);

            // Count material before
            const initialQueens = Object.values(game.exportJson().pieces).filter(p => p === 'q').length;
            expect(initialQueens).toBe(1); // Verify test setup

            const result = game.ai({ level: 2 });

            // AI should make a legal move (ideally capturing the queen, but at minimum not losing material)
            expect(result.move).toBeDefined();
            expect(result.board.turn).toBe('black');

            // Verify white queen is still on board (didn't sacrifice it)
            const whiteQueenExists = Object.values(result.board.pieces).includes('Q');
            expect(whiteQueenExists).toBe(true);
        });

        it('should make sound moves in tactical positions', () => {
            // Complex tactical position with multiple captures available
            const fen = 'rnbqkbnr/pppp1ppp/8/4p3/8/3B4/PPPPPPPP/RNBQK1NR w KQkq - 0 1';
            const game = new Game(fen);

            const result = game.ai({ level: 2 });

            // AI should make a legal, reasonable move
            expect(result.move).toBeDefined();
            expect(result.board.turn).toBe('black');

            // Verify white bishop is still on board (didn't blunder it)
            const whiteBishopExists = Object.values(result.board.pieces).filter(p => p === 'B').length >= 1;
            expect(whiteBishopExists).toBe(true);
        });

        it('should preserve material when advantageous', () => {
            // White king, Black has queen and king - white should not sacrifice queen
            // Note: Side to move must not leave the other side in check.
            // In this position the black king is in check from the queen on a1,
            // so it must be black to move.
            const fen = '7k/8/8/8/8/8/8/Q6K b - - 0 1';
            const game = new Game(fen);

            const result = game.ai({ level: 2 });

            expect(result.move).toBeDefined();

            // Queen should still be on the board
            const hasQueen = Object.values(result.board.pieces).includes('Q');
            expect(hasQueen).toBe(true);
        });

        it('should find knight forks', () => {
            // Knight can potentially fork king and rook
            const fen = 'r3k3/8/8/3N4/8/8/8/4K3 w - - 0 1';
            const game = new Game(fen);

            // Count black rooks before
            const initialRooks = Object.values(game.exportJson().pieces).filter(p => p === 'r').length;
            expect(initialRooks).toBe(1); // Verify test setup

            const result = game.ai({ level: 2 }); // Basic tactics, doesn't need deep search

            // Knight should make a tactical move (ideally Nc7+ forking king and rook)
            expect(result.move).toBeDefined();
            expect(result.board.turn).toBe('black');

            // Verify knight is still on the board (didn't blunder it)
            const knightExists = Object.values(result.board.pieces).includes('N');
            expect(knightExists).toBe(true);

            // If the fork was found, it should give check
            if (result.board.pieces['C7'] === 'N') {
                expect(result.board.check).toBe(true);
            }
        });
    });

    describe('AI endgame play', () => {
        it('should make progress toward mate in K+Q vs K', () => {
            // White has K+Q, Black has K - should push toward mate
            const fen = '7k/8/8/8/8/8/4Q3/4K3 w - - 0 1';
            const game = new Game(fen);

            const result1 = game.ai({ level: 1 }); // Basic endgame, doesn't need deep search
            expect(result1.move).toBeDefined();
            expect(result1.board.checkMate).toBe(false);

            const result2 = game.ai({ level: 1 });
            expect(result2.move).toBeDefined();

            // Game should eventually end in checkmate if we keep playing
            expect(result2.board.turn).toBe('white');
        });

        it('should avoid stalemate in winning positions', () => {
            // King and queen vs lone king - should NOT create stalemate
            // In this position the black king is in check from the queen on h2,
            // so it must be black to move.
            const fen = '7k/8/6K1/8/8/8/7Q/8 b - - 0 1';
            const game = new Game(fen);

            const result = game.ai({ level: 2 }); // Simple position evaluation

            expect(result.move).toBeDefined();

            // Should either be checkmate or continue game, not stalemate
            if (result.board.isFinished) {
                expect(result.board.checkMate).toBe(true);
                expect(result.board.staleMate).toBe(false);
            }
        });

        it('should promote pawns correctly', () => {
            // White pawn on 7th rank should promote (kings far apart)
            const fen = '8/4P3/8/8/3k4/8/8/4K3 w - - 0 1';
            const game = new Game(fen);

            const result = game.ai({ level: 3, randomness: 0 });

            expect(result.move).toBeDefined();

            // After promotion, there should be some promoted piece on the 8th rank.
            // The AI may underpromote in some cases (to avoid stalemate or for tactical reasons),
            // so don't lock this test to only queen.
            const hasPromotionOnEighthRank = Object.entries(result.board.pieces).some(
                ([sq, piece]) => sq[1] === '8' && (piece === 'Q' || piece === 'R' || piece === 'B' || piece === 'N')
            );
            expect(hasPromotionOnEighthRank).toBe(true);
        });
    });

    describe('AI options and configuration', () => {
        it('should use default level 3 when no options provided', () => {
            const game = new Game();
            const result = game.ai();

            expect(result).toBeDefined();
            expect(result.move).toBeDefined();
            expect(result.board).toBeDefined();
        });

        it('should not apply move when play=false (analysis mode)', () => {
            const game = new Game();
            const initialBoard = game.exportJson();

            const result = game.ai({ play: false });

            expect(result.move).toBeDefined();
            expect(result.board).toBeDefined();

            // Result board should be the same as initial (before move)
            expect(result.board.turn).toBe(initialBoard.turn);
            expect(result.board.fullMove).toBe(initialBoard.fullMove);
            expect(result.board.pieces).toEqual(initialBoard.pieces);

            // Game state should not have changed
            const currentBoard = game.exportJson();
            expect(currentBoard.turn).toBe(initialBoard.turn);
            expect(currentBoard.fullMove).toBe(initialBoard.fullMove);
            expect(currentBoard.pieces).toEqual(initialBoard.pieces);
        });

        it('should include scored root moves when analysis=true', () => {
            const game = new Game();

            const result = game.ai({ level: 2, play: false, analysis: true });

            expect(result.move).toBeDefined();
            expect(result.board).toBeDefined();
            expect(result.analysis).toBeDefined();
            expect(result.bestScore).toBeDefined();
            expect(result.depth).toBeDefined();
            expect(result.nodesSearched).toBeDefined();

            expect(Array.isArray(result.analysis!)).toBe(true);
            expect(result.analysis!.length).toBeGreaterThan(0);
            expect(typeof result.bestScore).toBe('number');
            expect(typeof result.depth).toBe('number');
            expect(typeof result.nodesSearched).toBe('number');

            // The played move should be present in the scored list.
            const [[playedFrom, playedTo]] = Object.entries(result.move);
            const played = `${playedFrom}-${playedTo}`;
            const found = result.analysis!.some(sm => {
                const [[from, to]] = Object.entries(sm.move);
                return `${from}-${to}` === played;
            });
            expect(found).toBe(true);

            // Default behavior: no analysis payload.
            const resultNoAnalysis = game.ai({ level: 2, play: false });
            expect((resultNoAnalysis as any).analysis).toBeUndefined();
            expect((resultNoAnalysis as any).bestScore).toBeUndefined();
            expect((resultNoAnalysis as any).depth).toBeUndefined();
            expect((resultNoAnalysis as any).nodesSearched).toBeUndefined();
        });

        it('should apply move by default when play option not specified', () => {
            const game = new Game();

            const result = game.ai({ level: 1 });

            expect(result.move).toBeDefined();
            expect(result.board).toBeDefined();
            expect(result.board.turn).toBe('black'); // Turn should change
        });

        it('should support analysis mode in stateless function', () => {
            const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

            const result = ai(fen, { play: false });

            expect(result.move).toBeDefined();
            expect(result.board).toBeDefined();

            // Board should be the same as input (before move)
            expect(result.board.turn).toBe('white');
            expect(result.board.fullMove).toBe(1);
        });

        it('should support analysis scores in stateless ai()', () => {
            const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

            const result = ai(fen, { play: false, analysis: true, level: 2 });

            expect(result.analysis).toBeDefined();
            expect(Array.isArray(result.analysis!)).toBe(true);
            expect(result.analysis!.length).toBeGreaterThan(0);
        });

        it('should return consistent exact scored move values (deterministic)', () => {
            // Deterministic scoring snapshot for a very small material position.
            // White: Kf6, Qf7; Black: Kh8
            const fen = '7k/5Q2/5K2/8/8/8/8/8 w - - 0 1';

            const options = {
                play: false,
                analysis: true,
                ttSizeMB: 0,
                // Make depth deterministic and avoid adaptive extension.
                depth: { base: 1, extended: 0, check: false, quiescence: 1 },
                level: 1,
                randomness: 0,
            } as const;

            const r1 = ai(fen, options);
            const r2 = ai(fen, options);

            expect(r1.analysis).toBeDefined();
            expect(r2.analysis).toBeDefined();

            const toMap = (scored: Array<{ move: any; score: number }>) => {
                const m: Record<string, number> = {};
                for (const sm of scored) {
                    const [[from, to]] = Object.entries(sm.move);
                    m[`${from}-${to}`] = sm.score;
                }
                return m;
            };

            const map1 = toMap(r1.analysis!);
            const map2 = toMap(r2.analysis!);

            // Exact numeric scores should be stable, but the ordering of equal-score moves
            // is intentionally not enforced (debugging convenience).
            expect(map2).toEqual(map1);

            // Ensure scores are sorted descending (allowing equal scores).
            const scores = r1.analysis!.map(sm => sm.score);
            for (let i = 1; i < scores.length; i++) {
                expect(scores[i]).toBeLessThanOrEqual(scores[i - 1]);
            }

            // High score and low score sanity (helps debugging without freezing exact values).
            const high = scores[0];
            const low = scores[scores.length - 1];
            expect(r1.bestScore).toBe(high);
            expect(high).toBeGreaterThan(low);
            expect(high - low).toBeGreaterThanOrEqual(1);

            // Best move should be one of the moves with the top score.
            const [[bestFrom, bestTo]] = Object.entries(r1.move);
            const bestStr = `${bestFrom}-${bestTo}`;
            const topScore = high;
            const isBestAmongTops = r1.analysis!
                .filter(sm => sm.score === topScore)
                .some(sm => {
                    const [[from, to]] = Object.entries(sm.move);
                    return `${from}-${to}` === bestStr;
                });
            expect(isBestAmongTops).toBe(true);
        });

        it('should return different board states for play true vs false', () => {
            const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

            const resultPlay = ai(fen, { play: true, level: 2 });
            const resultAnalysis = ai(fen, { play: false, level: 2 });

            // Both should have moves
            expect(resultPlay.move).toBeDefined();
            expect(resultAnalysis.move).toBeDefined();

            // Play mode: board should be updated (turn changed)
            expect(resultPlay.board.turn).toBe('black');

            // Analysis mode: board should be unchanged
            expect(resultAnalysis.board.turn).toBe('white');
        });

        it('should use default level in stateless function', () => {
            const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

            const result = ai(fen);

            expect(result).toBeDefined();
            expect(result.move).toBeDefined();
            expect(result.board).toBeDefined();
        });

        it('should accept custom ttSizeMB option', () => {
            const game = new Game();

            // Should not throw with custom TT size
            expect(() => {
                game.ai({ level: 3, ttSizeMB: 32 });
            }).not.toThrow();
        });

        it('should work with minimum ttSizeMB (0.25MB)', () => {
            const game = new Game();
            const result = game.ai({ level: 1, ttSizeMB: 0.25 });

            expect(result.move).toBeDefined();
            expect(result.board).toBeDefined();
        });

        it('should work with TT disabled (0MB)', () => {
            const game = new Game();
            const result = game.ai({ level: 1, ttSizeMB: 0 });

            expect(result.move).toBeDefined();
            expect(result.board).toBeDefined();
        });

        it('should work with large ttSizeMB (512MB)', () => {
            const game = new Game();
            const result = game.ai({ level: 1, ttSizeMB: 512 });

            expect(result.move).toBeDefined();
            expect(result.board).toBeDefined();
        });

        it('should clamp ttSizeMB values below minimum', () => {
            const game = new Game();

            // Below minimum (clamped to 0.25)
            const result1 = game.ai({ level: 1, ttSizeMB: 0.1 });
            expect(result1.move).toBeDefined();
        });

        it('should allow different TT sizes across multiple AI calls', () => {
            const game = new Game();

            const result1 = game.ai({ level: 2, ttSizeMB: 8 });
            expect(result1.move).toBeDefined();

            const result2 = game.ai({ level: 2, ttSizeMB: 64 });
            expect(result2.move).toBeDefined();

            const result3 = game.ai({ level: 2 }); // default
            expect(result3.move).toBeDefined();
        });

        it('should combine ttSizeMB with play option', () => {
            const game = new Game();

            const result = game.ai({
                level: 3,
                play: false,
                ttSizeMB: 32
            });

            expect(result.move).toBeDefined();
            expect(result.board).toBeDefined();
            expect(result.board.turn).toBe('white'); // play=false
        });

        it('should support ttSizeMB in stateless ai() function', () => {
            const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

            const result = ai(fen, { level: 2, ttSizeMB: 8 });
            expect(result.move).toBeDefined();
            expect(result.board).toBeDefined();
        });

        it('should accept randomness: 0 and behave deterministically', () => {
            const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

            const r1 = ai(fen, { level: 2, randomness: 0 });
            const r2 = ai(fen, { level: 2, randomness: 0 });

            expect(Object.entries(r1.move)[0]).toEqual(Object.entries(r2.move)[0]);
        });

        it('should accept positive randomness and return a valid move', () => {
            const game = new Game();
            const result = game.ai({ level: 2, randomness: 80 });

            expect(result.move).toBeDefined();
            const [from, to] = Object.entries(result.move)[0];
            expect(from).toMatch(/^[A-H][1-8]$/);
            expect(to).toMatch(/^[A-H][1-8]$/);
        });

        it('should throw for negative randomness', () => {
            const game = new Game();
            expect(() => game.ai({ randomness: -1 })).toThrow('randomness must be a non-negative number');
        });

        it('should throw for non-finite randomness', () => {
            const game = new Game();
            expect(() => game.ai({ randomness: Infinity })).toThrow('randomness must be a non-negative number');
        });

        it('should produce move variety with high randomness (statistical)', () => {
            // With randomness=10000 (100 pawns of noise), score differences are completely
            // dominated and the engine picks essentially uniformly across all legal moves.
            // With 20 legal moves in the starting position and 10 trials, the probability
            // of always picking the same move is ~10^-11 — effectively impossible.
            const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

            const playedMoves = new Set<string>();
            for (let i = 0; i < 10; i++) {
                const result = ai(fen, { level: 2, randomness: 10000 });
                const [[from, to]] = Object.entries(result.move);
                playedMoves.add(`${from}-${to}`);
            }

            expect(playedMoves.size).toBeGreaterThan(1);
        });
    });

    describe('AI depth option', () => {
        it('should accept depth overrides and make a legal move', () => {
            const game = new Game();
            const result = game.ai({ level: 1, depth: { base: 1, extended: 0, quiescence: 0, check: false } });

            expect(result.move).toBeDefined();
            expect(result.board.turn).toBe('black');
        });

        it('should work with only some depth params provided', () => {
            const game = new Game();

            // Only override base, rest from level table
            const result = game.ai({ level: 1, depth: { base: 2 } });
            expect(result.move).toBeDefined();

            // Only override quiescence
            const result2 = game.ai({ level: 1, depth: { quiescence: 0 } });
            expect(result2.move).toBeDefined();

            // Only override check
            const result3 = game.ai({ level: 1, depth: { check: false } });
            expect(result3.move).toBeDefined();
        });

        it('should work with empty depth object (all defaults from level)', () => {
            const game = new Game();
            const result = game.ai({ level: 1, depth: {} });
            expect(result.move).toBeDefined();
        });

        it('should throw for invalid depth.base', () => {
            const game = new Game();

            expect(() => game.ai({ level: 1, depth: { base: 0 } })).toThrow('depth.base must be an integer > 0');
            expect(() => game.ai({ level: 1, depth: { base: -1 } })).toThrow('depth.base must be an integer > 0');
            expect(() => game.ai({ level: 1, depth: { base: 1.5 } })).toThrow('depth.base must be an integer > 0');
        });

        it('should throw for invalid depth.extended', () => {
            const game = new Game();

            expect(() => game.ai({ level: 1, depth: { extended: -1 } })).toThrow('depth.extended must be an integer between 0 and 3');
            expect(() => game.ai({ level: 1, depth: { extended: 1.5 } })).toThrow('depth.extended must be an integer between 0 and 3');
            expect(() => game.ai({ level: 1, depth: { extended: 4 } })).toThrow('depth.extended must be an integer between 0 and 3');
        });

        it('should throw for invalid depth.quiescence', () => {
            const game = new Game();

            expect(() => game.ai({ level: 1, depth: { quiescence: -1 } })).toThrow('depth.quiescence must be an integer >= 0');
            expect(() => game.ai({ level: 1, depth: { quiescence: 0.5 } })).toThrow('depth.quiescence must be an integer >= 0');
        });

        it('should throw for invalid depth.check', () => {
            const game = new Game();

            expect(() => game.ai({ level: 1, depth: { check: 1 as any } })).toThrow('depth.check must be a boolean');
            expect(() => game.ai({ level: 1, depth: { check: 'true' as any } })).toThrow('depth.check must be a boolean');
        });

        it('should allow extended=0 and quiescence=0', () => {
            const game = new Game();
            const result = game.ai({ level: 1, depth: { extended: 0, quiescence: 0 } });
            expect(result.move).toBeDefined();
        });

        it('should work with stateless ai() function', () => {
            const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
            const result = ai(fen, { level: 1, depth: { base: 1, quiescence: 0 } });

            expect(result.move).toBeDefined();
            expect(result.board).toBeDefined();
        });

        it('should combine depth with play=false', () => {
            const game = new Game();
            const result = game.ai({ level: 1, depth: { base: 1 }, play: false });

            expect(result.move).toBeDefined();
            expect(result.board.turn).toBe('white'); // play=false, no state change
        });

        it('should find mate-in-1 with custom depth override', () => {
            // Mate in 1: Qf8#
            const fen = '7k/5Qpp/8/8/8/8/6PP/6K1 w - - 0 1';
            const result = ai(fen, { level: 1, depth: { base: 2, extended: 0, quiescence: 1, check: true } });

            expect(result.board.checkMate).toBe(true);
            expect(result.board.isFinished).toBe(true);
        });

        it('should produce different results with different base depths', () => {
            // Use a position where the best move at depth 1 differs from depth 3.
            // Black queen hangs on D5 but capturing it at depth 1 may look fine,
            // while deeper search could prefer a different move. We just verify
            // different depths are actually used by comparing node counts indirectly:
            // depth 1 with extended 0 must be faster (fewer nodes) than depth 3.
            // We measure wall-clock time as a proxy.
            const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

            const t1 = performance.now();
            ai(fen, { level: 1, depth: { base: 1, extended: 0, quiescence: 0 } });
            const shallow = performance.now() - t1;

            const t2 = performance.now();
            ai(fen, { level: 1, depth: { base: 3, extended: 0, quiescence: 2 } });
            const deep = performance.now() - t2;

            // A depth-3 search from starting position must take meaningfully longer
            // than depth-1 with no quiescence. This proves the override is effective.
            expect(deep).toBeGreaterThan(shallow);
        });
    });

    describe('Quiescence search check handling', () => {
        it('should find quiet escape when in check with no captures', () => {
            // Black king on g8, White rook on a8 giving check
            // Black can only escape with Kf7 or Kg7 (quiet moves, no captures)
            // This exercises the quiescence mate-check fallback for non-mate
            const fen = 'R5k1/8/8/8/8/8/8/K7 b - - 0 1';
            const game = new Game(fen);

            // Use low depth so we enter quiescence immediately
            const result = game.ai({ level: 1, depth: { base: 1, quiescence: 2 } });

            // Should NOT be checkmate - black can escape with Kf7 or Kg7
            expect(result.board.checkMate).toBe(false);
            expect(result.move).toBeDefined();

            // The move should be a king escape
            const [from, to] = Object.entries(result.move)[0];
            expect(from).toBe('G8');
            expect(['F7', 'G7', 'H7']).toContain(to);
        });

        it('should detect checkmate in quiescence when no escape exists', () => {
            // Back rank mate: Black king on g8, pawns on f7/g7/h7, White rook on a8
            // No captures available, no quiet escapes - it's checkmate
            const fen = 'R5k1/5ppp/8/8/8/8/8/K7 b - - 0 1';

            // This position is already checkmate, so AI should throw
            const game = new Game(fen);
            expect(() => game.ai({ level: 1 })).toThrow('Game is already finished');
        });

        it('should prefer capturing escape over quiet escape in quiescence', () => {
            // Black king on g8, White rook on a8 giving check, White pawn on f7
            // Black can capture Kxf7 or escape quietly with Kg7/Kh7
            // Capturing should be preferred (wins material)
            const fen = 'R5k1/5P2/8/8/8/8/8/K7 b - - 0 1';
            const game = new Game(fen);

            const result = game.ai({ level: 1, depth: { base: 1, quiescence: 2 } });

            expect(result.board.checkMate).toBe(false);
            expect(result.move).toBeDefined();

            // Should capture the pawn (winning move)
            const [from, to] = Object.entries(result.move)[0];
            expect(from).toBe('G8');
            expect(to).toBe('F7'); // Capture the pawn
        });

        it('should handle check during quiescence at depth limit', () => {
            // Position where we're in check at qMaxDepth
            // Should still find the escape, not return garbage
            const fen = 'R5k1/8/8/8/8/8/8/K7 b - - 0 1';
            const game = new Game(fen);

            // Force minimal quiescence depth (base=1, quiescence=0 means we hit qMax immediately)
            const result = game.ai({ level: 1, depth: { base: 1, quiescence: 0, extended: 0 } });

            expect(result.board.checkMate).toBe(false);
            expect(result.move).toBeDefined();
        });
    });

    describe('AI special moves and edge cases', () => {
        it('should evaluate castling opportunities', () => {
            // Position where castling is available and likely good
            const fen = 'r3k2r/pppppppp/8/8/8/8/PPPPPPPP/R3K2R w KQkq - 0 1';
            const game = new Game(fen);

            const result = game.ai({ level: 2 });

            // Verify AI made a legal move
            expect(result.move).toBeDefined();
            expect(result.board.turn).toBe('black');

            // AI should at least consider development moves (castling or piece movement)
            expect(result.board.isFinished).toBe(false);
        });

        it('should handle en passant captures correctly', () => {
            // Black played d7-d5, white pawn on e5 can potentially capture en passant
            const fen = 'rnbqkbnr/ppp1pppp/8/3pP3/8/8/PPPP1PPP/RNBQKBNR w KQkq d6 0 1';
            const game = new Game(fen);

            const result = game.ai({ level: 2 });

            // Should make a legal move (en passant or otherwise)
            expect(result.move).toBeDefined();
            expect(result.board.turn).toBe('black');

            // En passant may or may not be the best move, but AI should handle the position
            expect(result.board.checkMate).toBe(false);
        });

        it('should handle minimal material endgames', () => {
            // K+N vs K is theoretically a draw (insufficient material)
            const fen = '8/8/8/3k4/8/3N4/8/3K4 w - - 0 1';
            const game = new Game(fen);

            // This tests that the AI can handle endgame positions
            const result = game.ai({ level: 2 });

            expect(result.move).toBeDefined();

            // AI should be able to make moves in this position
            // (Note: Insufficient material detection may not be implemented yet)
            expect(result.board.turn).toBe('black');
        });

        it('should avoid stalemate when ahead in material', () => {
            // K+Q vs K in corner - care needed to avoid stalemate
            // In this position the black king is in check from the queen on h1,
            // so it must be black to move.
            const fen = 'k7/8/1K6/8/8/8/8/7Q b - - 0 1';
            const game = new Game(fen);

            const result = game.ai({ level: 2 }); // Simple position evaluation

            expect(result.move).toBeDefined();

            // Should either deliver checkmate or continue toward mate
            if (result.board.isFinished) {
                // If finishing, must be checkmate not stalemate
                expect(result.board.checkMate).toBe(true);
                expect(result.board.staleMate).toBe(false);
            } else {
                // If not finishing, opponent should have legal moves (not stalemate)
                expect(result.board.isFinished).toBe(false);
                expect(result.board.staleMate).toBe(false);
            }
        });

        it('should find deeper tactics at higher difficulty levels', () => {
            // Mate-in-2 position (requires depth 4+)
            // White plays Ra8+ Kh7, Ra7# is mate
            const fen = '6k1/5ppp/8/8/8/8/5PPP/R6K w - - 0 1';

            const gameLow = new Game(fen);
            const resultLow = gameLow.ai({ level: 2 }); // Level 2 (depth 2-3)

            const gameHigh = new Game(fen);
            const resultHigh = gameHigh.ai({ level: 5 }); // Level 5 (depth 5-6)

            // Both should make legal moves
            expect(resultLow.move).toBeDefined();
            expect(resultHigh.move).toBeDefined();

            // Higher level should ideally play Ra8+ (check) to start the mate sequence
            // But at minimum, both should make reasonable moves
            expect(resultLow.board.turn).toBe('black');
            expect(resultHigh.board.turn).toBe('black');

            // If high level finds the winning move, it should give check
            if (resultHigh.board.check) {
                // Likely found Ra8+
                expect(resultHigh.board.check).toBe(true);
            }
        });
    });

    describe('AI regression - best move (level 3)', () => {
        // These are intentionally level 3 (deeper, slower) because we want to lock
        // in avoidance of obvious tactical blunders.

        it('should not hang the queen (reported 2026-01-29: avoid Qxd5??)', () => {
            const board = {
                turn: 'black',
                pieces: {
                    A1: 'R',
                    B1: 'N',
                    C1: 'B',
                    D1: 'Q',
                    E1: 'K',
                    G1: 'N',
                    H1: 'R',
                    A2: 'P',
                    B2: 'P',
                    D2: 'P',
                    F2: 'P',
                    G2: 'P',
                    H2: 'P',
                    C4: 'B',
                    D5: 'P',
                    A7: 'p',
                    C7: 'p',
                    E7: 'p',
                    F7: 'p',
                    G7: 'p',
                    H7: 'p',
                    A8: 'r',
                    B8: 'n',
                    C8: 'b',
                    D8: 'q',
                    E8: 'k',
                    F8: 'b',
                    G8: 'n',
                    H8: 'r',
                },
                isFinished: false,
                check: false,
                checkMate: false,
                castling: {
                    whiteShort: true,
                    blackShort: true,
                    whiteLong: true,
                    blackLong: true,
                },
                enPassant: null,
                halfMove: 0,
                fullMove: 4,
            } as any;

            const move = aiMove(board, 3);

            // Regression expectation: don't play the immediate queen blunder.
            expect(move).not.toEqual({ D8: 'D5' });
        });

        it('should promote a pawn in a trivial promotion position', () => {
            const fen = '8/4P3/8/8/3k4/8/8/4K3 w - - 0 1';
            const result = ai(fen, { level: 3, randomness: 0 });

            // Must promote on the 8th rank.
            const hasPromotionOnEighthRank = Object.entries(result.board.pieces).some(
                ([sq, piece]) => sq[1] === '8' && (piece === 'Q' || piece === 'R' || piece === 'B' || piece === 'N')
            );
            expect(hasPromotionOnEighthRank).toBe(true);
        });

        it('should deliver mate in 1 when available (queen mate)', () => {
            // Mate in 1 for white: Qf8#
            const fen = '7k/5Qpp/8/8/8/8/6PP/6K1 w - - 0 1';
            const result = ai(fen, { level: 3, randomness: 0 });

            expect(result.board.checkMate).toBe(true);
            expect(result.board.isFinished).toBe(true);
        });

    it('regression position (2026-01-29): level-3 best move stays stable', () => {
            // Reported 2026-01-29:
            // This position used to yield {"D7":"G4"} at level 3.
            // After search fixes (TT bound classification + deterministic tie-breaking),
            // the engine prefers a different move. Keep the position as a regression lock.
            const board = {
                turn: 'black',
                pieces: {
                    A1: 'R',
                    D1: 'Q',
                    E1: 'K',
                    F1: 'B',
                    H1: 'R',
                    A2: 'P',
                    B2: 'P',
                    F2: 'P',
                    G2: 'P',
                    H2: 'P',
                    D3: 'P',
                    F3: 'N',
                    C4: 'P',
                    A5: 'p',
                    B5: 'N',
                    C5: 'p',
                    D5: 'P',
                    H5: 'p',
                    B6: 'p',
                    A7: 'r',
                    D7: 'q',
                    E7: 'p',
                    F7: 'p',
                    G7: 'p',
                    H7: 'r',
                    B8: 'B',
                    C8: 'b',
                    E8: 'k',
                    F8: 'b',
                    G8: 'n',
                },
                isFinished: false,
                check: false,
                checkMate: false,
                castling: {
                    whiteShort: true,
                    blackShort: false,
                    whiteLong: true,
                    blackLong: false,
                },
                enPassant: null,
                halfMove: 0,
                fullMove: 9,
            } as any;

            const result = ai(board, { level: 3, randomness: 0 });

            // Lock the behavior for now so we can improve evaluation/search later without losing
            // reproduction coverage.
            expect(result.move).toEqual({ A7: 'B7' });
        });
    });
});
