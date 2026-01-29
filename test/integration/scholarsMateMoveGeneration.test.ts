/**
 * Regression test: move generation across a historic game.
 *
 * Game: Scholar's Mate (a famous miniature)
 * Line: 1.e4 e5 2.Qh5 Nc6 3.Bc4 Nf6 4.Qxf7#
 *
 * After each ply we verify:
 * - the full set of legal moves (from-square -> to-squares)
 * - the exact board state via FEN
 */

import { createStartingBoard, copyBoard } from '../../src/core/Board';
import { applyMoveComplete, generateLegalMoves } from '../../src/core/MoveGenerator';
import { movesToMap } from '../../src/adapters/APIAdapter';
import { squareToIndex } from '../../src/utils/conversion';
import { toFEN } from '../../src/utils/fen';
import type { MovesMap, Square } from '../../src/types';

/** Convert the engine's legal moves to a stable, comparable MovesMap. */
function toStableMovesMap(moves: ReturnType<typeof generateLegalMoves>): MovesMap {
    const map = movesToMap(moves);

    // Ensure stable ordering so snapshot comparisons are deterministic.
    const stable: MovesMap = {};
    const fromSquares = Object.keys(map).sort() as Square[];

    for (const from of fromSquares) {
        const tos = [...map[from]].sort() as Square[];
        stable[from] = tos;
    }

    return stable;
}

/** Apply a move expressed as { from: 'E2', to: 'E4' } to an InternalBoard. */
function play(board: ReturnType<typeof createStartingBoard>, from: Square, to: Square) {
    const fromIdx = squareToIndex(from);
    const toIdx = squareToIndex(to);

    const legalMoves = generateLegalMoves(board);
    const move = legalMoves.find(m => m.from === fromIdx && m.to === toIdx);

    if (!move) {
        const map = toStableMovesMap(legalMoves);
        throw new Error(
            `Test setup invalid: move ${from}-${to} not legal. Legal moves from ${from}: ` +
            `${JSON.stringify(map[from] ?? [])}`
        );
    }

    applyMoveComplete(board, move);
}

describe("Move generation regression - Scholar's Mate", () => {
    it("should match expected legal move sets and board states during 1.e4 e5 2.Qh5 Nc6 3.Bc4 Nf6 4.Qxf7#", () => {
        const board = copyBoard(createStartingBoard());

        // Also assert the full board state after each ply using FEN.
        // This verifies:
        // - piece placement
        // - side to move
        // - castling rights
        // - en passant square
        // - move clocks
        const expectedFENByPly: string[] = [
            // ply 0 (start)
            'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
            // ply 1 (after 1.e4)
            'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1',
            // ply 2 (after 1...e5)
            'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2',
            // ply 3 (after 2.Qh5)
            'rnbqkbnr/pppp1ppp/8/4p2Q/4P3/8/PPPP1PPP/RNB1KBNR b KQkq - 1 2',
            // ply 4 (after 2...Nc6)
            'r1bqkbnr/pppp1ppp/2n5/4p2Q/4P3/8/PPPP1PPP/RNB1KBNR w KQkq - 2 3',
            // ply 5 (after 3.Bc4)
            'r1bqkbnr/pppp1ppp/2n5/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR b KQkq - 3 3',
            // ply 6 (after 3...Nf6)
            'r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4',
            // ply 7 (after 4.Qxf7#)
            'r1bqkb1r/pppp1Qpp/2n2n2/4p3/2B1P3/8/PPPP1PPP/RNB1K1NR b KQkq - 0 4',
        ];

        expect(toFEN(board)).toBe(expectedFENByPly[0]);

        // We'll validate the legal-move *set* after each ply.
        // If you intentionally change move generation rules, update these snapshots.

        const expectedAfterPly: Array<{ ply: string; expected: MovesMap; apply?: { from: Square; to: Square } }> = [
            {
                ply: 'start (white to move)',
                expected: {
                    A2: ['A3', 'A4'],
                    B1: ['A3', 'C3'],
                    B2: ['B3', 'B4'],
                    C2: ['C3', 'C4'],
                    D2: ['D3', 'D4'],
                    E2: ['E3', 'E4'],
                    F2: ['F3', 'F4'],
                    G1: ['F3', 'H3'],
                    G2: ['G3', 'G4'],
                    H2: ['H3', 'H4'],
                },
                apply: { from: 'E2', to: 'E4' },
            },
            {
                ply: 'after 1.e4 (black to move)',
                expected: {
                    A7: ['A5', 'A6'],
                    B7: ['B5', 'B6'],
                    B8: ['A6', 'C6'],
                    C7: ['C5', 'C6'],
                    D7: ['D5', 'D6'],
                    E7: ['E5', 'E6'],
                    F7: ['F5', 'F6'],
                    G7: ['G5', 'G6'],
                    G8: ['F6', 'H6'],
                    H7: ['H5', 'H6'],
                },
                apply: { from: 'E7', to: 'E5' },
            },
        ];

        // Assert + play first two plies (compact, human-auditable snapshots)
        for (let i = 0; i < 2; i++) {
            const legalMoves = generateLegalMoves(board);
            const actual = toStableMovesMap(legalMoves);
            expect(actual).toEqual(expectedAfterPly[i].expected);

            const next = expectedAfterPly[i].apply;
            if (next) {
                play(board, next.from, next.to);
                expect(toFEN(board)).toBe(expectedFENByPly[i + 1]);
            }
        }

        // From here on, snapshot full move maps.
        // Ply 3: after 1...e5 (white)
        expect(toStableMovesMap(generateLegalMoves(board))).toMatchInlineSnapshot(`
{
  "A2": [
    "A3",
    "A4",
  ],
  "B1": [
    "A3",
    "C3",
  ],
  "B2": [
    "B3",
    "B4",
  ],
  "C2": [
    "C3",
    "C4",
  ],
  "D1": [
    "E2",
    "F3",
    "G4",
    "H5",
  ],
  "D2": [
    "D3",
    "D4",
  ],
  "E1": [
    "E2",
  ],
  "F1": [
    "A6",
    "B5",
    "C4",
    "D3",
    "E2",
  ],
  "F2": [
    "F3",
    "F4",
  ],
  "G1": [
    "E2",
    "F3",
    "H3",
  ],
  "G2": [
    "G3",
    "G4",
  ],
  "H2": [
    "H3",
    "H4",
  ],
}
`);
        play(board, 'D1', 'H5');
        expect(toFEN(board)).toBe(expectedFENByPly[3]);

        // Ply 4: after 2.Qh5 (black)
        expect(toStableMovesMap(generateLegalMoves(board))).toMatchInlineSnapshot(`
{
  "A7": [
    "A5",
    "A6",
  ],
  "B7": [
    "B5",
    "B6",
  ],
  "B8": [
    "A6",
    "C6",
  ],
  "C7": [
    "C5",
    "C6",
  ],
  "D7": [
    "D5",
    "D6",
  ],
  "D8": [
    "E7",
    "F6",
    "G5",
    "H4",
  ],
  "E8": [
    "E7",
  ],
  "F8": [
    "A3",
    "B4",
    "C5",
    "D6",
    "E7",
  ],
  "G7": [
    "G5",
    "G6",
  ],
  "G8": [
    "E7",
    "F6",
    "H6",
  ],
  "H7": [
    "H6",
  ],
}
`);
        play(board, 'B8', 'C6');
        expect(toFEN(board)).toBe(expectedFENByPly[4]);

        // Ply 5: after 2...Nc6 (white)
        expect(toStableMovesMap(generateLegalMoves(board))).toMatchInlineSnapshot(`
{
  "A2": [
    "A3",
    "A4",
  ],
  "B1": [
    "A3",
    "C3",
  ],
  "B2": [
    "B3",
    "B4",
  ],
  "C2": [
    "C3",
    "C4",
  ],
  "D2": [
    "D3",
    "D4",
  ],
  "E1": [
    "D1",
    "E2",
  ],
  "F1": [
    "A6",
    "B5",
    "C4",
    "D3",
    "E2",
  ],
  "F2": [
    "F3",
    "F4",
  ],
  "G1": [
    "E2",
    "F3",
    "H3",
  ],
  "G2": [
    "G3",
    "G4",
  ],
  "H2": [
    "H3",
    "H4",
  ],
  "H5": [
    "D1",
    "E2",
    "E5",
    "F3",
    "F5",
    "F7",
    "G4",
    "G5",
    "G6",
    "H3",
    "H4",
    "H6",
    "H7",
  ],
}
`);
        play(board, 'F1', 'C4');
        expect(toFEN(board)).toBe(expectedFENByPly[5]);

        // Ply 6: after 3.Bc4 (black)
        expect(toStableMovesMap(generateLegalMoves(board))).toMatchInlineSnapshot(`
{
  "A7": [
    "A5",
    "A6",
  ],
  "A8": [
    "B8",
  ],
  "B7": [
    "B5",
    "B6",
  ],
  "C6": [
    "A5",
    "B4",
    "B8",
    "D4",
    "E7",
  ],
  "D7": [
    "D5",
    "D6",
  ],
  "D8": [
    "E7",
    "F6",
    "G5",
    "H4",
  ],
  "E8": [
    "E7",
  ],
  "F8": [
    "A3",
    "B4",
    "C5",
    "D6",
    "E7",
  ],
  "G7": [
    "G5",
    "G6",
  ],
  "G8": [
    "E7",
    "F6",
    "H6",
  ],
  "H7": [
    "H6",
  ],
}
`);
        play(board, 'G8', 'F6');
        expect(toFEN(board)).toBe(expectedFENByPly[6]);

        // Ply 7: after 3...Nf6 (white)
        expect(toStableMovesMap(generateLegalMoves(board))).toMatchInlineSnapshot(`
{
  "A2": [
    "A3",
    "A4",
  ],
  "B1": [
    "A3",
    "C3",
  ],
  "B2": [
    "B3",
    "B4",
  ],
  "C2": [
    "C3",
  ],
  "C4": [
    "A6",
    "B3",
    "B5",
    "D3",
    "D5",
    "E2",
    "E6",
    "F1",
    "F7",
  ],
  "D2": [
    "D3",
    "D4",
  ],
  "E1": [
    "D1",
    "E2",
    "F1",
  ],
  "F2": [
    "F3",
    "F4",
  ],
  "G1": [
    "E2",
    "F3",
    "H3",
  ],
  "G2": [
    "G3",
    "G4",
  ],
  "H2": [
    "H3",
    "H4",
  ],
  "H5": [
    "D1",
    "E2",
    "E5",
    "F3",
    "F5",
    "F7",
    "G4",
    "G5",
    "G6",
    "H3",
    "H4",
    "H6",
    "H7",
  ],
}
`);
        play(board, 'H5', 'F7');
        expect(toFEN(board)).toBe(expectedFENByPly[7]);

        // Ply 8: after 4.Qxf7# (black) - checkmate, should have zero legal moves
        const finalMoves = generateLegalMoves(board);
        expect(finalMoves.length).toBe(0);
    });
});
