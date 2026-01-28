/**
 * Alpha-beta search implementation for js-chess-engine v2
 *
 * Implements minimax with alpha-beta pruning and extensions for checks and captures.
 * Phase 5: Enhanced with transposition table, move ordering, and iterative deepening.
 */

import { InternalBoard, InternalColor, InternalMove, MoveFlag, Piece } from '../types';
import { generateLegalMoves, applyMoveComplete } from '../core/MoveGenerator';
import { isKingInCheck } from '../core/AttackDetector';
import { Evaluator, SCORE_MIN, SCORE_MAX } from './Evaluator';
import { Score, SearchResult } from '../types/ai.types';
import { TranspositionTable, TTEntryType } from './TranspositionTable';
import { KillerMoves, orderMoves } from './MoveOrdering';

/**
 * Search engine with alpha-beta pruning, transposition table, and move ordering
 */
export class Search {
    private nodesSearched: number = 0;
    private transpositionTable: TranspositionTable | null;
    private killerMoves: KillerMoves;
    private useOptimizations: boolean = true;

    constructor(ttSizeMB: number = 16) {
        // Only create TT if size > 0
        this.transpositionTable = ttSizeMB > 0 ? new TranspositionTable(ttSizeMB) : null as any;
        this.killerMoves = new KillerMoves();
    }

    /**
     * Enable or disable optimizations (for testing)
     */
    setOptimizations(enabled: boolean): void {
        this.useOptimizations = enabled;
    }

    /**
     * Clear search data structures
     */
    clear(): void {
        if (this.transpositionTable) {
            this.transpositionTable.clear();
        }
        this.killerMoves.clear();
    }

    /**
     * Find the best move using alpha-beta search with iterative deepening
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
        if (this.transpositionTable) {
            this.transpositionTable.newSearch();
        }
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

        // Iterative deepening: search progressively deeper
        // This improves move ordering for deeper searches
        if (this.useOptimizations && baseDepth > 2) {
            for (let depth = 1; depth < baseDepth; depth++) {
                this.searchDepth(
                    board,
                    playerColor,
                    depth,
                    Math.min(depth + 1, extendedDepth),
                    moves
                );
            }
        }

        // Get PV move from transposition table for move ordering (if available)
        const pvMove = this.useOptimizations && this.transpositionTable
            ? this.transpositionTable.getBestMove(board.zobristHash)
            : null;

        // Order moves for better alpha-beta pruning
        const orderedMoves = this.useOptimizations
            ? orderMoves(moves, pvMove, this.killerMoves, 0)
            : moves;

        // Search each root move
        for (const move of orderedMoves) {
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

        // Store in transposition table (if available)
        if (this.useOptimizations && this.transpositionTable) {
            this.transpositionTable.store(
                board.zobristHash,
                baseDepth,
                bestScore,
                TTEntryType.EXACT,
                bestMove
            );
        }

        return {
            move: bestMove,
            score: bestScore,
            depth: baseDepth,
            nodesSearched: this.nodesSearched,
        };
    }

    /**
     * Search at a specific depth (used for iterative deepening)
     */
    private searchDepth(
        board: InternalBoard,
        playerColor: InternalColor,
        baseDepth: number,
        extendedDepth: number,
        moves: InternalMove[]
    ): void {
        const pvMove = this.transpositionTable
            ? this.transpositionTable.getBestMove(board.zobristHash)
            : null;
        const orderedMoves = orderMoves(moves, pvMove, this.killerMoves, 0);

        let bestMove: InternalMove = orderedMoves[0];
        let bestScore = SCORE_MIN;

        for (const move of orderedMoves) {
            const testBoard = this.copyBoard(board);
            applyMoveComplete(testBoard, move);

            const wasCapture = move.capturedPiece !== 0;
            const initialScore = wasCapture
                ? Evaluator.evaluate(testBoard, playerColor)
                : null;

            const score = -this.alphaBeta(
                testBoard,
                playerColor,
                baseDepth,
                extendedDepth,
                1,
                wasCapture,
                initialScore,
                SCORE_MIN,
                SCORE_MAX
            );

            if (score > bestScore) {
                bestScore = score;
                bestMove = move;
            }
        }

        // Store result in transposition table (if available)
        if (this.transpositionTable) {
            this.transpositionTable.store(
                board.zobristHash,
                baseDepth,
                bestScore,
                TTEntryType.EXACT,
                bestMove
            );
        }
    }

    /**
     * Alpha-beta search with extensions, transposition table, and move ordering
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

        // Probe transposition table (if available)
        if (this.useOptimizations && this.transpositionTable) {
            const ttEntry = this.transpositionTable.probe(
                board.zobristHash,
                baseDepth - depth + 1,
                alpha,
                beta
            );

            if (ttEntry && ttEntry.depth >= baseDepth - depth + 1) {
                // We can use this score
                if (ttEntry.type === TTEntryType.EXACT) {
                    return ttEntry.score;
                }
                if (ttEntry.type === TTEntryType.LOWER_BOUND && ttEntry.score >= beta) {
                    return ttEntry.score;
                }
                if (ttEntry.type === TTEntryType.UPPER_BOUND && ttEntry.score <= alpha) {
                    return ttEntry.score;
                }
            }
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

        // Generate legal moves
        const moves = generateLegalMoves(board);

        // Get PV move from transposition table for move ordering (if available)
        const pvMove = this.useOptimizations && this.transpositionTable
            ? this.transpositionTable.getBestMove(board.zobristHash)
            : null;

        // Order moves for better pruning
        const orderedMoves = this.useOptimizations
            ? orderMoves(moves, pvMove, this.killerMoves, depth)
            : moves;

        // Determine if we're maximizing or minimizing
        const isMaximizing = board.turn === rootPlayerColor;
        let bestScore = isMaximizing ? SCORE_MIN : SCORE_MAX;
        let bestMove: InternalMove | null = null;
        let maxValueReached = false;

        // Search all moves
        for (const move of orderedMoves) {
            if (maxValueReached) break;

            // Make move (generateLegalMoves already filtered for legality)
            const testBoard = this.copyBoard(board);
            applyMoveComplete(testBoard, move);

            // Check if this move captured a piece
            const moveWasCapture = move.capturedPiece !== 0;

            // Calculate score if capture
            const moveInitialScore = moveWasCapture
                ? Evaluator.evaluate(testBoard, rootPlayerColor)
                : null;

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
                if (score > bestScore) {
                    bestScore = score;
                    bestMove = move;
                }
                alpha = Math.max(alpha, score);
            } else {
                if (score < bestScore) {
                    bestScore = score;
                    bestMove = move;
                }
                beta = Math.min(beta, score);
            }

            // Alpha-beta cutoff
            if (beta <= alpha) {
                // Store killer move (non-captures that caused cutoff)
                if (this.useOptimizations && !(move.flags & MoveFlag.CAPTURE)) {
                    this.killerMoves.store(move, depth);
                }
                break; // Prune
            }
        }

        // Store in transposition table (if available)
        if (this.useOptimizations && this.transpositionTable && bestMove) {
            let entryType: TTEntryType;
            if (bestScore <= alpha) {
                entryType = TTEntryType.UPPER_BOUND;
            } else if (bestScore >= beta) {
                entryType = TTEntryType.LOWER_BOUND;
            } else {
                entryType = TTEntryType.EXACT;
            }

            this.transpositionTable.store(
                board.zobristHash,
                baseDepth - depth + 1,
                bestScore,
                entryType,
                bestMove
            );
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
