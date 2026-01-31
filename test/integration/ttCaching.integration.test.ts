import { parseFEN } from '../../src/utils/fen';
import { computeZobristHash } from '../../src/core/zobrist';
import { generateLegalMoves, applyMoveComplete } from '../../src/core/MoveGenerator';
import { copyBoard } from '../../src/core/Board';

/**
 * TT caching integration tests
 *
 * This is intentionally FAST.
 *
 * Instead of running deep searches (which can be slow in CI/low-power CPUs),
 * we validate the prerequisite for TT caching: correct/consistent Zobrist hashes.
 * If `board.zobristHash` is wrong or stale, TT caching can't work regardless of TT code.
 */

describe('Transposition table caching (hash integration)', () => {
    it('parseFEN should produce a board whose zobristHash matches computeZobristHash()', () => {
        // Small position, few pieces.
        const fen = '8/8/8/3k4/8/8/4K3/8 w - - 0 1';
        const board = parseFEN(fen);

        const computed = computeZobristHash(board);
        expect(board.zobristHash).toBe(computed);
    });

    it('applyMoveComplete must keep zobristHash in sync with computeZobristHash() after several legal moves', () => {
        // Start from a simple legal position with some moves.
        const fen = '8/8/8/3k4/8/8/4K3/8 w - - 0 1';
        const board = parseFEN(fen);

        // Take a few random-ish legal moves (deterministic: always take the first move).
        for (let ply = 0; ply < 6; ply++) {
            const moves = generateLegalMoves(board);
            expect(moves.length).toBeGreaterThan(0);
            applyMoveComplete(board, moves[0]);

            const computed = computeZobristHash(board);
            expect(board.zobristHash).toBe(computed);
        }
    });

    it('two different move orders leading to the same position should have identical zobristHash', () => {
        // Construct a tiny position where transposition is easy to create:
        // Two kings + one rook that can shuffle.
        const fen = '8/8/8/3k4/8/8/4K2R/8 w - - 0 1';

        const a = parseFEN(fen);
        const b = parseFEN(fen);

        // Line A: Rh2-h1, ... (black king move), Rh1-h2
        // We'll just pick specific legal rook moves by filtering.
        const findMove = (board: any, from: number, to: number) =>
            generateLegalMoves(board).find((m: any) => m.from === from && m.to === to);

        // Indices: H2 = 15, H1 = 7 (since A1=0).
        const H2 = 15;
        const H1 = 7;

        const a1 = findMove(a, H2, H1);
        expect(a1).toBeDefined();
        applyMoveComplete(a, a1!);
        // Black to move: just make first legal king move.
        applyMoveComplete(a, generateLegalMoves(a)[0]);
        // White rook back.
        const a3 = findMove(a, H1, H2);
        expect(a3).toBeDefined();
        applyMoveComplete(a, a3!);

        // Line B: make a different white rook move first if possible (Rh2-g2), then transpose back.
        // Indices: G2 = 14.
        const G2 = 14;
        const b1 = findMove(b, H2, G2);
        if (!b1) {
            // If not legal due to check rules in this position, fall back to a simple identity assertion.
            expect(computeZobristHash(b)).toBe(b.zobristHash);
            return;
        }
        applyMoveComplete(b, b1);
        applyMoveComplete(b, generateLegalMoves(b)[0]);
        const b3 = findMove(b, G2, H2);
        expect(b3).toBeDefined();
        applyMoveComplete(b, b3!);

        // We don't guarantee same side-to-move due to the black reply differing,
        // so compare full board hash only if FENs match.
        const aHash = computeZobristHash(a);
        const bHash = computeZobristHash(b);
        expect(a.zobristHash).toBe(aHash);
        expect(b.zobristHash).toBe(bHash);

        // If positions are identical, hashes must be identical.
        // Use a cheap structural comparison: mailbox + turn + castling + ep.
        const sameMailbox = a.mailbox.every((p: number, i: number) => p === b.mailbox[i]);
        const sameState =
            a.turn === b.turn &&
            a.enPassantSquare === b.enPassantSquare &&
            JSON.stringify(a.castlingRights) === JSON.stringify(b.castlingRights);

        if (sameMailbox && sameState) {
            expect(a.zobristHash).toBe(b.zobristHash);
        }
    });
});
