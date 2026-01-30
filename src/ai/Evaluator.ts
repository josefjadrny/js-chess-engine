/**
 * Position evaluator for js-chess-engine v2
 *
 * Evaluates chess positions using material count and piece-square tables.
 * Based on v1 implementation for API parity.
 */

import { InternalBoard, Piece, InternalColor } from '../types';
import { Score } from '../types/ai.types';

// ==================== Constants ====================

/**
 * Material values (base unit = 1 pawn)
 */
const PIECE_VALUES: Record<number, number> = {
    [Piece.WHITE_PAWN]: 1,
    [Piece.WHITE_KNIGHT]: 3,
    [Piece.WHITE_BISHOP]: 3,
    [Piece.WHITE_ROOK]: 5,
    // Queen is intentionally valued a bit higher to better discourage
    // shallow-search blunders where the queen is sacrificed for minor material.
    [Piece.WHITE_QUEEN]: 12,
    [Piece.WHITE_KING]: 10,
    [Piece.BLACK_PAWN]: 1,
    [Piece.BLACK_KNIGHT]: 3,
    [Piece.BLACK_BISHOP]: 3,
    [Piece.BLACK_ROOK]: 5,
    [Piece.BLACK_QUEEN]: 12,
    [Piece.BLACK_KING]: 10,
};

/**
 * Score bounds for special positions
 */
export const SCORE_MIN = -1000;
export const SCORE_MAX = 1000;

/**
 * Material score multiplier (v1 compatibility)
 */
const PIECE_VALUE_MULTIPLIER = 10;

/**
 * Piece-square table multiplier (v1 compatibility)
 */
const PST_MULTIPLIER = 0.5;

// ==================== Piece-Square Tables ====================
// Tables are defined from BLACK's perspective (rank 0 = black's promotion, rank 7 = black's starting rank)
// They are reversed for white pieces in PST_MAP below
// Values are in pawns (will be multiplied by PST_MULTIPLIER)

/**
 * Pawn piece-square table (black's perspective, reversed for white)
 * Encourages center control and advancement
 * Central pawns (d4/e4) given large bonus to encourage proper opening play
 */
const PAWN_PST = [
    [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],         // Rank 0 (promotion rank)
    [5.0, 5.0, 5.0, 5.0, 5.0, 5.0, 5.0, 5.0],         // Rank 1 (7th rank - near promotion)
    [1.0, 1.0, 2.0, 3.0, 3.0, 2.0, 1.0, 1.0],         // Rank 2 (6th rank)
    [0.5, 0.5, 1.0, 4.5, 4.5, 1.0, 0.5, 0.5],         // Rank 3 (5th rank) - increased d5/e5 to 4.5
    [0.0, 0.0, 0.0, 4.0, 4.0, 0.0, 0.0, 0.0],         // Rank 4 (4th rank) - increased d4/e4 to 4.0
    [0.5, 0.5, 1.0, 2.0, 2.0, 1.0, 0.5, 0.5],         // Rank 5 (3rd rank) - increased d3/e3 to 2.0
    [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],         // Rank 6 (starting rank - neutral)
    [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],         // Rank 7 (back rank - pawns never here)
];

/**
 * Knight piece-square table (black's perspective, reversed for white)
 * Encourages centralization and active placement
 * Central squares (e4/d4/e5/d5) set equal to development squares to prevent premature centralization
 * Knights should develop to good squares (f3, c3) before jumping to ultra-central squares
 */
const KNIGHT_PST = [
    [-5.0, -4.0, -3.0, -3.0, -3.0, -3.0, -4.0, -5.0],  // Back rank
    [-4.0, -2.0, 0.0, 0.0, 0.0, 0.0, -2.0, -4.0],
    [-3.0, 0.0, 1.0, 1.5, 1.5, 1.0, 0.0, -3.0],
    [-3.0, 0.5, 1.5, 1.0, 1.0, 1.5, 0.5, -3.0],      // e5/d5 equal to c5/f5 (1.5) and less than c3 development
    [-3.0, 0.0, 1.5, 1.0, 1.0, 1.5, 0.0, -3.0],      // e4/d4 equal to c4/f4 (1.5) and less than c3 development
    [-3.0, 0.5, 1.0, 1.5, 1.5, 1.0, 0.5, -3.0],
    [-4.0, -2.0, 0.0, 0.5, 0.5, 0.0, -2.0, -4.0],
    [-5.0, -4.0, -3.0, -3.0, -3.0, -3.0, -4.0, -5.0],  // Starting rank - discourage edge knights
];

/**
 * Bishop piece-square table
 */
const BISHOP_PST = [
    [-2.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -2.0],
    [-1.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, -1.0],
    [-1.0, 0.0, 0.5, 1.0, 1.0, 0.5, 0.0, -1.0],
    [-1.0, 0.5, 0.5, 1.0, 1.0, 0.5, 0.5, -1.0],
    [-1.0, 0.0, 1.0, 1.0, 1.0, 1.0, 0.0, -1.0],
    [-1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, -1.0],
    [-1.0, 0.5, 0.0, 0.0, 0.0, 0.0, 0.5, -1.0],
    [-2.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -2.0],
];

/**
 * Rook piece-square table
 */
const ROOK_PST = [
    [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
    [0.5, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 0.5],
    [-0.5, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, -0.5],
    [-0.5, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, -0.5],
    [-0.5, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, -0.5],
    [-0.5, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, -0.5],
    [-0.5, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, -0.5],
    [0.0, 0.0, 0.0, 0.5, 0.5, 0.0, 0.0, 0.0],
];

/**
 * Queen piece-square table
 */
const QUEEN_PST = [
    [-2.0, -1.0, -1.0, -0.5, -0.5, -1.0, -1.0, -2.0],
    [-1.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, -1.0],
    [-1.0, 0.0, 0.5, 0.5, 0.5, 0.5, 0.0, -1.0],
    [-0.5, 0.0, 0.5, 0.5, 0.5, 0.5, 0.0, -0.5],
    [0.0, 0.0, 0.5, 0.5, 0.5, 0.5, 0.0, -0.5],
    [-1.0, 0.5, 0.5, 0.5, 0.5, 0.5, 0.0, -1.0],
    [-1.0, 0.0, 0.5, 0.0, 0.0, 0.0, 0.0, -1.0],
    [-2.0, -1.0, -1.0, -0.5, -0.5, -1.0, -1.0, -2.0],
];

/**
 * King piece-square table (middlegame)
 */
const KING_PST = [
    [-3.0, -4.0, -4.0, -5.0, -5.0, -4.0, -4.0, -3.0],
    [-3.0, -4.0, -4.0, -5.0, -5.0, -4.0, -4.0, -3.0],
    [-3.0, -4.0, -4.0, -5.0, -5.0, -4.0, -4.0, -3.0],
    [-3.0, -4.0, -4.0, -5.0, -5.0, -4.0, -4.0, -3.0],
    [-2.0, -3.0, -3.0, -4.0, -4.0, -3.0, -3.0, -2.0],
    [-1.0, -2.0, -2.0, -2.0, -2.0, -2.0, -2.0, -1.0],
    [2.0, 2.0, 0.0, 0.0, 0.0, 0.0, 2.0, 2.0],
    [2.0, 3.0, 1.0, 0.0, 0.0, 1.0, 3.0, 2.0],
];

/**
 * Piece-square table map
 * White pieces use tables as-is, black pieces use vertically flipped tables
 */
const PST_MAP: Record<number, number[][]> = {
    [Piece.WHITE_PAWN]: reverseTable(PAWN_PST),
    [Piece.BLACK_PAWN]: PAWN_PST,
    [Piece.WHITE_KNIGHT]: reverseTable(KNIGHT_PST),
    [Piece.BLACK_KNIGHT]: KNIGHT_PST,
    [Piece.WHITE_BISHOP]: reverseTable(BISHOP_PST),
    [Piece.BLACK_BISHOP]: BISHOP_PST,
    [Piece.WHITE_ROOK]: reverseTable(ROOK_PST),
    [Piece.BLACK_ROOK]: ROOK_PST,
    [Piece.WHITE_QUEEN]: reverseTable(QUEEN_PST),
    [Piece.BLACK_QUEEN]: QUEEN_PST,
    [Piece.WHITE_KING]: reverseTable(KING_PST),
    [Piece.BLACK_KING]: KING_PST,
};

/**
 * Reverse table vertically (for white pieces)
 */
function reverseTable(table: number[][]): number[][] {
    return table.slice().reverse();
}

// ==================== Evaluator Class ====================

export class Evaluator {
    /**
     * Evaluate a position from the perspective of the specified color
     *
     * @param board - Board to evaluate
     * @param playerColor - Color to evaluate for (positive = good for this color)
     * @param depth - Current search depth (used for mate scoring)
     * @returns Score in centipawns (positive = good for playerColor)
     */
    static evaluate(board: InternalBoard, playerColor: InternalColor, depth: number = 0): Score {
        // Check for checkmate
        if (board.isCheckmate) {
            if (board.turn === playerColor) {
                // We're in checkmate - very bad
                return SCORE_MIN + depth; // Prefer longer mates (from opponent's perspective)
            } else {
                // Opponent is in checkmate - very good
                return SCORE_MAX - depth; // Prefer shorter mates
            }
        }

        // Check for stalemate (draw)
        if (board.isStalemate) {
            return 0; // Draw is neutral
        }

        // Detect endgame phase
        const totalMaterial = this.getTotalMaterialValue(board);
        const isEndgame = totalMaterial < 32; // Less than ~2 rooks + 2 minor pieces worth

        // Material + piece-square tables + passed pawns + endgame adjustments + rook activity + castling
        const materialScore = this.evaluateMaterial(board, playerColor);
        const positionalScore = this.evaluatePieceSquareTables(board, playerColor);
        const passedPawnScore = this.evaluatePassedPawns(board, playerColor);
        const endgameKingScore = isEndgame ? this.evaluateEndgameKing(board, playerColor) : 0;
        const rookActivityScore = this.evaluateRookActivity(board, playerColor);
        const castlingScore = !isEndgame ? this.evaluateCastling(board, playerColor) : 0; // Only in non-endgame

        return materialScore + positionalScore + passedPawnScore + endgameKingScore + rookActivityScore + castlingScore;
    }

    /**
     * Evaluate rook activity
     * Rewards rooks on open/semi-open files and 7th rank
     *
     * @param board - Board to evaluate
     * @param playerColor - Color to evaluate for
     * @returns Rook activity score
     */
    private static evaluateRookActivity(board: InternalBoard, playerColor: InternalColor): Score {
        let score = 0;

        // Check each square for rooks
        for (let square = 0; square < 64; square++) {
            const piece = board.mailbox[square];
            if (piece !== Piece.WHITE_ROOK && piece !== Piece.BLACK_ROOK) continue;

            const pieceColor = piece === Piece.WHITE_ROOK ? InternalColor.WHITE : InternalColor.BLACK;
            const rank = Math.floor(square / 8);
            const file = square % 8;

            // Check if file is open (no pawns) or semi-open (no friendly pawns)
            let hasOwnPawn = false;
            let hasEnemyPawn = false;

            for (let checkRank = 0; checkRank < 8; checkRank++) {
                const checkSquare = checkRank * 8 + file;
                const checkPiece = board.mailbox[checkSquare];

                if (piece === Piece.WHITE_ROOK) {
                    if (checkPiece === Piece.WHITE_PAWN) hasOwnPawn = true;
                    if (checkPiece === Piece.BLACK_PAWN) hasEnemyPawn = true;
                } else {
                    if (checkPiece === Piece.BLACK_PAWN) hasOwnPawn = true;
                    if (checkPiece === Piece.WHITE_PAWN) hasEnemyPawn = true;
                }
            }

            let bonus = 0;

            // Open file (no pawns) - very good
            if (!hasOwnPawn && !hasEnemyPawn) {
                bonus += 20;
            }
            // Semi-open file (no own pawns) - good
            else if (!hasOwnPawn) {
                bonus += 10;
            }

            // 7th rank bonus (attacking enemy pawns on starting rank)
            const is7thRank = (piece === Piece.WHITE_ROOK && rank === 6) ||
                             (piece === Piece.BLACK_ROOK && rank === 1);
            if (is7thRank) {
                bonus += 15; // Rook on 7th rank is powerful
            }

            if (pieceColor === playerColor) {
                score += bonus;
            } else {
                score -= bonus;
            }
        }

        return score;
    }

    /**
     * Evaluate king position in endgame
     * In endgames, king should be centralized and active
     *
     * @param board - Board to evaluate
     * @param playerColor - Color to evaluate for
     * @returns Endgame king activity score
     */
    private static evaluateEndgameKing(board: InternalBoard, playerColor: InternalColor): Score {
        let score = 0;

        // Find kings
        const whiteKingSquare = this.getKingSquare(board, InternalColor.WHITE);
        const blackKingSquare = this.getKingSquare(board, InternalColor.BLACK);

        if (whiteKingSquare !== null) {
            const rank = Math.floor(whiteKingSquare / 8);
            const file = whiteKingSquare % 8;

            // Bonus for king centralization (distance from center)
            const centerDistance = Math.abs(rank - 3.5) + Math.abs(file - 3.5);
            const centralizationBonus = (7 - centerDistance) * 5; // Max 35 points for center

            if (playerColor === InternalColor.WHITE) {
                score += centralizationBonus;
            } else {
                score -= centralizationBonus;
            }
        }

        if (blackKingSquare !== null) {
            const rank = Math.floor(blackKingSquare / 8);
            const file = blackKingSquare % 8;

            const centerDistance = Math.abs(rank - 3.5) + Math.abs(file - 3.5);
            const centralizationBonus = (7 - centerDistance) * 5;

            if (playerColor === InternalColor.BLACK) {
                score += centralizationBonus;
            } else {
                score -= centralizationBonus;
            }
        }

        return score;
    }

    /**
     * Get king square for a color
     */
    private static getKingSquare(board: InternalBoard, color: InternalColor): number | null {
        const kingBitboard = color === InternalColor.WHITE ? board.whiteKing : board.blackKing;
        if (kingBitboard === 0n) return null;

        // Find the king square from bitboard
        for (let square = 0; square < 64; square++) {
            if ((kingBitboard & (1n << BigInt(square))) !== 0n) {
                return square;
            }
        }

        return null;
    }

    /**
     * Evaluate passed pawns
     * A passed pawn has no enemy pawns in front of it or on adjacent files
     *
     * @param board - Board to evaluate
     * @param playerColor - Color to evaluate for
     * @returns Passed pawn bonus score
     */
    private static evaluatePassedPawns(board: InternalBoard, playerColor: InternalColor): Score {
        let score = 0;

        // Check each square for pawns
        for (let square = 0; square < 64; square++) {
            const piece = board.mailbox[square];
            if (piece === Piece.EMPTY) continue;

            const pieceColor = piece <= Piece.WHITE_KING ? InternalColor.WHITE : InternalColor.BLACK;
            const isWhitePawn = piece === Piece.WHITE_PAWN;
            const isBlackPawn = piece === Piece.BLACK_PAWN;

            if (!isWhitePawn && !isBlackPawn) continue;

            const rank = Math.floor(square / 8);
            const file = square % 8;

            // Check if this pawn is passed
            let isPassed = true;

            if (isWhitePawn) {
                // Check if any black pawns block this pawn's path
                // Check current file and adjacent files (file-1, file, file+1)
                for (let checkFile = Math.max(0, file - 1); checkFile <= Math.min(7, file + 1); checkFile++) {
                    for (let checkRank = rank + 1; checkRank <= 7; checkRank++) {
                        const checkSquare = checkRank * 8 + checkFile;
                        if (board.mailbox[checkSquare] === Piece.BLACK_PAWN) {
                            isPassed = false;
                            break;
                        }
                    }
                    if (!isPassed) break;
                }
            } else {
                // Black pawn - check ranks below
                for (let checkFile = Math.max(0, file - 1); checkFile <= Math.min(7, file + 1); checkFile++) {
                    for (let checkRank = rank - 1; checkRank >= 0; checkRank--) {
                        const checkSquare = checkRank * 8 + checkFile;
                        if (board.mailbox[checkSquare] === Piece.WHITE_PAWN) {
                            isPassed = false;
                            break;
                        }
                    }
                    if (!isPassed) break;
                }
            }

            if (isPassed) {
                // Passed pawn bonus increases with advancement
                // White: rank 1 (idx 0) to rank 8 (idx 7)
                // Black: rank 8 (idx 7) to rank 1 (idx 0)
                const advancement = isWhitePawn ? rank : (7 - rank);

                // Bonus: 10 points per rank advanced, squared for acceleration
                // Rank 2: 10, Rank 3: 20, Rank 4: 30, Rank 5: 40, Rank 6: 50, Rank 7: 60
                const bonus = advancement * 10 + advancement * advancement * 2;

                if (pieceColor === playerColor) {
                    score += bonus;
                } else {
                    score -= bonus;
                }
            }
        }

        return score;
    }

    /**
     * Evaluate material balance
     *
     * @param board - Board to evaluate
     * @param playerColor - Color to evaluate for
     * @returns Material score
     */
    private static evaluateMaterial(board: InternalBoard, playerColor: InternalColor): Score {
        let score = 0;

        for (let square = 0; square < 64; square++) {
            const piece = board.mailbox[square];
            if (piece === Piece.EMPTY) continue;

            const pieceValue = PIECE_VALUES[piece] * PIECE_VALUE_MULTIPLIER;
            const pieceColor = piece <= Piece.WHITE_KING ? InternalColor.WHITE : InternalColor.BLACK;

            if (pieceColor === playerColor) {
                score += pieceValue;
            } else {
                score -= pieceValue;
            }
        }

        return score;
    }

    /**
     * Evaluate piece-square table bonuses
     *
     * @param board - Board to evaluate
     * @param playerColor - Color to evaluate for
     * @returns Positional score
     */
    private static evaluatePieceSquareTables(board: InternalBoard, playerColor: InternalColor): Score {
        let score = 0;

        for (let square = 0; square < 64; square++) {
            const piece = board.mailbox[square];
            if (piece === Piece.EMPTY) continue;

            const table = PST_MAP[piece];
            if (!table) continue;

            const rank = Math.floor(square / 8);
            const file = square % 8;
            const tableValue = table[rank][file] * PST_MULTIPLIER;

            const pieceColor = piece <= Piece.WHITE_KING ? InternalColor.WHITE : InternalColor.BLACK;

            if (pieceColor === playerColor) {
                score += tableValue;
            } else {
                score -= tableValue;
            }
        }

        return score;
    }

    /**
     * Evaluate castling status
     * Rewards having castled, which is a key strategic concept
     *
     * @param board - Board to evaluate
     * @param playerColor - Color to evaluate for
     * @returns Castling bonus score
     */
    private static evaluateCastling(board: InternalBoard, playerColor: InternalColor): Score {
        let score = 0;

        if (playerColor === InternalColor.WHITE) {
            // Check if white has castled (king on g1 or c1, and has lost castling rights)
            // If king is on g1 and kingside castling rights are gone, king has castled kingside
            const kingsideCastled = board.mailbox[6] === Piece.WHITE_KING && !board.castlingRights.whiteShort;
            // If king is on c1 and queenside castling rights are gone, king has castled queenside
            const queensideCastled = board.mailbox[2] === Piece.WHITE_KING && !board.castlingRights.whiteLong;

            if (kingsideCastled || queensideCastled) {
                score += 15; // Significant bonus for having castled
            }
        } else {
            // Black - king starts on e8 (square 60)
            // Kingside castle: king on g8 (square 62)
            // Queenside castle: king on c8 (square 58)
            const kingsideCastled = board.mailbox[62] === Piece.BLACK_KING && !board.castlingRights.blackShort;
            const queensideCastled = board.mailbox[58] === Piece.BLACK_KING && !board.castlingRights.blackLong;

            if (kingsideCastled || queensideCastled) {
                score += 15;
            }
        }

        return score;
    }

    /**
     * Get total material value on the board (used for endgame detection)
     *
     * @param board - Board to evaluate
     * @returns Total material value
     */
    static getTotalMaterialValue(board: InternalBoard): number {
        let total = 0;

        for (let square = 0; square < 64; square++) {
            const piece = board.mailbox[square];
            if (piece === Piece.EMPTY) continue;

            total += PIECE_VALUES[piece];
        }

        return total;
    }
}
