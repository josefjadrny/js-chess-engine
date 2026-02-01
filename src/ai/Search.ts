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

    // Quiescence is extremely important for tactical stability, but must stay cheap.
    // Small depth is enough to prevent the worst horizon blunders.
    private readonly qMaxDepth = 4;

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

        findBestMove(board: InternalBoard, baseDepth: number): SearchResult | null {
            this.nodesSearched = 0;
            this.transpositionTable?.newSearch();
            this.killerMoves.clear();

            const moves = generateLegalMoves(board);
            if (moves.length === 0) {
                const inCheck = isKingInCheck(board);
                const score = inCheck ? (SCORE_MIN + 0) : 0;
                return { move: null as any, score, depth: 0, nodesSearched: this.nodesSearched };
            }

            let bestMove: InternalMove | null = null;
            let bestScore: Score = SCORE_MIN;

            // Iterative deepening: search depth 1..baseDepth.
            // Populates TT progressively for better move ordering at deeper levels.
            for (let d = 1; d <= baseDepth; d++) {
                const pvMove = this.transpositionTable?.getBestMove(board.zobristHash) ?? null;
                const selector = new MoveSelector(moves, pvMove, this.killerMoves, 0);

                let iterBestMove: InternalMove | null = null;
                let iterBestScore: Score = SCORE_MIN;
                let alpha: Score = SCORE_MIN;
                const beta: Score = SCORE_MAX;
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

                    const extension = child.isCheck ? 1 : 0;
                    const score = -this.negamax(child, d - 1 + extension, -beta, -alpha, 1);

                    if (score > iterBestScore || iterBestMove === null) {
                        iterBestScore = score;
                        iterBestMove = move;
                    }

                    if (score > alpha) alpha = score;
                    if (alpha >= beta) break;
                }

                if (iterBestMove) {
                    bestMove = iterBestMove;
                    bestScore = iterBestScore;
                }
            }

            return bestMove
                ? { move: bestMove, score: bestScore, depth: baseDepth, nodesSearched: this.nodesSearched }
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
                const extension = child.isCheck ? 1 : 0;
                const score = -this.negamax(child, depth - 1 + extension, -beta, -alpha, ply + 1);

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

            // Stand-pat: evaluate before expensive move generation.
            const standPat = Evaluator.evaluate(board, board.turn, ply);
            if (standPat >= beta) return standPat;
            if (standPat > alpha) alpha = standPat;

            if (qDepth >= this.qMaxDepth) return standPat;

            // Generate pseudo-legal moves, filter to forcing (captures + promotions).
            const allMoves = generatePseudoLegalMoves(board);
            const forcing = allMoves.filter(m => (m.flags & MoveFlag.CAPTURE) || (m.flags & MoveFlag.PROMOTION));

            if (forcing.length === 0) {
                // No forcing moves. Check if there are ANY legal moves (for mate/stalemate).
                // We can cheaply check: if in check and no forcing moves, we need to check
                // if any quiet move is legal. But that's expensive. Instead, if in check,
                // generate all moves and check legality.
                if (isKingInCheck(board)) {
                    // Must check if any move is legal (could be checkmate)
                    let hasLegal = false;
                    for (const move of allMoves) {
                        const child = copyBoard(board);
                        applyMoveComplete(child, move);
                        if (!this.isIllegalMove(child)) { hasLegal = true; break; }
                    }
                    if (!hasLegal) return SCORE_MIN + ply;
                }
                return standPat;
            }

            const tt = this.transpositionTable;
            const ttMove = tt ? tt.getBestMove(board.zobristHash) : null;
            const selector = new MoveSelector(forcing, ttMove, this.killerMoves, ply);

            let bestScore = standPat;
            let anyLegalForcing = false;
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

                anyLegalForcing = true;
                const score = -this.quiescence(child, -beta, -alpha, ply + 1, qDepth + 1);
                if (score > bestScore) {
                    bestScore = score;
                }
                if (score >= beta) {
                    return bestScore;
                }
                if (score > alpha) alpha = score;
            }

            // If in check and no legal forcing move was found, check for mate
            if (!anyLegalForcing && isKingInCheck(board)) {
                // Check if any non-forcing move is legal
                const quiet = allMoves.filter(m => !((m.flags & MoveFlag.CAPTURE) || (m.flags & MoveFlag.PROMOTION)));
                let hasLegal = false;
                for (const move of quiet) {
                    const child = copyBoard(board);
                    applyMoveComplete(child, move);
                    if (!this.isIllegalMove(child)) { hasLegal = true; break; }
                }
                if (!hasLegal) return SCORE_MIN + ply;
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
