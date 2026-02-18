/**
 * Constants for js-chess-engine v2
 */

import { Column, Row } from '../types';

// ==================== Board Constants ====================

export const BOARD_SIZE = 8;
export const TOTAL_SQUARES = 64;

export const COLUMNS: readonly Column[] = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
export const ROWS: readonly Row[] = ['1', '2', '3', '4', '5', '6', '7', '8'];

// ==================== Castling Constants ====================

export const CASTLING = {
    WHITE_SHORT: {
        kingFrom: 4,  // E1
        kingTo: 6,    // G1
        rookFrom: 7,  // H1
        rookTo: 5,    // F1
    },
    WHITE_LONG: {
        kingFrom: 4,  // E1
        kingTo: 2,    // C1
        rookFrom: 0,  // A1
        rookTo: 3,    // D1
    },
    BLACK_SHORT: {
        kingFrom: 60, // E8
        kingTo: 62,   // G8
        rookFrom: 63, // H8
        rookTo: 61,   // F8
    },
    BLACK_LONG: {
        kingFrom: 60, // E8
        kingTo: 58,   // C8
        rookFrom: 56, // A8
        rookTo: 59,   // D8
    },
};
