/**
 * js-chess-engine v2
 *
 * Public API for chess game management
 */

import {
    InternalBoard,
    BoardConfig,
    MovesMap,
    Square,
    PieceSymbol,
    HistoryEntry,
} from './types';
import { createStartingBoard, setPiece as setBoardPiece, removePiece as removeBoardPiece, copyBoard } from './core/Board';
import { generateLegalMoves, applyMoveComplete, getMovesForPiece } from './core/MoveGenerator';
import { isKingInCheck } from './core/AttackDetector';
import { parseFEN, toFEN, getStartingFEN, validateFEN } from './utils/fen';
import { squareToIndex, indexToSquare } from './utils/conversion';
import { getDefaultTTSize, getRecommendedTTSize } from './utils/environment';
import {
    boardToConfig,
    configToBoard,
    movesToMap,
    movesFromSquare,
    normalizeSquare,
    symbolToPiece,
} from './adapters/APIAdapter';
import { AIEngine } from './ai/AIEngine';
import { AILevel } from './types/ai.types';

// Export types for TypeScript users
export * from './types';

/**
 * Main Game class - manages chess game state and moves
 */
export class Game {
    private board: InternalBoard;
    private history: HistoryEntry[] = [];
    private aiEngine: AIEngine;

    /**
     * Create a new game
     *
     * @param configuration - Optional board configuration (JSON object, FEN string, or undefined for new game)
     */
    constructor(configuration?: BoardConfig | string) {
        this.aiEngine = new AIEngine();

        if (!configuration) {
            // New game with standard starting position
            this.board = createStartingBoard();
        } else if (typeof configuration === 'string') {
            // FEN string
            validateFEN(configuration);
            this.board = parseFEN(configuration);
        } else {
            // BoardConfig object
            this.board = configToBoard(configuration);
        }
    }

    /**
     * Make a move
     *
     * @param from - From square (case-insensitive, e.g., 'E2' or 'e2')
     * @param to - To square (case-insensitive, e.g., 'E4' or 'e4')
     * @returns Board configuration after the move
     */
    move(from: string, to: string): BoardConfig {
        const fromNorm = normalizeSquare(from);
        const toNorm = normalizeSquare(to);

        const fromIndex = squareToIndex(fromNorm);
        const toIndex = squareToIndex(toNorm);

        // Find the matching legal move
        const legalMoves = generateLegalMoves(this.board);
        const move = legalMoves.find(m => m.from === fromIndex && m.to === toIndex);

        if (!move) {
            throw new Error(`Invalid move from ${fromNorm} to ${toNorm}`);
        }

        // Record move in history
        const historyEntry: HistoryEntry = { [fromNorm]: toNorm };
        this.history.push(historyEntry);

        // Apply the move
        applyMoveComplete(this.board, move);

        return boardToConfig(this.board);
    }

    /**
     * Get all legal moves, optionally filtered by from-square
     *
     * @param from - Optional from square to filter moves
     * @returns Map of from-squares to array of to-squares
     */
    moves(from?: string): MovesMap {
        if (from) {
            const fromNorm = normalizeSquare(from);
            const fromIndex = squareToIndex(fromNorm);
            const pieceMoves = getMovesForPiece(this.board, fromIndex);
            const toSquares = movesFromSquare(pieceMoves, fromIndex);
            return { [fromNorm]: toSquares };
        } else {
            const allMoves = generateLegalMoves(this.board);
            return movesToMap(allMoves);
        }
    }

    /**
     * Set a piece on a square
     *
     * @param square - Square to place piece (case-insensitive)
     * @param piece - Piece symbol (K, Q, R, B, N, P, k, q, r, b, n, p)
     */
    setPiece(square: string, piece: PieceSymbol): void {
        const squareNorm = normalizeSquare(square);
        const squareIndex = squareToIndex(squareNorm);
        const pieceEnum = symbolToPiece(piece);
        setBoardPiece(this.board, squareIndex, pieceEnum);
    }

    /**
     * Remove a piece from a square
     *
     * @param square - Square to remove piece from (case-insensitive)
     */
    removePiece(square: string): void {
        const squareNorm = normalizeSquare(square);
        const squareIndex = squareToIndex(squareNorm);
        removeBoardPiece(this.board, squareIndex);
    }

    /**
     * Get move history
     *
     * @returns Array of history entries with board state after each move
     */
    getHistory(): Array<BoardConfig & { move: HistoryEntry }> {
        const result: Array<BoardConfig & { move: HistoryEntry }> = [];

        // Replay all moves from the beginning
        const startingBoard = typeof this.board === 'string'
            ? parseFEN(this.board)
            : createStartingBoard();

        const tempBoard = copyBoard(startingBoard);

        for (const move of this.history) {
            const [from, to] = Object.entries(move)[0];
            const fromIndex = squareToIndex(from);
            const toIndex = squareToIndex(to);

            const legalMoves = generateLegalMoves(tempBoard);
            const matchingMove = legalMoves.find(m => m.from === fromIndex && m.to === toIndex);

            if (matchingMove) {
                applyMoveComplete(tempBoard, matchingMove);
                const config = boardToConfig(tempBoard);
                result.push({ ...config, move });
            }
        }

        return result;
    }

    /**
     * Export current board state as JSON configuration
     *
     * @returns Board configuration object
     */
    exportJson(): BoardConfig {
        const cfg = boardToConfig(this.board);
        this.updateConfigStatusFromBoard(this.board, cfg);
        return cfg;
    }

    /**
     * Export current board state as FEN string
     *
     * @returns FEN string
     */
    exportFEN(): string {
        return toFEN(this.board);
    }

    /**
     * Print board to console (Unicode chess pieces)
     */
    printToConsole(): void {
        process.stdout.write('\n');

        for (let rank = 7; rank >= 0; rank--) {
            process.stdout.write(`${rank + 1}`);

            for (let file = 0; file < 8; file++) {
                const index = rank * 8 + file;
                const piece = this.board.mailbox[index];
                const isWhiteSquare = (rank + file) % 2 === 0;

                const symbol = pieceToUnicode(piece, isWhiteSquare);
                process.stdout.write(symbol);
            }

            process.stdout.write('\n');
        }

        process.stdout.write(' ABCDEFGH\n');
    }

    /**
     * Make an AI move (v1 compatible - returns only the move)
     *
    * @param level - AI level (1-5, default 3)
     * @returns The played move object (e.g., {"E2": "E4"})
     */
    aiMove(level: number = 3): HistoryEntry {
        // Validate level
        if (level < 1 || level > 6) {
            throw new Error('AI level must be between 1 and 6');
        }

        // Find best move
        const bestMove = this.aiEngine.findBestMove(this.board, level as AILevel);

        if (!bestMove) {
            // No legal moves available - game must be finished (checkmate or stalemate)
            throw new Error('Game is already finished');
        }

        // Record move in history
        const fromSquare = indexToSquare(bestMove.from);
        const toSquare = indexToSquare(bestMove.to);
        const historyEntry: HistoryEntry = { [fromSquare]: toSquare };
        this.history.push(historyEntry);

        // Apply the move
        applyMoveComplete(this.board, bestMove);

        return historyEntry;
    }

    /**
     * Make an AI move and return both move and board state
     *
     * @param options - Optional configuration object
     * @param options.level - AI difficulty level (1-5, default: 3). Values > 5 are clamped to 5.
     * @param options.play - Whether to apply the move to the game (default: true). If false, only returns the move without modifying game state.
     * @param options.ttSizeMB - Transposition table size in MB (0 to disable, 0.25-256). Default: auto-scaled by level (e.g., level 3: 8 MB Node.js, 4 MB browser)
     * @returns Object containing the move and board configuration (current state if play=false, updated state if play=true)
     */
    ai(options: { level?: number; play?: boolean; ttSizeMB?: number } = {}): { move: HistoryEntry; board: BoardConfig } {
        const requestedLevel = options.level ?? 3;
        const level = Math.max(1, Math.min(5, requestedLevel));
        const play = options.play ?? true;
        // Allow 0 to disable TT, or 0.25-256 MB range
        // Default: auto-scaled by AI level (lower levels use less memory, higher levels use more)
        const defaultSize = getRecommendedTTSize(level);
        const ttSizeMB = options.ttSizeMB === 0 ? 0 : Math.max(0.25, Math.min(256, options.ttSizeMB ?? defaultSize));

        // Validate level (requested value)
        if (requestedLevel < 1 || requestedLevel > 5) {
            throw new Error('AI level must be between 1 and 5');
        }

        // Find best move
        const bestMove = this.aiEngine.findBestMove(this.board, level as AILevel, ttSizeMB);

        if (!bestMove) {
            // No legal moves available - game must be finished (checkmate or stalemate)
            throw new Error('Game is already finished');
        }

        // Create move entry
        const fromSquare = indexToSquare(bestMove.from);
        const toSquare = indexToSquare(bestMove.to);
        const historyEntry: HistoryEntry = { [fromSquare]: toSquare };

        if (!play) {
            // Return move without applying it, with current board state.
            // Still return a consistent status snapshot.
            const cfg = boardToConfig(this.board);
            this.updateConfigStatusFromBoard(this.board, cfg);
            return { move: historyEntry, board: cfg };
        }

        // Record move in history and apply it
        this.history.push(historyEntry);
        applyMoveComplete(this.board, bestMove);

        const cfg = boardToConfig(this.board);
        this.updateConfigStatusFromBoard(this.board, cfg);

        return {
            move: historyEntry,
            board: cfg,
        };
    }

    private updateConfigStatusFromBoard(board: InternalBoard, cfg: BoardConfig): void {
        // The internal engine doesn't always keep the public BoardConfig status fields
        // (check/checkMate/staleMate/isFinished) in sync after applying a move.
        // These flags are part of the public API and are used heavily in tests.
        const inCheck = isKingInCheck(board);
        const moves = generateLegalMoves(board);
        const isMate = inCheck && moves.length === 0;
        const isStalemate = !inCheck && moves.length === 0;

        (cfg as any).check = inCheck;
        (cfg as any).checkMate = isMate;
        (cfg as any).staleMate = isStalemate;
        (cfg as any).isFinished = isMate || isStalemate;
    }
}

/**
 * Helper function to convert piece enum to Unicode symbol for printing
 */
function pieceToUnicode(piece: number, isWhiteSquare: boolean): string {
    const symbols: Record<number, string> = {
        0: isWhiteSquare ? '\u2588' : '\u2591',  // EMPTY - filled/light block
        1: '\u2659',  // WHITE_PAWN ♙
        2: '\u2658',  // WHITE_KNIGHT ♘
        3: '\u2657',  // WHITE_BISHOP ♗
        4: '\u2656',  // WHITE_ROOK ♖
        5: '\u2655',  // WHITE_QUEEN ♕
        6: '\u2654',  // WHITE_KING ♔
        7: '\u265F',  // BLACK_PAWN ♟
        8: '\u265E',  // BLACK_KNIGHT ♞
        9: '\u265D',  // BLACK_BISHOP ♝
        10: '\u265C', // BLACK_ROOK ♜
        11: '\u265B', // BLACK_QUEEN ♛
        12: '\u265A', // BLACK_KING ♚
    };
    return symbols[piece] || (isWhiteSquare ? '\u2588' : '\u2591');
}

// ==================== Stateless Functions ====================

/**
 * Get all legal moves for a position
 *
 * @param config - Board configuration or FEN string
 * @returns Map of from-squares to array of to-squares
 */
export function moves(config: BoardConfig | string): MovesMap {
    const game = new Game(config);
    return game.moves();
}

/**
 * Get board status
 *
 * @param config - Board configuration or FEN string
 * @returns Board configuration with current status
 */
export function status(config: BoardConfig | string): BoardConfig {
    const game = new Game(config);
    return game.exportJson();
}

/**
 * Get FEN string for a position
 *
 * @param config - Board configuration or FEN string
 * @returns FEN string
 */
export function getFen(config: BoardConfig | string): string {
    const game = new Game(config);
    return game.exportFEN();
}

/**
 * Make a move on a board
 *
 * @param config - Board configuration or FEN string
 * @param from - From square
 * @param to - To square
 * @returns Board configuration after the move
 */
export function move(config: BoardConfig | string, from: string, to: string): BoardConfig {
    const game = new Game(config);
    return game.move(from, to);
}

/**
 * Make an AI move (v1 compatible - returns only the move)
 *
 * @param config - Board configuration or FEN string
 * @param level - AI level (1-5, default 3)
 * @returns The played move object (e.g., {"E2": "E4"})
 */
export function aiMove(config: BoardConfig | string, level: number = 3): HistoryEntry {
    const game = new Game(config);
    return game.aiMove(level);
}

/**
 * Make an AI move and return both move and board state
 *
 * @param config - Board configuration or FEN string
 * @param options - Optional configuration object
 * @param options.level - AI difficulty level (1-5, default: 3)
 * @param options.play - Whether to apply the move to the game (default: true). If false, only returns the move without modifying game state.
 * @param options.ttSizeMB - Transposition table size in MB (0 to disable, 0.25-256). Default: auto-scaled by level (e.g., level 3: 8 MB Node.js, 4 MB browser)
 * @returns Object containing the move and board configuration (current state if play=false, updated state if play=true)
 */
export function ai(
    config: BoardConfig | string,
    options: { level?: number; play?: boolean; ttSizeMB?: number } = {}
): { move: HistoryEntry; board: BoardConfig } {
    const game = new Game(config);
    return game.ai(options);
}
