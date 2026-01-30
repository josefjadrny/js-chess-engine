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
import { isSquareAttacked } from '../core/AttackDetector';

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

    // Debug: log first few moves (only at root, only first search)
        const debugRoot = false; // Set to true for debugging
        const debugMoves: Array<{ move: string, score: number }> = [];

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
            // Note: alphaBeta already handles minimax internally (isMaximizing logic),
            // so we don't negate the result. It returns scores from rootPlayerColor perspective.
            const score = this.alphaBeta(
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

            // Heuristic guardrail: avoid obvious "hang the moved piece" blunders at the root.
            // This helps especially at low/medium depths where the search may miss immediate recaptures.
            // We only apply a penalty if the moved piece ends up attacked by the opponent.
            let finalScore = score;

            // Determine the moved piece type (used by multiple heuristics below)
            const absPiece = move.piece;
            const isQueen = absPiece === Piece.WHITE_QUEEN || absPiece === Piece.BLACK_QUEEN;
            const isRook = absPiece === Piece.WHITE_ROOK || absPiece === Piece.BLACK_ROOK;
            const isBishop = absPiece === Piece.WHITE_BISHOP || absPiece === Piece.BLACK_BISHOP;
            const isKnight = absPiece === Piece.WHITE_KNIGHT || absPiece === Piece.BLACK_KNIGHT;
            const isPawn = absPiece === Piece.WHITE_PAWN || absPiece === Piece.BLACK_PAWN;
            const isKing = absPiece === Piece.WHITE_KING || absPiece === Piece.BLACK_KING;

            const movedPieceSquare = move.to;
            const opponentColor = playerColor === InternalColor.WHITE ? InternalColor.BLACK : InternalColor.WHITE;
            const movedPieceAttacked = isSquareAttacked(testBoard, movedPieceSquare, opponentColor);
            if (movedPieceAttacked) {

                // Penalties are in the same score scale as Evaluator (centipawn-ish).
                // Queen hangs should be strongly discouraged.
                // Never apply this heuristic to king moves.
                // The king is *supposed* to step into attacked squares only when illegal; legality is already filtered
                // by move generation, so penalizing attacked king squares can distort endgames.
                // Also skip full penalty for promotion moves: often tactically sound even if the new piece is attacked.
                //
                // IMPORTANT: Penalty application strategy:
                // 1. Non-captures: Full penalty (piece hangs for nothing)
                // 2. Checking captures: 50% penalty (tactical sacrifices)
                // 3. Regular captures with valuable pieces (Q, R): 40% penalty (discourage bad trades like Qxp hanging)
                // 4. Regular captures with minor pieces (B, N, p): No penalty (allow normal trades)
                const isCapture = (move.flags & MoveFlag.CAPTURE) !== 0;
                const isCheckingMove = testBoard.isCheck;
                const isCheckingCapture = isCheckingMove && isCapture;
                const isRegularCapture = isCapture && !isCheckingMove;
                const isValuablePiece = isQueen || isRook; // Queen and Rook are valuable

                // Apply penalty based on move type
                if (!isKing && !(move.flags & MoveFlag.PROMOTION)) {
                    const basePenalty = isQueen ? 120 : isRook ? 60 : (isBishop || isKnight) ? 35 : isPawn ? 15 : 0;

                    if (!isCapture) {
                        // Non-capture: full penalty
                        finalScore -= basePenalty;
                    } else if (isCheckingCapture) {
                        // Checking capture: 50% penalty (allow tactical sacs)
                        finalScore -= Math.floor(basePenalty * 0.5);
                    } else if (isRegularCapture && isValuablePiece) {
                        // Regular capture with valuable piece: 40% penalty (discourage Qxp hanging)
                        finalScore -= Math.floor(basePenalty * 0.4);
                    }
                    // Regular captures with minor pieces: no penalty (allow normal trades)
                }
            }

            // Strongly encourage promotions at the root.
            // Promotion is almost always the best conversion in endgames, and this helps shallow searches.
            if (move.flags & MoveFlag.PROMOTION) {
                finalScore += 200;
            }

            // Strongly reward castling in the opening/middlegame
            // Castling is a fundamental strategic concept that should be prioritized
            const isCastling = (move.flags & MoveFlag.CASTLING) !== 0;
            const isOpening = testBoard.fullMoveNumber < 15; // Opening/early middlegame
            if (isCastling && isOpening) {
                finalScore += 50; // Large bonus to encourage castling
            }

            // Reward central pawn pushes in the opening
            // E2-E4, D2-D4, E7-E5, D7-D5 are key opening moves
            if (isPawn && testBoard.fullMoveNumber < 5) {
                const fromRank = Math.floor(move.from / 8);
                const toRank = Math.floor(move.to / 8);
                const toFile = move.to % 8;

                // Check for central pawn (d or e file) moving 2 squares from starting position
                const isCentralFile = toFile === 3 || toFile === 4; // d or e file
                const isTwoSquarePush = Math.abs(toRank - fromRank) === 2;
                const isFromStartingRank = (playerColor === InternalColor.WHITE && fromRank === 1) ||
                                           (playerColor === InternalColor.BLACK && fromRank === 6);

                if (isCentralFile && isTwoSquarePush && isFromStartingRank) {
                    finalScore += 30; // Encourage E2-E4, D2-D4, etc.
                }
            }

            // Debug logging
            if (debugRoot && debugMoves.length < 20) {  // Increased to 20 to see more moves
                const fromFile = String.fromCharCode(65 + (move.from % 8));
                const fromRank = Math.floor(move.from / 8) + 1;
                const toFile = String.fromCharCode(65 + (move.to % 8));
                const toRank = Math.floor(move.to / 8) + 1;
                const moveStr = `${fromFile}${fromRank}-${toFile}${toRank}`;
                debugMoves.push({ move: moveStr, score: finalScore });
            }

            // Update best move.
            // Use a tiny deterministic tie-breaker so equal evaluations don't behave like “random”.
            // Prefer:
            // 1) captures
            // 2) promotions
            // 3) checks
            const tieBreaker =
                (move.flags & MoveFlag.CAPTURE ? 3 : 0) +
                (move.flags & MoveFlag.PROMOTION ? 2 : 0) +
                (testBoard.isCheck ? 1 : 0);

            const bestTieBreaker =
                (bestMove.flags & MoveFlag.CAPTURE ? 3 : 0) +
                (bestMove.flags & MoveFlag.PROMOTION ? 2 : 0) +
                ((bestMove as any)._deliversCheck ? 1 : 0);

            // Note: bestMove doesn't carry board state, so we stash whether a move gave check
            // for tie-breaking at the root only.
            (move as any)._deliversCheck = testBoard.isCheck;

            if (finalScore > bestScore || (finalScore === bestScore && tieBreaker > bestTieBreaker)) {
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

        // Debug output
        if (debugRoot && debugMoves.length > 0) {
            console.log('\n=== ROOT SEARCH DEBUG (depth=' + baseDepth + ') ===');
            debugMoves.sort((a, b) => b.score - a.score);
            debugMoves.forEach((m, i) => {
                const marker = i === 0 ? ' ← BEST' : '';
                console.log(`  ${m.move}: ${m.score}${marker}`);
            });
            console.log('===================================\n');
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

            // Note: alphaBeta handles minimax internally, don't negate
            const score = this.alphaBeta(
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

        // Save original window bounds for correct TT entry classification.
        // Alpha/beta are mutated during the search.
        const originalAlpha = alpha;
        const originalBeta = beta;

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
            if (bestScore <= originalAlpha) {
                entryType = TTEntryType.UPPER_BOUND;
            } else if (bestScore >= originalBeta) {
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
