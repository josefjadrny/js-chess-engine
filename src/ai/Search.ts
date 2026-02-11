/**
 * Minimal, fast negamax alpha-beta search.
 *
 * Goals:
 * - Browser-friendly: bounded work, no expensive root guardrails.
 * - Deterministic.
 * - Uses TT + basic move ordering for practical strength.
 */

import { InternalBoard, InternalMove, InternalColor, MoveFlag, Piece } from '../types';
import { generateLegalMoves, generatePseudoLegalMoves, applyMoveComplete } from '../core/MoveGenerator';
import { copyBoard } from '../core/Board';
import { isKingInCheck, isSquareAttacked } from '../core/AttackDetector';
import { getLowestSetBit } from '../utils/conversion';
import { Evaluator, SCORE_MAX, SCORE_MIN } from './Evaluator';
import { Score, SearchResult } from '../types/ai.types';
import { TranspositionTable, TTEntryType } from './TranspositionTable';
import { KillerMoves, MoveSelector } from './MoveOrdering';

// Keep within evaluator bounds.
const INF: Score = SCORE_MAX;

export class Search {
    private nodesSearched = 0;

    private qMaxDepth = 4;
    private checkExtension = true;

    private transpositionTable: TranspositionTable | null;
    private killerMoves: KillerMoves;

    constructor(ttSizeMB: number = 16) {
        this.transpositionTable = ttSizeMB > 0 ? new TranspositionTable(ttSizeMB) : null;
        this.killerMoves = new KillerMoves();
    }

    clear(): void {
        this.transpositionTable?.clear();
        this.killerMoves.clear();
    }

    findBestMove(
        board: InternalBoard,
        baseDepth: number,
        qMaxDepth: number = 4,
        checkExtension: boolean = true,
        options: { analysis?: boolean } = {}
    ): SearchResult | null {
        this.qMaxDepth = qMaxDepth;
        this.checkExtension = checkExtension;
        this.nodesSearched = 0;
        this.transpositionTable?.newSearch();
        this.killerMoves.clear();

        const analysis = options.analysis ?? false;

        const moves = generateLegalMoves(board);
        if (moves.length === 0) {
            const inCheck = isKingInCheck(board);
            const score = inCheck ? (SCORE_MIN + 0) : 0;
            return { move: null as any, score, depth: 0, nodesSearched: this.nodesSearched };
        }

        let bestMove: InternalMove | null = null;
        let bestScore: Score = SCORE_MIN;
        let scoredMoves: Array<{ move: InternalMove; score: Score }> | undefined;

        // Iterative deepening: search depth 1..baseDepth.
        // Populates TT progressively for better move ordering at deeper levels.
        const ASPIRATION_DELTA = 25;

        for (let d = 1; d <= baseDepth; d++) {
            const collectScores = analysis && d === baseDepth;

            // Aspiration window: use previous iteration's score for d >= 4
            let alpha: Score = SCORE_MIN;
            let beta: Score = SCORE_MAX;
            let delta = ASPIRATION_DELTA;
            if (d >= 4 && bestScore > SCORE_MIN && bestScore < SCORE_MAX) {
                alpha = (bestScore - delta) as Score;
                beta = (bestScore + delta) as Score;
            }

            // Aspiration retry loop
            let iterBestMove: InternalMove | null = null;
            let iterBestScore: Score = SCORE_MIN;
            let iterScoredMoves: Array<{ move: InternalMove; score: Score }> | null = null;

            while (true) {
                const pvMove = this.transpositionTable?.getBestMove(board.zobristHash) ?? null;
                const selector = new MoveSelector(moves, pvMove, this.killerMoves, 0);

                iterScoredMoves = collectScores ? [] : null;
                iterBestMove = null;
                iterBestScore = SCORE_MIN;
                let iterAlpha = alpha;

                let move: InternalMove | null;
                let moveIndex = 0;
                while ((move = selector.pickNext()) !== null) {
                    if ((move.flags & MoveFlag.PROMOTION) && move.promotionPiece) {
                        const isQueenPromotion =
                            move.promotionPiece === Piece.WHITE_QUEEN ||
                            move.promotionPiece === Piece.BLACK_QUEEN;
                        if (!isQueenPromotion) continue;
                    }

                    const child = copyBoard(board);
                    applyMoveComplete(child, move);

                    const extension = (this.checkExtension && child.isCheck) ? 1 : 0;

                    let score: Score;
                    // Use PVS at root (but not when collecting analysis scores - need accurate values)
                    if (moveIndex === 0 || collectScores) {
                        score = -this.negamax(child, d - 1 + extension, -beta, -iterAlpha, 1);
                    } else {
                        // PVS: zero window search first
                        score = -this.negamax(child, d - 1 + extension, -iterAlpha - 1, -iterAlpha, 1);
                        // Re-search with full window if it beats alpha
                        if (score > iterAlpha && score < beta) {
                            score = -this.negamax(child, d - 1 + extension, -beta, -iterAlpha, 1);
                        }
                    }
                    moveIndex++;

                    if (iterScoredMoves) {
                        iterScoredMoves.push({ move, score });
                    }

                    if (score > iterBestScore || iterBestMove === null) {
                        iterBestScore = score;
                        iterBestMove = move;
                    }

                    if (score > iterAlpha) iterAlpha = score;
                    if (iterAlpha >= beta) break;
                }

                // Check aspiration window result
                if (d >= 4 && (alpha > SCORE_MIN || beta < SCORE_MAX)) {
                    if (iterBestScore <= alpha) {
                        // Fail low - widen alpha
                        delta *= 2;
                        alpha = (delta > 400) ? SCORE_MIN : Math.max(SCORE_MIN, alpha - delta) as Score;
                        continue;
                    }
                    if (iterBestScore >= beta) {
                        // Fail high - widen beta
                        delta *= 2;
                        beta = (delta > 400) ? SCORE_MAX : Math.min(SCORE_MAX, beta + delta) as Score;
                        continue;
                    }
                }
                break;
            }

            if (iterBestMove) {
                bestMove = iterBestMove;
                bestScore = iterBestScore;
            }

            if (iterScoredMoves) {
                iterScoredMoves.sort((a, b) => b.score - a.score);
                scoredMoves = iterScoredMoves;
            }
        }

        return bestMove
            ? { move: bestMove, score: bestScore, depth: baseDepth, nodesSearched: this.nodesSearched, scoredMoves }
            : null;
    }

    private negamax(
        board: InternalBoard,
        depth: number,
        alpha: Score,
        beta: Score,
        ply: number
    ): Score {
        this.nodesSearched++;

            if (depth <= 0) {
                return this.quiescence(board, alpha, beta, ply, 0);
            }

            // TT probe
            const tt = this.transpositionTable;
            const hash = board.zobristHash;
            let ttMove: InternalMove | null = null;

            if (tt) {
                const entry = tt.probe(hash, depth, alpha, beta, ply);
                if (entry) {
                    ttMove = entry.bestMove;
                    if (entry.type === TTEntryType.EXACT) return entry.score;
                    if (entry.type === TTEntryType.LOWER_BOUND && entry.score >= beta) return entry.score;
                    if (entry.type === TTEntryType.UPPER_BOUND && entry.score <= alpha) return entry.score;
                }
            }

            const moves = generatePseudoLegalMoves(board);
            const selector = new MoveSelector(moves, ttMove, this.killerMoves, ply);

            const startAlpha = alpha;
            let bestScore: Score = -INF;
            let bestMove: InternalMove | null = null;
            let legalMoveCount = 0;
            let move: InternalMove | null;

            while ((move = selector.pickNext()) !== null) {
                if ((move.flags & MoveFlag.PROMOTION) && move.promotionPiece) {
                    const isQueenPromotion =
                        move.promotionPiece === Piece.WHITE_QUEEN ||
                        move.promotionPiece === Piece.BLACK_QUEEN;
                    if (!isQueenPromotion) continue;
                }

                const child = copyBoard(board);
                applyMoveComplete(child, move);

                // Skip illegal moves (own king left in check)
                if (this.isIllegalMove(child)) continue;

                legalMoveCount++;
                const extension = (this.checkExtension && child.isCheck) ? 1 : 0;

                let score: Score;
                if (legalMoveCount === 1) {
                    // First move (PV move): search with full window
                    score = -this.negamax(child, depth - 1 + extension, -beta, -alpha, ply + 1);
                } else {
                    // PVS: search with zero window first
                    score = -this.negamax(child, depth - 1 + extension, -alpha - 1, -alpha, ply + 1);
                    // Re-search with full window if it beats alpha
                    if (score > alpha && score < beta) {
                        score = -this.negamax(child, depth - 1 + extension, -beta, -alpha, ply + 1);
                    }
                }

                if (score > bestScore || bestMove === null) {
                    bestScore = score;
                    bestMove = move;
                }

                if (score > alpha) alpha = score;
                if (alpha >= beta) {
                    this.killerMoves.store(move, ply);
                    break;
                }
            }

            // No legal moves: checkmate or stalemate
            if (legalMoveCount === 0) {
                if (isKingInCheck(board)) return SCORE_MIN + ply;
                return 0;
            }

            // TT store
            if (tt && bestMove) {
                let type = TTEntryType.EXACT;
                if (bestScore <= startAlpha) type = TTEntryType.UPPER_BOUND;
                else if (bestScore >= beta) type = TTEntryType.LOWER_BOUND;

                tt.store(hash, depth, bestScore, type, bestMove, ply);
            }

            return bestScore;
        }

    private quiescence(
        board: InternalBoard,
        alpha: Score,
        beta: Score,
        ply: number,
        qDepth: number
    ): Score {
        this.nodesSearched++;

        // Stand-pat: evaluate before move generation
        const standPat = Evaluator.evaluate(board, board.turn, ply);
        if (standPat >= beta) return standPat;
        if (standPat > alpha) alpha = standPat;
        if (qDepth >= this.qMaxDepth) return standPat;

        // Generate pseudo-legal moves, filter to forcing (captures + promotions)
        const allMoves = generatePseudoLegalMoves(board);
        const forcing = allMoves.filter(m => (m.flags & MoveFlag.CAPTURE) || (m.flags & MoveFlag.PROMOTION));

        const tt = this.transpositionTable;
        const ttMove = tt ? tt.getBestMove(board.zobristHash) : null;
        const selector = new MoveSelector(forcing, ttMove, this.killerMoves, ply);

        let bestScore = standPat;
        let legalForcingFound = false;
        let move: InternalMove | null;

        while ((move = selector.pickNext()) !== null) {
            if ((move.flags & MoveFlag.PROMOTION) && move.promotionPiece) {
                const isQueenPromotion =
                    move.promotionPiece === Piece.WHITE_QUEEN ||
                    move.promotionPiece === Piece.BLACK_QUEEN;
                if (!isQueenPromotion) continue;
            }

            const child = copyBoard(board);
            applyMoveComplete(child, move);

            // Skip illegal moves
            if (this.isIllegalMove(child)) continue;

            legalForcingFound = true;
            const score = -this.quiescence(child, -beta, -alpha, ply + 1, qDepth + 1);

            if (score > bestScore) bestScore = score;
            if (score >= beta) return score;
            if (score > alpha) alpha = score;
        }

        // Mate detection: if in check and no legal forcing move, check for any legal escape
        if (!legalForcingFound && isKingInCheck(board)) {
            for (const m of allMoves) {
                // Skip forcing moves (already checked above)
                if ((m.flags & MoveFlag.CAPTURE) || (m.flags & MoveFlag.PROMOTION)) continue;
                const child = copyBoard(board);
                applyMoveComplete(child, m);
                if (!this.isIllegalMove(child)) return standPat; // Has legal quiet escape
            }
            return SCORE_MIN + ply; // Checkmate
        }

        return bestScore;
    }

    /**
     * Check if a move was illegal (left own king in check) after applyMoveComplete.
     * After applyMoveComplete, board.turn has switched, so the "previous" side
     * is the opponent of board.turn.
     */
    private isIllegalMove(child: InternalBoard): boolean {
        const prevColor = child.turn === InternalColor.WHITE ? InternalColor.BLACK : InternalColor.WHITE;
        const prevKingBB = prevColor === InternalColor.WHITE ? child.whiteKing : child.blackKing;
        if (prevKingBB === 0n) return false;
        const prevKingSq = getLowestSetBit(prevKingBB);
        return isSquareAttacked(child, prevKingSq, child.turn);
    }

    // NOTE: Board cloning must preserve bitboards/mailbox/game flags.
    // Use the engine's canonical copier to avoid subtle corruption.
}
