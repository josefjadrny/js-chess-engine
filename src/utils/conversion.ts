/**
 * Conversion utilities between square notation and internal indices
 */

import { Square, SquareIndex, FileIndex, RankIndex, Column, Row } from '../types';
import { COLUMNS, ROWS } from './constants';

// ==================== Square ↔ Index Conversion ====================

/**
 * Convert square notation (e.g., "A1", "E4") to square index (0-63)
 *
 * Board layout:
 * 56 57 58 59 60 61 62 63  (Rank 8) - A8 to H8
 * 48 49 50 51 52 53 54 55  (Rank 7)
 * ...
 *  8  9 10 11 12 13 14 15  (Rank 2)
 *  0  1  2  3  4  5  6  7  (Rank 1) - A1 to H1
 *
 * @param square - Square notation (case-insensitive)
 * @returns Square index (0-63)
 * @throws Error if square notation is invalid
 */
export function squareToIndex(square: Square): SquareIndex {
    const normalized = square.toUpperCase();

    if (normalized.length !== 2) {
        throw new Error(`Invalid square notation: ${square}`);
    }

    const file = normalized[0] as Column;
    const rank = normalized[1] as Row;

    const fileIndex = COLUMNS.indexOf(file);
    const rankIndex = ROWS.indexOf(rank);

    if (fileIndex === -1 || rankIndex === -1) {
        throw new Error(`Invalid square notation: ${square}`);
    }

    return (rankIndex * 8 + fileIndex) as SquareIndex;
}

/**
 * Convert square index (0-63) to square notation (e.g., "A1", "E4")
 *
 * @param index - Square index (0-63)
 * @returns Square notation in uppercase
 * @throws Error if index is out of range
 */
export function indexToSquare(index: SquareIndex): Square {
    if (index < 0 || index > 63) {
        throw new Error(`Invalid square index: ${index}`);
    }

    const fileIndex = index % 8;
    const rankIndex = Math.floor(index / 8);

    return `${COLUMNS[fileIndex]}${ROWS[rankIndex]}`;
}

// ==================== File/Rank Conversion ====================

/**
 * Get file index (0-7) from square index
 *
 * @param index - Square index (0-63)
 * @returns File index (0=A, 1=B, ..., 7=H)
 */
export function getFileIndex(index: SquareIndex): FileIndex {
    return (index % 8) as FileIndex;
}

/**
 * Get rank index (0-7) from square index
 *
 * @param index - Square index (0-63)
 * @returns Rank index (0=1, 1=2, ..., 7=8)
 */
export function getRankIndex(index: SquareIndex): RankIndex {
    return Math.floor(index / 8) as RankIndex;
}

/**
 * Get file from square notation
 *
 * @param square - Square notation (case-insensitive)
 * @returns File index (0-7)
 */
export function getFile(square: Square): FileIndex {
    const normalized = square.toUpperCase();
    const fileIndex = COLUMNS.indexOf(normalized[0] as Column);
    if (fileIndex === -1) {
        throw new Error(`Invalid square notation: ${square}`);
    }
    return fileIndex as FileIndex;
}

/**
 * Get rank from square notation
 *
 * @param square - Square notation (case-insensitive)
 * @returns Rank index (0-7)
 */
export function getRank(square: Square): RankIndex {
    const normalized = square.toUpperCase();
    const rankIndex = ROWS.indexOf(normalized[1] as Row);
    if (rankIndex === -1) {
        throw new Error(`Invalid square notation: ${square}`);
    }
    return rankIndex as RankIndex;
}

/**
 * Create square index from file and rank indices
 *
 * @param file - File index (0-7)
 * @param rank - Rank index (0-7)
 * @returns Square index (0-63)
 */
export function fileRankToIndex(file: FileIndex, rank: RankIndex): SquareIndex {
    return (rank * 8 + file) as SquareIndex;
}

// ==================== Validation ====================

/**
 * Check if square notation is valid
 *
 * @param square - Square notation
 * @returns true if valid
 */
export function isValidSquare(square: string): boolean {
    if (typeof square !== 'string' || square.length !== 2) {
        return false;
    }

    const normalized = square.toUpperCase();
    const file = normalized[0];
    const rank = normalized[1];

    return COLUMNS.includes(file as Column) && ROWS.includes(rank as Row);
}

/**
 * Check if square index is valid
 *
 * @param index - Square index
 * @returns true if valid (0-63)
 */
export function isValidIndex(index: number): boolean {
    return Number.isInteger(index) && index >= 0 && index <= 63;
}

// ==================== Bitboard Helpers ====================

/**
 * Convert square index to bitboard (single bit set)
 *
 * @param index - Square index (0-63)
 * @returns Bitboard with single bit set
 */
export function indexToBitboard(index: SquareIndex): bigint {
    return 1n << BigInt(index);
}

/**
 * Convert square notation to bitboard
 *
 * @param square - Square notation
 * @returns Bitboard with single bit set
 */
export function squareToBitboard(square: Square): bigint {
    return indexToBitboard(squareToIndex(square));
}

/**
 * Get all set bits (square indices) from a bitboard
 *
 * @param bitboard - Bitboard to extract indices from
 * @returns Array of square indices where bits are set
 */
export function bitboardToIndices(bitboard: bigint): SquareIndex[] {
    const indices: SquareIndex[] = [];
    let bb = bitboard;

    while (bb !== 0n) {
        const index = getLowestSetBit(bb);
        indices.push(index);
        bb &= bb - 1n; // Clear lowest set bit
    }

    return indices;
}

// De Bruijn constant and lookup table for O(1) bit scanning
const DE_BRUIJN_64 = 0x03F79D71B4CB0A89n;
const MASK_64 = 0xFFFFFFFFFFFFFFFFn;
const DE_BRUIJN_TABLE = new Int8Array(64);
for (let i = 0; i < 64; i++) {
    DE_BRUIJN_TABLE[Number((((1n << BigInt(i)) * DE_BRUIJN_64) & MASK_64) >> 58n)] = i;
}

/**
 * Get the index of the lowest set bit in a bitboard (O(1) via De Bruijn)
 */
export function getLowestSetBit(bitboard: bigint): SquareIndex {
    if (bitboard === 0n) return -1 as SquareIndex;
    const isolated = bitboard & (-bitboard);
    return DE_BRUIJN_TABLE[Number(((isolated * DE_BRUIJN_64) & MASK_64) >> 58n)] as SquareIndex;
}

/**
 * Get the index of the highest set bit in a bitboard
 */
export function getHighestSetBit(bitboard: bigint): SquareIndex {
    if (bitboard === 0n) return -1 as SquareIndex;
    let bb = bitboard;
    bb |= bb >> 1n;
    bb |= bb >> 2n;
    bb |= bb >> 4n;
    bb |= bb >> 8n;
    bb |= bb >> 16n;
    bb |= bb >> 32n;
    const msb = bb - (bb >> 1n);
    return DE_BRUIJN_TABLE[Number(((msb * DE_BRUIJN_64) & MASK_64) >> 58n)] as SquareIndex;
}

/**
 * Count the number of set bits in a bitboard (population count)
 *
 * @param bitboard - Bitboard
 * @returns Number of set bits
 */
export function popCount(bitboard: bigint): number {
    let count = 0;
    let bb = bitboard;

    while (bb !== 0n) {
        bb &= bb - 1n; // Clear lowest set bit
        count++;
    }

    return count;
}

// ==================== Distance Calculations ====================

/**
 * Calculate Manhattan distance between two squares
 *
 * @param from - Source square index
 * @param to - Target square index
 * @returns Manhattan distance
 */
export function manhattanDistance(from: SquareIndex, to: SquareIndex): number {
    const fromFile = getFileIndex(from);
    const fromRank = getRankIndex(from);
    const toFile = getFileIndex(to);
    const toRank = getRankIndex(to);

    return Math.abs(fromFile - toFile) + Math.abs(fromRank - toRank);
}

/**
 * Calculate Chebyshev distance between two squares (king moves)
 *
 * @param from - Source square index
 * @param to - Target square index
 * @returns Chebyshev distance
 */
export function chebyshevDistance(from: SquareIndex, to: SquareIndex): number {
    const fromFile = getFileIndex(from);
    const fromRank = getRankIndex(from);
    const toFile = getFileIndex(to);
    const toRank = getRankIndex(to);

    return Math.max(Math.abs(fromFile - toFile), Math.abs(fromRank - toRank));
}

// ==================== Board Boundaries ====================

/**
 * Check if a square is on the edge of the board
 *
 * @param index - Square index
 * @returns true if on edge
 */
export function isOnEdge(index: SquareIndex): boolean {
    const file = getFileIndex(index);
    const rank = getRankIndex(index);
    return file === 0 || file === 7 || rank === 0 || rank === 7;
}

/**
 * Check if square is on A-file
 */
export function isAFile(index: SquareIndex): boolean {
    return getFileIndex(index) === 0;
}

/**
 * Check if square is on H-file
 */
export function isHFile(index: SquareIndex): boolean {
    return getFileIndex(index) === 7;
}

/**
 * Check if square is on rank 1
 */
export function isRank1(index: SquareIndex): boolean {
    return getRankIndex(index) === 0;
}

/**
 * Check if square is on rank 8
 */
export function isRank8(index: SquareIndex): boolean {
    return getRankIndex(index) === 7;
}
