/**
 * API Adapter for converting between internal and external representations
 *
 * Internal format uses:
 * - Square indices (0-63)
 * - Piece enums
 * - InternalColor enum
 *
 * External format (v1 API) uses:
 * - Square strings (A1-H8)
 * - Piece symbols (K, Q, R, B, N, P, k, q, r, b, n, p)
 * - Color strings ('white', 'black')
 */

import {
    InternalBoard,
    BoardConfig,
    MovesMap,
    Piece,
    PieceSymbol,
    InternalColor,
    Color,
    Square,
    SquareIndex,
} from '../types';
import { indexToSquare, squareToIndex } from '../utils/conversion';
import { InternalMove } from '../types/move.types';

/**
 * Convert internal board to public board configuration
 *
 * @param board - Internal board representation
 * @returns Public board configuration (v1 API format)
 */
export function boardToConfig(board: InternalBoard): BoardConfig {
    const pieces: Record<Square, PieceSymbol> = {};

    // Convert mailbox to pieces object
    for (let i = 0; i < 64; i++) {
        const piece = board.mailbox[i];
        if (piece !== Piece.EMPTY) {
            const square = indexToSquare(i as SquareIndex);
            const symbol = pieceToSymbol(piece);
            if (symbol) {
                pieces[square] = symbol;
            }
        }
    }

    return {
        pieces,
        turn: board.turn === InternalColor.WHITE ? 'white' : 'black',
        isFinished: board.isCheckmate || board.isStalemate,
        check: board.isCheck,
        checkMate: board.isCheckmate,
        staleMate: board.isStalemate,
        castling: { ...board.castlingRights },
        enPassant: board.enPassantSquare !== null ? indexToSquare(board.enPassantSquare) : null,
        halfMove: board.halfMoveClock,
        fullMove: board.fullMoveNumber,
    };
}

/**
 * Convert public board configuration to internal board
 *
 * @param config - Public board configuration
 * @returns Internal board representation
 */
export function configToBoard(config: BoardConfig): InternalBoard {
    // We'll use FEN conversion for this as it's more straightforward
    // First convert config to FEN, then parse FEN to internal board
    // However, for simplicity, we can also build it directly
    const { parseFEN } = require('../utils/fen');
    const fen = configToFEN(config);
    return parseFEN(fen);
}

/**
 * Convert board configuration to FEN string
 *
 * @param config - Public board configuration
 * @returns FEN string
 */
export function configToFEN(config: BoardConfig): string {
    // Build piece placement string
    const ranks: string[] = [];
    for (let rank = 7; rank >= 0; rank--) {
        let rankStr = '';
        let emptyCount = 0;

        for (let file = 0; file < 8; file++) {
            const square = indexToSquare((rank * 8 + file) as SquareIndex);
            const piece = config.pieces[square];

            if (!piece) {
                emptyCount++;
            } else {
                if (emptyCount > 0) {
                    rankStr += emptyCount.toString();
                    emptyCount = 0;
                }
                rankStr += piece;
            }
        }

        if (emptyCount > 0) {
            rankStr += emptyCount.toString();
        }

        ranks.push(rankStr);
    }

    const piecePlacement = ranks.join('/');
    const activeColor = config.turn === 'white' ? 'w' : 'b';

    let castling = '';
    if (config.castling.whiteShort) castling += 'K';
    if (config.castling.whiteLong) castling += 'Q';
    if (config.castling.blackShort) castling += 'k';
    if (config.castling.blackLong) castling += 'q';
    if (!castling) castling = '-';

    const enPassant = config.enPassant ? config.enPassant.toLowerCase() : '-';
    const halfMove = config.halfMove.toString();
    const fullMove = config.fullMove.toString();

    return `${piecePlacement} ${activeColor} ${castling} ${enPassant} ${halfMove} ${fullMove}`;
}

/**
 * Convert internal moves to public moves map
 *
 * @param moves - Array of internal moves
 * @returns Public moves map (from-square -> [to-squares])
 */
export function movesToMap(moves: InternalMove[]): MovesMap {
    const movesMap: MovesMap = {};

    for (const move of moves) {
        const fromSquare = indexToSquare(move.from);
        const toSquare = indexToSquare(move.to);

        if (!movesMap[fromSquare]) {
            movesMap[fromSquare] = [];
        }

        movesMap[fromSquare].push(toSquare);
    }

    return movesMap;
}

/**
 * Convert internal moves from a specific square to array of to-squares
 *
 * @param moves - Array of internal moves
 * @param fromIndex - From square index
 * @returns Array of to-square strings
 */
export function movesFromSquare(moves: InternalMove[], fromIndex: SquareIndex): Square[] {
    return moves
        .filter(move => move.from === fromIndex)
        .map(move => indexToSquare(move.to));
}

/**
 * Convert piece enum to piece symbol
 *
 * @param piece - Internal piece enum
 * @returns Piece symbol or null if empty
 */
export function pieceToSymbol(piece: Piece): PieceSymbol | null {
    switch (piece) {
        case Piece.WHITE_KING: return 'K';
        case Piece.WHITE_QUEEN: return 'Q';
        case Piece.WHITE_ROOK: return 'R';
        case Piece.WHITE_BISHOP: return 'B';
        case Piece.WHITE_KNIGHT: return 'N';
        case Piece.WHITE_PAWN: return 'P';
        case Piece.BLACK_KING: return 'k';
        case Piece.BLACK_QUEEN: return 'q';
        case Piece.BLACK_ROOK: return 'r';
        case Piece.BLACK_BISHOP: return 'b';
        case Piece.BLACK_KNIGHT: return 'n';
        case Piece.BLACK_PAWN: return 'p';
        default: return null;
    }
}

/**
 * Convert piece symbol to piece enum
 *
 * @param symbol - Piece symbol
 * @returns Internal piece enum
 */
export function symbolToPiece(symbol: PieceSymbol): Piece {
    switch (symbol) {
        case 'K': return Piece.WHITE_KING;
        case 'Q': return Piece.WHITE_QUEEN;
        case 'R': return Piece.WHITE_ROOK;
        case 'B': return Piece.WHITE_BISHOP;
        case 'N': return Piece.WHITE_KNIGHT;
        case 'P': return Piece.WHITE_PAWN;
        case 'k': return Piece.BLACK_KING;
        case 'q': return Piece.BLACK_QUEEN;
        case 'r': return Piece.BLACK_ROOK;
        case 'b': return Piece.BLACK_BISHOP;
        case 'n': return Piece.BLACK_KNIGHT;
        case 'p': return Piece.BLACK_PAWN;
    }
}

/**
 * Convert color string to internal color
 *
 * @param color - Color string
 * @returns Internal color enum
 */
export function colorToInternal(color: Color): InternalColor {
    return color === 'white' ? InternalColor.WHITE : InternalColor.BLACK;
}

/**
 * Convert internal color to color string
 *
 * @param color - Internal color enum
 * @returns Color string
 */
export function internalToColor(color: InternalColor): Color {
    return color === InternalColor.WHITE ? 'white' : 'black';
}

/**
 * Normalize square string to uppercase (A1-H8)
 * V1 API accepts case-insensitive input
 *
 * @param square - Square string (case-insensitive)
 * @returns Normalized uppercase square string
 */
export function normalizeSquare(square: string): string {
    return square.toUpperCase();
}
