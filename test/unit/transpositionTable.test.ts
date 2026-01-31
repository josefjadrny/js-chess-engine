import { TranspositionTable, TTEntryType } from '../../src/ai/TranspositionTable';
import { SCORE_MIN, SCORE_MAX } from '../../src/ai/Evaluator';

// Minimal move shaped like InternalMove for TT storage.
// Best-move ordering is orthogonal to correctness of caching.
const dummyMove: any = { from: 0, to: 1, piece: 1, capturedPiece: 0, flags: 0 };

describe('TranspositionTable', () => {
    it('stores and probes EXACT entries when depth is sufficient', () => {
        const tt = new TranspositionTable(1);
        const h = 0x1234n;

        tt.store(h, 4, 42, TTEntryType.EXACT, dummyMove);

        const entry = tt.probe(h, 4, SCORE_MIN, SCORE_MAX);
        expect(entry).not.toBeNull();
        expect(entry!.zobristHash).toBe(h);
        expect(entry!.depth).toBe(4);
        expect(entry!.score).toBe(42);
        expect(entry!.type).toBe(TTEntryType.EXACT);
        expect(entry!.bestMove).toEqual(dummyMove);

        const stats = tt.getStats();
        expect(stats.hits).toBe(1);
        expect(stats.misses).toBe(0);
    });

    it('treats mismatched hash in same bucket as miss', () => {
        const tt = new TranspositionTable(1);
        const h1 = 0x1n;
        // Force same index by constructing h2 with same low bits.
        // We can't know table size here, so we just assert mismatch is a miss if it happens to collide.
        // To deterministically collide, we read size from stats.
        const size = tt.getStats().size;
        const h2 = h1 + BigInt(size);

        tt.store(h1, 3, 11, TTEntryType.EXACT, dummyMove);
        const entry = tt.probe(h2, 3, SCORE_MIN, SCORE_MAX);
        expect(entry).toBeNull();

        const stats = tt.getStats();
        expect(stats.hits).toBe(0);
        expect(stats.misses).toBe(1);
    });

    it('does not use entries stored at lower depth than requested', () => {
        const tt = new TranspositionTable(1);
        const h = 0xABCDn;

        tt.store(h, 2, 99, TTEntryType.EXACT, dummyMove);
        const entry = tt.probe(h, 3, SCORE_MIN, SCORE_MAX);
        expect(entry).toBeNull();

        const stats = tt.getStats();
        expect(stats.hits).toBe(0);
        expect(stats.misses).toBe(1);
    });

    it('respects LOWER_BOUND and UPPER_BOUND windows for cutoffs', () => {
        const tt = new TranspositionTable(1);
        const hLower = 0x10n;
        const hUpper = 0x20n;

        // LOWER_BOUND is usable for cutoff only if score >= beta
        tt.store(hLower, 5, 50, TTEntryType.LOWER_BOUND, dummyMove);
        expect(tt.probe(hLower, 5, 0, 100)!.type).toBe(TTEntryType.LOWER_BOUND); // not cutoff-usable, but entry returned
        const cutLower = tt.probe(hLower, 5, 0, 40);
        expect(cutLower).not.toBeNull();
        expect(cutLower!.score).toBe(50);

        // UPPER_BOUND is usable for cutoff only if score <= alpha
        tt.store(hUpper, 5, -20, TTEntryType.UPPER_BOUND, dummyMove);
        expect(tt.probe(hUpper, 5, -100, 100)!.type).toBe(TTEntryType.UPPER_BOUND);
        const cutUpper = tt.probe(hUpper, 5, -10, 100);
        expect(cutUpper).not.toBeNull();
        expect(cutUpper!.score).toBe(-20);
    });

    it('replaces entries when new depth is greater (same bucket)', () => {
        const tt = new TranspositionTable(1);
        const size = tt.getStats().size;
        const base = 0x55n;
        const h1 = base;
        const h2 = base + BigInt(size); // same index, different hash

        tt.store(h1, 2, 10, TTEntryType.EXACT, dummyMove);
        // Should replace because depth is greater, despite different hash & same bucket.
        tt.store(h2, 5, 99, TTEntryType.EXACT, dummyMove);

        expect(tt.probe(h1, 2, SCORE_MIN, SCORE_MAX)).toBeNull();
        const entry = tt.probe(h2, 5, SCORE_MIN, SCORE_MAX);
        expect(entry).not.toBeNull();
        expect(entry!.score).toBe(99);
    });

    it('ages entries: newSearch increments age and allows replacement of old entries', () => {
        const tt = new TranspositionTable(1);
        const size = tt.getStats().size;
        const base = 0x77n;
        const h1 = base;
        const h2 = base + BigInt(size);

        tt.store(h1, 5, 1, TTEntryType.EXACT, dummyMove);
        tt.newSearch();
        // With lower depth, it would normally not replace, but since age < currentAge it should.
        tt.store(h2, 1, 2, TTEntryType.EXACT, dummyMove);

        expect(tt.probe(h1, 5, SCORE_MIN, SCORE_MAX)).toBeNull();
        expect(tt.probe(h2, 1, SCORE_MIN, SCORE_MAX)).not.toBeNull();
    });
});
