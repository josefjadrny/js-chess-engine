/**
 * Unit tests for conversion utilities
 */

import {
    squareToIndex,
    indexToSquare,
    getFileIndex,
    getRankIndex,
    getFile,
    getRank,
    fileRankToIndex,
    isValidSquare,
    isValidIndex,
    indexToBitboard,
    squareToBitboard,
    bitboardToIndices,
    getLowestSetBit,
    popCount,
    manhattanDistance,
    chebyshevDistance,
    isOnEdge,
    isAFile,
    isHFile,
    isRank1,
    isRank8,
} from '../../src/utils/conversion';

describe('Square ↔ Index Conversion', () => {
    describe('squareToIndex', () => {
        it('should convert A1 to 0', () => {
            expect(squareToIndex('A1')).toBe(0);
        });

        it('should convert H1 to 7', () => {
            expect(squareToIndex('H1')).toBe(7);
        });

        it('should convert A8 to 56', () => {
            expect(squareToIndex('A8')).toBe(56);
        });

        it('should convert H8 to 63', () => {
            expect(squareToIndex('H8')).toBe(63);
        });

        it('should convert E4 to 28', () => {
            expect(squareToIndex('E4')).toBe(28);
        });

        it('should handle lowercase input', () => {
            expect(squareToIndex('e4')).toBe(28);
            expect(squareToIndex('a1')).toBe(0);
            expect(squareToIndex('h8')).toBe(63);
        });

        it('should throw on invalid square', () => {
            expect(() => squareToIndex('I1')).toThrow();
            expect(() => squareToIndex('A9')).toThrow();
            expect(() => squareToIndex('Z5')).toThrow();
            expect(() => squareToIndex('A')).toThrow();
            expect(() => squareToIndex('')).toThrow();
        });
    });

    describe('indexToSquare', () => {
        it('should convert 0 to A1', () => {
            expect(indexToSquare(0)).toBe('A1');
        });

        it('should convert 7 to H1', () => {
            expect(indexToSquare(7)).toBe('H1');
        });

        it('should convert 56 to A8', () => {
            expect(indexToSquare(56)).toBe('A8');
        });

        it('should convert 63 to H8', () => {
            expect(indexToSquare(63)).toBe('H8');
        });

        it('should convert 28 to E4', () => {
            expect(indexToSquare(28)).toBe('E4');
        });

        it('should throw on invalid index', () => {
            expect(() => indexToSquare(-1)).toThrow();
            expect(() => indexToSquare(64)).toThrow();
            expect(() => indexToSquare(100)).toThrow();
        });
    });

    describe('Round-trip conversion', () => {
        it('should convert square -> index -> square', () => {
            const squares = ['A1', 'E4', 'H8', 'D5', 'B2', 'G7'];
            for (const square of squares) {
                const index = squareToIndex(square);
                const result = indexToSquare(index);
                expect(result).toBe(square);
            }
        });

        it('should convert index -> square -> index', () => {
            for (let i = 0; i < 64; i++) {
                const square = indexToSquare(i);
                const result = squareToIndex(square);
                expect(result).toBe(i);
            }
        });
    });
});

describe('File and Rank Functions', () => {
    describe('getFileIndex', () => {
        it('should return correct file index', () => {
            expect(getFileIndex(0)).toBe(0);  // A1 -> file A (0)
            expect(getFileIndex(7)).toBe(7);  // H1 -> file H (7)
            expect(getFileIndex(28)).toBe(4); // E4 -> file E (4)
        });
    });

    describe('getRankIndex', () => {
        it('should return correct rank index', () => {
            expect(getRankIndex(0)).toBe(0);  // A1 -> rank 1 (0)
            expect(getRankIndex(56)).toBe(7); // A8 -> rank 8 (7)
            expect(getRankIndex(28)).toBe(3); // E4 -> rank 4 (3)
        });
    });

    describe('getFile', () => {
        it('should return file index from square', () => {
            expect(getFile('A1')).toBe(0);
            expect(getFile('H1')).toBe(7);
            expect(getFile('E4')).toBe(4);
        });

        it('should handle lowercase', () => {
            expect(getFile('e4')).toBe(4);
        });
    });

    describe('getRank', () => {
        it('should return rank index from square', () => {
            expect(getRank('A1')).toBe(0);
            expect(getRank('A8')).toBe(7);
            expect(getRank('E4')).toBe(3);
        });

        it('should handle lowercase', () => {
            expect(getRank('e4')).toBe(3);
        });
    });

    describe('fileRankToIndex', () => {
        it('should create index from file and rank', () => {
            expect(fileRankToIndex(0, 0)).toBe(0);  // A1
            expect(fileRankToIndex(7, 0)).toBe(7);  // H1
            expect(fileRankToIndex(0, 7)).toBe(56); // A8
            expect(fileRankToIndex(7, 7)).toBe(63); // H8
            expect(fileRankToIndex(4, 3)).toBe(28); // E4
        });
    });
});

describe('Validation Functions', () => {
    describe('isValidSquare', () => {
        it('should validate correct squares', () => {
            expect(isValidSquare('A1')).toBe(true);
            expect(isValidSquare('H8')).toBe(true);
            expect(isValidSquare('E4')).toBe(true);
            expect(isValidSquare('a1')).toBe(true);
            expect(isValidSquare('h8')).toBe(true);
        });

        it('should reject invalid squares', () => {
            expect(isValidSquare('I1')).toBe(false);
            expect(isValidSquare('A9')).toBe(false);
            expect(isValidSquare('A')).toBe(false);
            expect(isValidSquare('1')).toBe(false);
            expect(isValidSquare('')).toBe(false);
            expect(isValidSquare('AA1')).toBe(false);
        });
    });

    describe('isValidIndex', () => {
        it('should validate correct indices', () => {
            expect(isValidIndex(0)).toBe(true);
            expect(isValidIndex(63)).toBe(true);
            expect(isValidIndex(28)).toBe(true);
        });

        it('should reject invalid indices', () => {
            expect(isValidIndex(-1)).toBe(false);
            expect(isValidIndex(64)).toBe(false);
            expect(isValidIndex(100)).toBe(false);
            expect(isValidIndex(1.5)).toBe(false);
        });
    });
});

describe('Bitboard Functions', () => {
    describe('indexToBitboard', () => {
        it('should create bitboard with single bit set', () => {
            expect(indexToBitboard(0)).toBe(1n);
            expect(indexToBitboard(1)).toBe(2n);
            expect(indexToBitboard(2)).toBe(4n);
            expect(indexToBitboard(8)).toBe(256n);
        });
    });

    describe('squareToBitboard', () => {
        it('should create bitboard from square', () => {
            expect(squareToBitboard('A1')).toBe(1n);
            expect(squareToBitboard('B1')).toBe(2n);
            expect(squareToBitboard('A2')).toBe(256n);
        });
    });

    describe('bitboardToIndices', () => {
        it('should extract indices from bitboard', () => {
            const bb = 1n | 4n | 256n; // A1, C1, A2
            const indices = bitboardToIndices(bb);
            expect(indices).toEqual([0, 2, 8]);
        });

        it('should return empty array for zero bitboard', () => {
            expect(bitboardToIndices(0n)).toEqual([]);
        });
    });

    describe('getLowestSetBit', () => {
        it('should return index of lowest set bit', () => {
            expect(getLowestSetBit(1n)).toBe(0);
            expect(getLowestSetBit(2n)).toBe(1);
            expect(getLowestSetBit(4n)).toBe(2);
            expect(getLowestSetBit(5n)).toBe(0); // 101 -> lowest is bit 0
            expect(getLowestSetBit(256n)).toBe(8);
        });

        it('should return -1 for zero bitboard', () => {
            expect(getLowestSetBit(0n)).toBe(-1);
        });
    });

    describe('popCount', () => {
        it('should count set bits', () => {
            expect(popCount(0n)).toBe(0);
            expect(popCount(1n)).toBe(1);
            expect(popCount(3n)).toBe(2);  // 11
            expect(popCount(7n)).toBe(3);  // 111
            expect(popCount(15n)).toBe(4); // 1111
        });
    });
});

describe('Distance Functions', () => {
    describe('manhattanDistance', () => {
        it('should calculate Manhattan distance', () => {
            expect(manhattanDistance(0, 0)).toBe(0);   // A1 to A1
            expect(manhattanDistance(0, 7)).toBe(7);   // A1 to H1
            expect(manhattanDistance(0, 56)).toBe(7);  // A1 to A8
            expect(manhattanDistance(0, 63)).toBe(14); // A1 to H8
            expect(manhattanDistance(28, 36)).toBe(1); // E4 to E5 (1 rank = 1)
        });
    });

    describe('chebyshevDistance', () => {
        it('should calculate Chebyshev distance (king moves)', () => {
            expect(chebyshevDistance(0, 0)).toBe(0);  // A1 to A1
            expect(chebyshevDistance(0, 7)).toBe(7);  // A1 to H1
            expect(chebyshevDistance(0, 56)).toBe(7); // A1 to A8
            expect(chebyshevDistance(0, 63)).toBe(7); // A1 to H8 (diagonal = 7)
            expect(chebyshevDistance(28, 36)).toBe(1); // E4 to E5
        });
    });
});

describe('Board Boundary Functions', () => {
    describe('isOnEdge', () => {
        it('should identify edge squares', () => {
            expect(isOnEdge(0)).toBe(true);   // A1
            expect(isOnEdge(7)).toBe(true);   // H1
            expect(isOnEdge(56)).toBe(true);  // A8
            expect(isOnEdge(63)).toBe(true);  // H8
            expect(isOnEdge(28)).toBe(false); // E4 (center)
        });
    });

    describe('isAFile', () => {
        it('should identify A-file', () => {
            expect(isAFile(0)).toBe(true);   // A1
            expect(isAFile(56)).toBe(true);  // A8
            expect(isAFile(7)).toBe(false);  // H1
        });
    });

    describe('isHFile', () => {
        it('should identify H-file', () => {
            expect(isHFile(7)).toBe(true);   // H1
            expect(isHFile(63)).toBe(true);  // H8
            expect(isHFile(0)).toBe(false);  // A1
        });
    });

    describe('isRank1', () => {
        it('should identify rank 1', () => {
            expect(isRank1(0)).toBe(true);  // A1
            expect(isRank1(7)).toBe(true);  // H1
            expect(isRank1(8)).toBe(false); // A2
        });
    });

    describe('isRank8', () => {
        it('should identify rank 8', () => {
            expect(isRank8(56)).toBe(true); // A8
            expect(isRank8(63)).toBe(true); // H8
            expect(isRank8(55)).toBe(false); // H7
        });
    });
});
