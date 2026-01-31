/**
 * Extremely small move ordering module.
 *
 * Goals:
 * - Be deterministic and fast.
 * - Provide “good enough” ordering for alpha-beta.
 * - Avoid expensive heuristics (SEE / legal-move regeneration / etc.).
 */

import { InternalMove, MoveFlag, Piece } from '../types';

const PIECE_VALUE: Record<number, number> = {
    [Piece.EMPTY]: 0,
    [Piece.WHITE_PAWN]: 100,
    [Piece.BLACK_PAWN]: 100,
    [Piece.WHITE_KNIGHT]: 320,
    [Piece.BLACK_KNIGHT]: 320,
    [Piece.WHITE_BISHOP]: 330,
    [Piece.BLACK_BISHOP]: 330,
    [Piece.WHITE_ROOK]: 500,
    [Piece.BLACK_ROOK]: 500,
    [Piece.WHITE_QUEEN]: 900,
    [Piece.BLACK_QUEEN]: 900,
    [Piece.WHITE_KING]: 20000,
    [Piece.BLACK_KING]: 20000,
};

export class KillerMoves {
    private killers: Array<[InternalMove | null, InternalMove | null]>;
    private readonly maxPly: number;

    constructor(maxPly: number = 64) {
        this.maxPly = maxPly;
        this.killers = Array.from({ length: maxPly }, () => [null, null]);
    }

    clear(): void {
        this.killers = Array.from({ length: this.maxPly }, () => [null, null]);
    }

    store(move: InternalMove, ply: number): void {
        if (ply < 0 || ply >= this.maxPly) return;
        if (move.flags & MoveFlag.CAPTURE) return; // captures are ordered separately

        const [k1, k2] = this.killers[ply];
        if (k1 && k1.from === move.from && k1.to === move.to) return;

        this.killers[ply][1] = k1;
        this.killers[ply][0] = move;
    }

    isKiller(move: InternalMove, ply: number): boolean {
        if (ply < 0 || ply >= this.maxPly) return false;
        const [k1, k2] = this.killers[ply];
        return !!(
            (k1 && k1.from === move.from && k1.to === move.to) ||
            (k2 && k2.from === move.from && k2.to === move.to)
        );
    }
}

function mvvLvaScore(move: InternalMove): number {
    // MVV-LVA: prioritize winning captures.
    const victim = PIECE_VALUE[move.capturedPiece] ?? 0;
    const attacker = PIECE_VALUE[move.piece] ?? 0;
    return victim * 16 - attacker;
}

export function orderMoves(
    moves: InternalMove[],
    ttMove: InternalMove | null,
    killers: KillerMoves | null,
    ply: number
): InternalMove[] {
    if (moves.length <= 1) return moves;

    const scored = moves.map(m => {
        let score = 0;

        if (ttMove && m.from === ttMove.from && m.to === ttMove.to) {
            score += 10_000_000;
        }

        if ((m.flags & MoveFlag.PROMOTION) && (m.promotionPiece === Piece.WHITE_QUEEN || m.promotionPiece === Piece.BLACK_QUEEN)) {
            score += 9_000_000;
        }

        if (m.flags & MoveFlag.CAPTURE) {
            score += 5_000_000 + mvvLvaScore(m);
        }

        if (killers && killers.isKiller(m, ply)) {
            score += 3_000_000;
        }

        return { m, score };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored.map(s => s.m);
}
