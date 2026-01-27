/**
 * Alpha-beta search implementation for js-chess-engine v2
 *
 * Implements minimax with alpha-beta pruning and extensions for checks and captures.
 * Based on v1's testMoveScores implementation.
 */

import { InternalBoard, InternalColor, InternalMove, MoveFlag, Piece } from '../types';
import { generateLegalMoves, applyMoveComplete } from '../core/MoveGenerator';
import { isKingInCheck } from '../core/AttackDetector';
import { Evaluator, SCORE_MIN, SCORE_MAX } from './Evaluator';
import { Score, SearchResult } from '../types/ai.types';

/**
 * Search engine with alpha-beta pruning
 */
export class Search {
    private nodesSearched: number = 0;

    /**
     * Find the best move using alpha-beta search
     *
     * @param board - Current board position
     * @param baseDepth - Base search depth
     * @param extendedDepth - Extended search depth (for checks and captures)
     * @returns Best move with score
     */
    findBestMove(
        board: InternalBoard,
        baseDepth: number,
        extendedDepth: number
    ): SearchResult | null {
        this.nodesSearched = 0;
        const playerColor = board.turn;

        // Generate all legal moves
        const moves = generateLegalMoves(board);
        if (moves.length === 0) {
            return null; // No legal moves
        }

        // Add small random factor to avoid repeating same moves
        // Based on halfmove clock (more randomness in opening)
        const randomFactor = board.halfMoveClock > 10
            ? board.halfMoveClock - 10
            : 1;

        let bestMove: InternalMove = moves[0];
        let bestScore = SCORE_MIN;

        // Search each root move
        for (const move of moves) {
            // Make move (generateLegalMoves already filtered for legality)
            const testBoard = this.copyBoard(board);
            applyMoveComplete(testBoard, move);

            // Determine if this move captured a piece
            const wasCapture = move.capturedPiece !== 0;

            // Calculate initial score (for capture optimization)
            const initialScore = wasCapture
                ? Evaluator.evaluate(testBoard, playerColor)
                : null;

            // Check if this move delivers checkmate (highest priority)
            if (testBoard.isCheckmate && testBoard.turn !== playerColor) {
                // Opponent is in checkmate - immediately return this move
                return {
                    move,
                    score: SCORE_MAX,
                    depth: baseDepth,
                    nodesSearched: this.nodesSearched,
                };
            }

            // For promotion moves, always prefer queen promotion
            // (Other promotions are rarely optimal except in special tactical situations)
            if ((move.flags & MoveFlag.PROMOTION) && move.promotionPiece) {
                const isQueenPromotion =
                    move.promotionPiece === Piece.WHITE_QUEEN ||
                    move.promotionPiece === Piece.BLACK_QUEEN;

                if (!isQueenPromotion) {
                    // Skip non-queen promotions (they're almost never best)
                    continue;
                }
            }

            // Search this move
            const score =
                -this.alphaBeta(
                    testBoard,
                    playerColor,
                    baseDepth,
                    extendedDepth,
                    1, // depth = 1
                    wasCapture,
                    initialScore,
                    SCORE_MIN,
                    SCORE_MAX
                );

            // For non-checkmate moves, add positional bonus and randomness
            let finalScore = score;

            // Only add randomness for non-decisive moves (not near mate scores)
            if (Math.abs(score) < SCORE_MAX - 100) {
                // Add positional bonus
                const positionalBonus = Evaluator.evaluate(testBoard, playerColor) -
                    Evaluator.evaluate(board, playerColor);

                // Add small random factor (v1 compatibility)
                const random = Math.floor(Math.random() * randomFactor * 10) / 10;

                finalScore = score + positionalBonus + random;
            }

            // Update best move
            if (finalScore > bestScore) {
                bestScore = finalScore;
                bestMove = move;
            }
        }

        return {
            move: bestMove,
            score: bestScore,
            depth: baseDepth,
            nodesSearched: this.nodesSearched,
        };
    }

    /**
     * Alpha-beta search with extensions
     *
     * @param board - Current position
     * @param rootPlayerColor - Player color at root (for evaluation perspective)
     * @param baseDepth - Base search depth
     * @param extendedDepth - Extended search depth
     * @param depth - Current depth
     * @param wasCapture - Whether last move was a capture
     * @param initialScore - Initial score (optimization)
     * @param alpha - Alpha bound
     * @param beta - Beta bound
     * @returns Score from current player's perspective
     */
    private alphaBeta(
        board: InternalBoard,
        rootPlayerColor: InternalColor,
        baseDepth: number,
        extendedDepth: number,
        depth: number,
        wasCapture: boolean,
        initialScore: Score | null,
        alpha: Score,
        beta: Score
    ): Score {
        this.nodesSearched++;

        // Check if game is over
        if (board.isCheckmate || board.isStalemate) {
            return Evaluator.evaluate(board, rootPlayerColor, depth);
        }

        // Determine if we should continue searching
        let shouldSearch = false;

        const inCheck = isKingInCheck(board);

        // Extend search if in check (always search deeper)
        if (depth < extendedDepth && inCheck) {
            shouldSearch = true;
        }
        // Continue base search or extend on captures
        else if (depth < baseDepth || (wasCapture && depth < extendedDepth)) {
            shouldSearch = true;
        }

        // Leaf node - evaluate position
        if (!shouldSearch) {
            if (initialScore !== null) {
                return initialScore;
            }
            return Evaluator.evaluate(board, rootPlayerColor);
        }

        // Generate legal moves (with limit for extended search)
        // In v1, extended search used getMoves with limit=5 for non-check positions
        const moves = inCheck || depth < baseDepth
            ? generateLegalMoves(board)
            : generateLegalMoves(board); // No limit for now (Phase 4)

        // Determine if we're maximizing or minimizing
        const isMaximizing = board.turn === rootPlayerColor;
        let bestScore = isMaximizing ? SCORE_MIN : SCORE_MAX;
        let maxValueReached = false;

        // Search all moves
        for (const move of moves) {
            if (maxValueReached) break;

            // Make move (generateLegalMoves already filtered for legality)
            const testBoard = this.copyBoard(board);
            applyMoveComplete(testBoard, move);

            // Check if this move captured a piece
            const moveWasCapture = move.capturedPiece !== 0;

            // Calculate score if capture
            const moveInitialScore = moveWasCapture
                ? Evaluator.evaluate(testBoard, rootPlayerColor)
                : initialScore;

            // Recursive search
            const score = this.alphaBeta(
                testBoard,
                rootPlayerColor,
                baseDepth,
                extendedDepth,
                depth + 1,
                moveWasCapture,
                moveInitialScore,
                alpha,
                beta
            );

            // Check for exact mate found
            if (Math.abs(score) >= SCORE_MAX - 100) {
                maxValueReached = true;
            }

            // Update best score and bounds
            if (isMaximizing) {
                bestScore = Math.max(bestScore, score);
                alpha = Math.max(alpha, score);
            } else {
                bestScore = Math.min(bestScore, score);
                beta = Math.min(beta, score);
            }

            // Alpha-beta cutoff
            if (beta <= alpha) {
                break; // Prune
            }
        }

        return bestScore;
    }

    /**
     * Copy board for search (fast struct copy)
     *
     * @param board - Board to copy
     * @returns New board instance
     */
    private copyBoard(board: InternalBoard): InternalBoard {
        return {
            mailbox: new Int8Array(board.mailbox),
            whitePieces: board.whitePieces,
            blackPieces: board.blackPieces,
            allPieces: board.allPieces,
            whitePawns: board.whitePawns,
            whiteKnights: board.whiteKnights,
            whiteBishops: board.whiteBishops,
            whiteRooks: board.whiteRooks,
            whiteQueens: board.whiteQueens,
            whiteKing: board.whiteKing,
            blackPawns: board.blackPawns,
            blackKnights: board.blackKnights,
            blackBishops: board.blackBishops,
            blackRooks: board.blackRooks,
            blackQueens: board.blackQueens,
            blackKing: board.blackKing,
            turn: board.turn,
            castlingRights: { ...board.castlingRights },
            enPassantSquare: board.enPassantSquare,
            halfMoveClock: board.halfMoveClock,
            fullMoveNumber: board.fullMoveNumber,
            zobristHash: board.zobristHash,
            isCheck: board.isCheck,
            isCheckmate: board.isCheckmate,
            isStalemate: board.isStalemate,
        };
    }
}
