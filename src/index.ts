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
import { parseFEN, toFEN, getStartingFEN } from './utils/fen';
import { squareToIndex, indexToSquare } from './utils/conversion';
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
        return boardToConfig(this.board);
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
     * Print board to console (ASCII representation)
     */
    printToConsole(): void {
        console.log('\n  +---+---+---+---+---+---+---+---+');

        for (let rank = 7; rank >= 0; rank--) {
            let row = `${rank + 1} |`;

            for (let file = 0; file < 8; file++) {
                const index = rank * 8 + file;
                const piece = this.board.mailbox[index];
                const symbol = pieceToSymbol(piece);
                row += ` ${symbol} |`;
            }

            console.log(row);
            console.log('  +---+---+---+---+---+---+---+---+');
        }

        console.log('    A   B   C   D   E   F   G   H\n');
    }

    /**
     * Make an AI move
     *
     * @param level - AI level (0-4, default 2)
     * @returns Board configuration after AI move
     */
    aiMove(level: number = 2): BoardConfig {
        // Validate level
        if (level < 0 || level > 4) {
            throw new Error('AI level must be between 0 and 4');
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

        return boardToConfig(this.board);
    }
}

/**
 * Helper function to convert piece enum to symbol for printing
 */
function pieceToSymbol(piece: number): string {
    const symbols: Record<number, string> = {
        0: ' ',  // EMPTY
        1: 'P',  // WHITE_PAWN
        2: 'N',  // WHITE_KNIGHT
        3: 'B',  // WHITE_BISHOP
        4: 'R',  // WHITE_ROOK
        5: 'Q',  // WHITE_QUEEN
        6: 'K',  // WHITE_KING
        7: 'p',  // BLACK_PAWN
        8: 'n',  // BLACK_KNIGHT
        9: 'b',  // BLACK_BISHOP
        10: 'r', // BLACK_ROOK
        11: 'q', // BLACK_QUEEN
        12: 'k', // BLACK_KING
    };
    return symbols[piece] || ' ';
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
 * Make an AI move
 *
 * @param config - Board configuration or FEN string
 * @param level - AI level (0-4, default 2)
 * @returns Board configuration after AI move
 */
export function aiMove(config: BoardConfig | string, level: number = 2): BoardConfig {
    const game = new Game(config);
    return game.aiMove(level);
}
