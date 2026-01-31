/**
 * Advanced bitboard operations and position utilities
 *
 * This module provides fast bitboard manipulation for move generation
 * and attack detection.
 */

import { Bitboard, SquareIndex, FileIndex, RankIndex } from '../types';
import { getFileIndex, getRankIndex, getLowestSetBit, getHighestSetBit } from '../utils/conversion';

// ==================== Bitboard Masks ====================

/**
 * File masks (A-H files)
 */
export const FILE_MASKS: readonly Bitboard[] = [
    0x0101010101010101n, // A-file
    0x0202020202020202n, // B-file
    0x0404040404040404n, // C-file
    0x0808080808080808n, // D-file
    0x1010101010101010n, // E-file
    0x2020202020202020n, // F-file
    0x4040404040404040n, // G-file
    0x8080808080808080n, // H-file
];

/**
 * Rank masks (1-8 ranks)
 */
export const RANK_MASKS: readonly Bitboard[] = [
    0x00000000000000FFn, // Rank 1
    0x000000000000FF00n, // Rank 2
    0x0000000000FF0000n, // Rank 3
    0x00000000FF000000n, // Rank 4
    0x000000FF00000000n, // Rank 5
    0x0000FF0000000000n, // Rank 6
    0x00FF000000000000n, // Rank 7
    0xFF00000000000000n, // Rank 8
];

/**
 * Diagonal masks (A1-H8 diagonals)
 */
export const DIAGONAL_MASKS: readonly Bitboard[] = [
    0x0000000000000001n,
    0x0000000000000102n,
    0x0000000000010204n,
    0x0000000001020408n,
    0x0000000102040810n,
    0x0000010204081020n,
    0x0001020408102040n,
    0x0102040810204080n,
    0x0204081020408000n,
    0x0408102040800000n,
    0x0810204080000000n,
    0x1020408000000000n,
    0x2040800000000000n,
    0x4080000000000000n,
    0x8000000000000000n,
];

/**
 * Anti-diagonal masks (H1-A8 diagonals)
 */
export const ANTI_DIAGONAL_MASKS: readonly Bitboard[] = [
    0x0000000000000080n,
    0x0000000000008040n,
    0x0000000000804020n,
    0x0000000080402010n,
    0x0000008040201008n,
    0x0000804020100804n,
    0x0080402010080402n,
    0x8040201008040201n,
    0x4020100804020100n,
    0x2010080402010000n,
    0x1008040201000000n,
    0x0804020100000000n,
    0x0402010000000000n,
    0x0201000000000000n,
    0x0100000000000000n,
];

/**
 * Edge masks
 */
export const EDGE_MASK = 0xFF818181818181FFn;
export const NOT_A_FILE = 0xFEFEFEFEFEFEFEFEn;
export const NOT_H_FILE = 0x7F7F7F7F7F7F7F7Fn;
export const NOT_AB_FILE = 0xFCFCFCFCFCFCFCFCn;
export const NOT_GH_FILE = 0x3F3F3F3F3F3F3F3Fn;
export const NOT_RANK_1 = 0xFFFFFFFFFFFFFF00n;
export const NOT_RANK_8 = 0x00FFFFFFFFFFFFFFn;

// ==================== Bitboard Shifting ====================

/**
 * Shift bitboard north (towards rank 8)
 */
export function shiftNorth(bb: Bitboard): Bitboard {
    return (bb & NOT_RANK_8) << 8n;
}

/**
 * Shift bitboard south (towards rank 1)
 */
export function shiftSouth(bb: Bitboard): Bitboard {
    return (bb & NOT_RANK_1) >> 8n;
}

/**
 * Shift bitboard east (towards H-file)
 */
export function shiftEast(bb: Bitboard): Bitboard {
    return (bb & NOT_H_FILE) << 1n;
}

/**
 * Shift bitboard west (towards A-file)
 */
export function shiftWest(bb: Bitboard): Bitboard {
    return (bb & NOT_A_FILE) >> 1n;
}

/**
 * Shift bitboard north-east
 */
export function shiftNorthEast(bb: Bitboard): Bitboard {
    return (bb & NOT_H_FILE & NOT_RANK_8) << 9n;
}

/**
 * Shift bitboard north-west
 */
export function shiftNorthWest(bb: Bitboard): Bitboard {
    return (bb & NOT_A_FILE & NOT_RANK_8) << 7n;
}

/**
 * Shift bitboard south-east
 */
export function shiftSouthEast(bb: Bitboard): Bitboard {
    return (bb & NOT_H_FILE & NOT_RANK_1) >> 7n;
}

/**
 * Shift bitboard south-west
 */
export function shiftSouthWest(bb: Bitboard): Bitboard {
    return (bb & NOT_A_FILE & NOT_RANK_1) >> 9n;
}

// ==================== Square Bitboard Helpers ====================

/**
 * Get file mask for a square
 */
export function getFileMask(index: SquareIndex): Bitboard {
    const file = getFileIndex(index);
    return FILE_MASKS[file];
}

/**
 * Get rank mask for a square
 */
export function getRankMask(index: SquareIndex): Bitboard {
    const rank = getRankIndex(index);
    return RANK_MASKS[rank];
}

/**
 * Get diagonal mask for a square (A1-H8 direction)
 */
export function getDiagonalMask(index: SquareIndex): Bitboard {
    const file = getFileIndex(index);
    const rank = getRankIndex(index);
    const diagonalIndex = 7 + rank - file;
    return DIAGONAL_MASKS[diagonalIndex];
}

/**
 * Get anti-diagonal mask for a square (H1-A8 direction)
 */
export function getAntiDiagonalMask(index: SquareIndex): Bitboard {
    const file = getFileIndex(index);
    const rank = getRankIndex(index);
    const antiDiagonalIndex = rank + file;
    return ANTI_DIAGONAL_MASKS[antiDiagonalIndex];
}

// ==================== Precomputed Ray Tables ====================

// Direction indices: 0=North, 1=South, 2=East, 3=West, 4=NE, 5=NW, 6=SE, 7=SW
// "Positive" rays (toward higher bits): North(0), East(2), NE(4), NW(5)
// "Negative" rays (toward lower bits): South(1), West(3), SE(6), SW(7)
const RAY_TABLE: Bitboard[][] = Array.from({ length: 8 }, () => new Array<Bitboard>(64));

function initRayTables(): void {
    const directions = [8, -8, 1, -1, 9, 7, -7, -9];
    for (let dirIdx = 0; dirIdx < 8; dirIdx++) {
        const dir = directions[dirIdx];
        for (let sq = 0; sq < 64; sq++) {
            let attacks = 0n;
            let current = sq;
            while (true) {
                const next = current + dir;
                if (next < 0 || next > 63) break;
                const cf = current % 8;
                const nf = next % 8;
                const fd = Math.abs(nf - cf);
                // Validate wrap: horizontal needs fd=1, vertical fd=0, diagonal fd=1
                if (dir === 1 || dir === -1) { if (fd !== 1) break; }
                else if (dir === 8 || dir === -8) { if (fd !== 0) break; }
                else { if (fd !== 1) break; }
                attacks |= 1n << BigInt(next);
                current = next;
            }
            RAY_TABLE[dirIdx][sq] = attacks;
        }
    }
}
initRayTables();

// Positive direction rays: first blocker = lowest set bit
// Negative direction rays: first blocker = highest set bit
function positiveRay(dirIdx: number, square: SquareIndex, occupied: Bitboard): Bitboard {
    const ray = RAY_TABLE[dirIdx][square];
    const blockers = ray & occupied;
    if (blockers === 0n) return ray;
    const first = getLowestSetBit(blockers);
    return ray ^ RAY_TABLE[dirIdx][first];
}

function negativeRay(dirIdx: number, square: SquareIndex, occupied: Bitboard): Bitboard {
    const ray = RAY_TABLE[dirIdx][square];
    const blockers = ray & occupied;
    if (blockers === 0n) return ray;
    const first = getHighestSetBit(blockers);
    return ray ^ RAY_TABLE[dirIdx][first];
}

export function getRookAttacks(square: SquareIndex, occupied: Bitboard): Bitboard {
    return (
        positiveRay(0, square, occupied) | // North
        negativeRay(1, square, occupied) | // South
        positiveRay(2, square, occupied) | // East
        negativeRay(3, square, occupied)   // West
    );
}

export function getBishopAttacks(square: SquareIndex, occupied: Bitboard): Bitboard {
    return (
        positiveRay(4, square, occupied) | // NE
        positiveRay(5, square, occupied) | // NW
        negativeRay(6, square, occupied) | // SE
        negativeRay(7, square, occupied)   // SW
    );
}

export function getQueenAttacks(square: SquareIndex, occupied: Bitboard): Bitboard {
    return getRookAttacks(square, occupied) | getBishopAttacks(square, occupied);
}

// ==================== King and Knight Attacks ====================

/**
 * Pre-computed king attack bitboards for each square
 */
export const KING_ATTACKS: Bitboard[] = new Array(64);

/**
 * Pre-computed knight attack bitboards for each square
 */
export const KNIGHT_ATTACKS: Bitboard[] = new Array(64);

/**
 * Initialize pre-computed attack tables
 */
export function initializeAttackTables(): void {
    // Initialize king attacks
    for (let sq = 0; sq < 64; sq++) {
        let attacks = 0n;
        const sqBit = 1n << BigInt(sq);

        // King can move one square in all 8 directions
        attacks |= shiftNorth(sqBit);
        attacks |= shiftSouth(sqBit);
        attacks |= shiftEast(sqBit);
        attacks |= shiftWest(sqBit);
        attacks |= shiftNorthEast(sqBit);
        attacks |= shiftNorthWest(sqBit);
        attacks |= shiftSouthEast(sqBit);
        attacks |= shiftSouthWest(sqBit);

        KING_ATTACKS[sq] = attacks;
    }

    // Initialize knight attacks
    for (let sq = 0; sq < 64; sq++) {
        let attacks = 0n;
        const sqBit = 1n << BigInt(sq);

        // Knight moves in L-shape: 2 squares in one direction, 1 in perpendicular
        const nnw = shiftNorth(shiftNorth(shiftWest(sqBit)));
        const nne = shiftNorth(shiftNorth(shiftEast(sqBit)));
        const nee = shiftEast(shiftEast(shiftNorth(sqBit)));
        const see = shiftEast(shiftEast(shiftSouth(sqBit)));
        const sse = shiftSouth(shiftSouth(shiftEast(sqBit)));
        const ssw = shiftSouth(shiftSouth(shiftWest(sqBit)));
        const sww = shiftWest(shiftWest(shiftSouth(sqBit)));
        const nww = shiftWest(shiftWest(shiftNorth(sqBit)));

        attacks = nnw | nne | nee | see | sse | ssw | sww | nww;
        KNIGHT_ATTACKS[sq] = attacks;
    }
}

// Initialize on module load
initializeAttackTables();

/**
 * Get king attacks for a square
 */
export function getKingAttacks(square: SquareIndex): Bitboard {
    const attacks = KING_ATTACKS[square];
    return attacks !== undefined ? attacks : 0n;
}

/**
 * Get knight attacks for a square
 */
export function getKnightAttacks(square: SquareIndex): Bitboard {
    const attacks = KNIGHT_ATTACKS[square];
    return attacks !== undefined ? attacks : 0n;
}

// ==================== Pawn Attacks ====================

/**
 * Get white pawn attacks for a square
 */
export function getWhitePawnAttacks(square: SquareIndex): Bitboard {
    const sqBit = 1n << BigInt(square);
    return shiftNorthEast(sqBit) | shiftNorthWest(sqBit);
}

/**
 * Get black pawn attacks for a square
 */
export function getBlackPawnAttacks(square: SquareIndex): Bitboard {
    const sqBit = 1n << BigInt(square);
    return shiftSouthEast(sqBit) | shiftSouthWest(sqBit);
}

/**
 * Get all white pawn attacks from a bitboard of white pawns
 */
export function getWhitePawnsAttacks(pawns: Bitboard): Bitboard {
    return shiftNorthEast(pawns) | shiftNorthWest(pawns);
}

/**
 * Get all black pawn attacks from a bitboard of black pawns
 */
export function getBlackPawnsAttacks(pawns: Bitboard): Bitboard {
    return shiftSouthEast(pawns) | shiftSouthWest(pawns);
}
