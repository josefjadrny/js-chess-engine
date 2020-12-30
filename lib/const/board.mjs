export const COLUMNS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
export const ROWS = ['1', '2', '3', '4', '5', '6', '7', '8']
export const COLORS = {
    BLACK: 'black',
    WHITE: 'white',
}
export const AI_LEVELS = [0, 1, 2, 3]
export const NEW_GAME_SETTINGS = {
    fullMove: 1,
    halfMove: 0,
    enPassant: null,
    isFinished: false,
    checkMate: false,
    check: false,
    turn: COLORS.WHITE,
}
export const NEW_GAME_BOARD_CONFIG = Object.assign({
    pieces: {
        E1: 'K',
        D1: 'Q',
        A1: 'R',
        H1: 'R',
        C1: 'B',
        F1: 'B',
        B1: 'N',
        G1: 'N',
        A2: 'P',
        B2: 'P',
        C2: 'P',
        D2: 'P',
        E2: 'P',
        F2: 'P',
        G2: 'P',
        H2: 'P',
        E8: 'k',
        D8: 'q',
        A8: 'r',
        H8: 'r',
        C8: 'b',
        F8: 'b',
        B8: 'n',
        G8: 'n',
        A7: 'p',
        B7: 'p',
        C7: 'p',
        D7: 'p',
        E7: 'p',
        F7: 'p',
        G7: 'p',
        H7: 'p',
    },
    castling: {
        whiteShort: true,
        blackShort: true,
        whiteLong: true,
        blackLong: true,
    },
}, NEW_GAME_SETTINGS)

const CLOSE_FIELDS_MAP = {
    UP: {
        A1: 'A2',
        A2: 'A3',
        A3: 'A4',
        A4: 'A5',
        A5: 'A6',
        A6: 'A7',
        A7: 'A8',
        A8: null,
        B1: 'B2',
        B2: 'B3',
        B3: 'B4',
        B4: 'B5',
        B5: 'B6',
        B6: 'B7',
        B7: 'B8',
        B8: null,
        C1: 'C2',
        C2: 'C3',
        C3: 'C4',
        C4: 'C5',
        C5: 'C6',
        C6: 'C7',
        C7: 'C8',
        C8: null,
        D1: 'D2',
        D2: 'D3',
        D3: 'D4',
        D4: 'D5',
        D5: 'D6',
        D6: 'D7',
        D7: 'D8',
        D8: null,
        E1: 'E2',
        E2: 'E3',
        E3: 'E4',
        E4: 'E5',
        E5: 'E6',
        E6: 'E7',
        E7: 'E8',
        E8: null,
        F1: 'F2',
        F2: 'F3',
        F3: 'F4',
        F4: 'F5',
        F5: 'F6',
        F6: 'F7',
        F7: 'F8',
        F8: null,
        G1: 'G2',
        G2: 'G3',
        G3: 'G4',
        G4: 'G5',
        G5: 'G6',
        G6: 'G7',
        G7: 'G8',
        G8: null,
        H1: 'H2',
        H2: 'H3',
        H3: 'H4',
        H4: 'H5',
        H5: 'H6',
        H6: 'H7',
        H7: 'H8',
        H8: null,
    },
    DOWN: {
        A1: null,
        A2: 'A1',
        A3: 'A2',
        A4: 'A3',
        A5: 'A4',
        A6: 'A5',
        A7: 'A6',
        A8: 'A7',
        B1: null,
        B2: 'B1',
        B3: 'B2',
        B4: 'B3',
        B5: 'B4',
        B6: 'B5',
        B7: 'B6',
        B8: 'B7',
        C1: null,
        C2: 'C1',
        C3: 'C2',
        C4: 'C3',
        C5: 'C4',
        C6: 'C5',
        C7: 'C6',
        C8: 'C7',
        D1: null,
        D2: 'D1',
        D3: 'D2',
        D4: 'D3',
        D5: 'D4',
        D6: 'D5',
        D7: 'D6',
        D8: 'D7',
        E1: null,
        E2: 'E1',
        E3: 'E2',
        E4: 'E3',
        E5: 'E4',
        E6: 'E5',
        E7: 'E6',
        E8: 'E7',
        F1: null,
        F2: 'F1',
        F3: 'F2',
        F4: 'F3',
        F5: 'F4',
        F6: 'F5',
        F7: 'F6',
        F8: 'F7',
        G1: null,
        G2: 'G1',
        G3: 'G2',
        G4: 'G3',
        G5: 'G4',
        G6: 'G5',
        G7: 'G6',
        G8: 'G7',
        H1: null,
        H2: 'H1',
        H3: 'H2',
        H4: 'H3',
        H5: 'H4',
        H6: 'H5',
        H7: 'H6',
        H8: 'H7',
    },
    LEFT: {
        A1: null,
        A2: null,
        A3: null,
        A4: null,
        A5: null,
        A6: null,
        A7: null,
        A8: null,
        B1: 'A1',
        B2: 'A2',
        B3: 'A3',
        B4: 'A4',
        B5: 'A5',
        B6: 'A6',
        B7: 'A7',
        B8: 'A8',
        C1: 'B1',
        C2: 'B2',
        C3: 'B3',
        C4: 'B4',
        C5: 'B5',
        C6: 'B6',
        C7: 'B7',
        C8: 'B8',
        D1: 'C1',
        D2: 'C2',
        D3: 'C3',
        D4: 'C4',
        D5: 'C5',
        D6: 'C6',
        D7: 'C7',
        D8: 'C8',
        E1: 'D1',
        E2: 'D2',
        E3: 'D3',
        E4: 'D4',
        E5: 'D5',
        E6: 'D6',
        E7: 'D7',
        E8: 'D8',
        F1: 'E1',
        F2: 'E2',
        F3: 'E3',
        F4: 'E4',
        F5: 'E5',
        F6: 'E6',
        F7: 'E7',
        F8: 'E8',
        G1: 'F1',
        G2: 'F2',
        G3: 'F3',
        G4: 'F4',
        G5: 'F5',
        G6: 'F6',
        G7: 'F7',
        G8: 'F8',
        H1: 'G1',
        H2: 'G2',
        H3: 'G3',
        H4: 'G4',
        H5: 'G5',
        H6: 'G6',
        H7: 'G7',
        H8: 'G8',
    },
    RIGHT: {
        A1: 'B1',
        A2: 'B2',
        A3: 'B3',
        A4: 'B4',
        A5: 'B5',
        A6: 'B6',
        A7: 'B7',
        A8: 'B8',
        B1: 'C1',
        B2: 'C2',
        B3: 'C3',
        B4: 'C4',
        B5: 'C5',
        B6: 'C6',
        B7: 'C7',
        B8: 'C8',
        C1: 'D1',
        C2: 'D2',
        C3: 'D3',
        C4: 'D4',
        C5: 'D5',
        C6: 'D6',
        C7: 'D7',
        C8: 'D8',
        D1: 'E1',
        D2: 'E2',
        D3: 'E3',
        D4: 'E4',
        D5: 'E5',
        D6: 'E6',
        D7: 'E7',
        D8: 'E8',
        E1: 'F1',
        E2: 'F2',
        E3: 'F3',
        E4: 'F4',
        E5: 'F5',
        E6: 'F6',
        E7: 'F7',
        E8: 'F8',
        F1: 'G1',
        F2: 'G2',
        F3: 'G3',
        F4: 'G4',
        F5: 'G5',
        F6: 'G6',
        F7: 'G7',
        F8: 'G8',
        G1: 'H1',
        G2: 'H2',
        G3: 'H3',
        G4: 'H4',
        G5: 'H5',
        G6: 'H6',
        G7: 'H7',
        G8: 'H8',
        H1: null,
        H2: null,
        H3: null,
        H4: null,
        H5: null,
        H6: null,
        H7: null,
        H8: null,
    },
    UP_LEFT: {
        A1: null,
        A2: null,
        A3: null,
        A4: null,
        A5: null,
        A6: null,
        A7: null,
        A8: null,
        B1: 'A2',
        B2: 'A3',
        B3: 'A4',
        B4: 'A5',
        B5: 'A6',
        B6: 'A7',
        B7: 'A8',
        B8: null,
        C1: 'B2',
        C2: 'B3',
        C3: 'B4',
        C4: 'B5',
        C5: 'B6',
        C6: 'B7',
        C7: 'B8',
        C8: null,
        D1: 'C2',
        D2: 'C3',
        D3: 'C4',
        D4: 'C5',
        D5: 'C6',
        D6: 'C7',
        D7: 'C8',
        D8: null,
        E1: 'D2',
        E2: 'D3',
        E3: 'D4',
        E4: 'D5',
        E5: 'D6',
        E6: 'D7',
        E7: 'D8',
        E8: null,
        F1: 'E2',
        F2: 'E3',
        F3: 'E4',
        F4: 'E5',
        F5: 'E6',
        F6: 'E7',
        F7: 'E8',
        F8: null,
        G1: 'F2',
        G2: 'F3',
        G3: 'F4',
        G4: 'F5',
        G5: 'F6',
        G6: 'F7',
        G7: 'F8',
        G8: null,
        H1: 'G2',
        H2: 'G3',
        H3: 'G4',
        H4: 'G5',
        H5: 'G6',
        H6: 'G7',
        H7: 'G8',
        H8: null,
    },
    DOWN_RIGHT: {
        A1: null,
        A2: 'B1',
        A3: 'B2',
        A4: 'B3',
        A5: 'B4',
        A6: 'B5',
        A7: 'B6',
        A8: 'B7',
        B1: null,
        B2: 'C1',
        B3: 'C2',
        B4: 'C3',
        B5: 'C4',
        B6: 'C5',
        B7: 'C6',
        B8: 'C7',
        C1: null,
        C2: 'D1',
        C3: 'D2',
        C4: 'D3',
        C5: 'D4',
        C6: 'D5',
        C7: 'D6',
        C8: 'D7',
        D1: null,
        D2: 'E1',
        D3: 'E2',
        D4: 'E3',
        D5: 'E4',
        D6: 'E5',
        D7: 'E6',
        D8: 'E7',
        E1: null,
        E2: 'F1',
        E3: 'F2',
        E4: 'F3',
        E5: 'F4',
        E6: 'F5',
        E7: 'F6',
        E8: 'F7',
        F1: null,
        F2: 'G1',
        F3: 'G2',
        F4: 'G3',
        F5: 'G4',
        F6: 'G5',
        F7: 'G6',
        F8: 'G7',
        G1: null,
        G2: 'H1',
        G3: 'H2',
        G4: 'H3',
        G5: 'H4',
        G6: 'H5',
        G7: 'H6',
        G8: 'H7',
        H1: null,
        H2: null,
        H3: null,
        H4: null,
        H5: null,
        H6: null,
        H7: null,
        H8: null,
    },
    UP_RIGHT: {
        A1: 'B2',
        A2: 'B3',
        A3: 'B4',
        A4: 'B5',
        A5: 'B6',
        A6: 'B7',
        A7: 'B8',
        A8: null,
        B1: 'C2',
        B2: 'C3',
        B3: 'C4',
        B4: 'C5',
        B5: 'C6',
        B6: 'C7',
        B7: 'C8',
        B8: null,
        C1: 'D2',
        C2: 'D3',
        C3: 'D4',
        C4: 'D5',
        C5: 'D6',
        C6: 'D7',
        C7: 'D8',
        C8: null,
        D1: 'E2',
        D2: 'E3',
        D3: 'E4',
        D4: 'E5',
        D5: 'E6',
        D6: 'E7',
        D7: 'E8',
        D8: null,
        E1: 'F2',
        E2: 'F3',
        E3: 'F4',
        E4: 'F5',
        E5: 'F6',
        E6: 'F7',
        E7: 'F8',
        E8: null,
        F1: 'G2',
        F2: 'G3',
        F3: 'G4',
        F4: 'G5',
        F5: 'G6',
        F6: 'G7',
        F7: 'G8',
        F8: null,
        G1: 'H2',
        G2: 'H3',
        G3: 'H4',
        G4: 'H5',
        G5: 'H6',
        G6: 'H7',
        G7: 'H8',
        G8: null,
        H1: null,
        H2: null,
        H3: null,
        H4: null,
        H5: null,
        H6: null,
        H7: null,
        H8: null,
    },
    DOWN_LEFT: {
        A1: null,
        A2: null,
        A3: null,
        A4: null,
        A5: null,
        A6: null,
        A7: null,
        A8: null,
        B1: null,
        B2: 'A1',
        B3: 'A2',
        B4: 'A3',
        B5: 'A4',
        B6: 'A5',
        B7: 'A6',
        B8: 'A7',
        C1: null,
        C2: 'B1',
        C3: 'B2',
        C4: 'B3',
        C5: 'B4',
        C6: 'B5',
        C7: 'B6',
        C8: 'B7',
        D1: null,
        D2: 'C1',
        D3: 'C2',
        D4: 'C3',
        D5: 'C4',
        D6: 'C5',
        D7: 'C6',
        D8: 'C7',
        E1: null,
        E2: 'D1',
        E3: 'D2',
        E4: 'D3',
        E5: 'D4',
        E6: 'D5',
        E7: 'D6',
        E8: 'D7',
        F1: null,
        F2: 'E1',
        F3: 'E2',
        F4: 'E3',
        F5: 'E4',
        F6: 'E5',
        F7: 'E6',
        F8: 'E7',
        G1: null,
        G2: 'F1',
        G3: 'F2',
        G4: 'F3',
        G5: 'F4',
        G6: 'F5',
        G7: 'F6',
        G8: 'F7',
        H1: null,
        H2: 'G1',
        H3: 'G2',
        H4: 'G3',
        H5: 'G4',
        H6: 'G5',
        H7: 'G6',
        H8: 'G7',
    },
}

const pawnScore = [
    [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
    [5.0, 5.0, 5.0, 5.0, 5.0, 5.0, 5.0, 5.0],
    [1.0, 1.0, 2.0, 3.0, 3.0, 2.0, 1.0, 1.0],
    [0.5, 0.5, 1.0, 2.5, 2.5, 1.0, 0.5, 0.5],
    [0.0, 0.0, 0.0, 2.0, 2.0, 0.0, 0.0, 0.0],
    [0.5, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.5],
    [0.5, 0.0, 0.0, -2.0, -2.0, 0.0, 0.0, 0.5],
    [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
]

const knightScore = [
    [-4.0, -3.0, -2.0, -2.0, -2.0, -2.0, -3.0, -4.0],
    [-3.0, -2.0, 0.0, 0.0, 0.0, 0.0, -2.0, -3.0],
    [-2.0, 0.0, 1.0, 1.5, 1.5, 1.0, 0.0, -2.0],
    [-2.0, 0.5, 1.5, 2.0, 2.0, 1.5, 0.5, -2.0],
    [-2.0, 0.0, 1.5, 2.0, 2.0, 1.5, 0.0, -2.0],
    [-2.0, 0.5, 1.0, 1.5, 1.5, 1.0, 0.5, -2.0],
    [-3.0, -2.0, 0.0, 0.5, 0.5, 0.0, -2.0, -3.0],
    [-4.0, -3.0, -2.0, -2.0, -2.0, -2.0, -3.0, -4.0],
]

const bishopScore = [
    [-2.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -2.0],
    [-1.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, -1.0],
    [-1.0, 0.0, 0.5, 1.0, 1.0, 0.5, 0.0, -1.0],
    [-1.0, 0.5, 0.5, 1.0, 1.0, 0.5, 0.5, -1.0],
    [-1.0, 0.0, 1.0, 1.0, 1.0, 1.0, 0.0, -1.0],
    [-1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, -1.0],
    [-1.0, 0.5, 0.0, 0.0, 0.0, 0.0, 0.5, -1.0],
    [-2.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -2.0],
]

const rookScore = [
    [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
    [0.5, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 0.5],
    [-0.5, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, -0.5],
    [-0.5, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, -0.5],
    [-0.5, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, -0.5],
    [-0.5, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, -0.5],
    [-0.5, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, -0.5],
    [0.0, 0.0, 0.0, 0.5, 0.5, 0.0, 0.0, 0.0],
]

const kingScore = [
    [-3.0, -4.0, -4.0, -5.0, -5.0, -4.0, -4.0, -3.0],
    [-3.0, -4.0, -4.0, -5.0, -5.0, -4.0, -4.0, -3.0],
    [-3.0, -4.0, -4.0, -5.0, -5.0, -4.0, -4.0, -3.0],
    [-3.0, -4.0, -4.0, -5.0, -5.0, -4.0, -4.0, -3.0],
    [-2.0, -3.0, -3.0, -4.0, -4.0, -3.0, -3.0, -2.0],
    [-1.0, -2.0, -2.0, -2.0, -2.0, -2.0, -2.0, -1.0],
    [2.0, 2.0, 0.0, 0.0, 0.0, 0.0, 2.0, 2.0],
    [2.0, 3.0, 1.0, 0.0, 0.0, 1.0, 3.0, 2.0],
]

const queenScore = [
    [-2.0, -1.0, -1.0, -0.5, -0.5, -1.0, -1.0, -2.0],
    [-1.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, -1.0],
    [-1.0, 0.0, 0.5, 0.5, 0.5, 0.5, 0.0, -1.0],
    [-0.5, 0.0, 0.5, 0.5, 0.5, 0.5, 0.0, -0.5],
    [0.0, 0.0, 0.5, 0.5, 0.5, 0.5, 0.0, -0.5],
    [-1.0, 0.5, 0.5, 0.5, 0.5, 0.5, 0.0, -1.0],
    [-1.0, 0.0, 0.5, 0.0, 0.0, 0.0, 0.0, -1.0],
    [-2.0, -1.0, -1.0, -0.5, -0.5, -1.0, -1.0, -2.0],
]

export const scoreByPosition = {
    P: pawnScore.slice().reverse(),
    p: pawnScore,
    N: knightScore.slice().reverse(),
    n: knightScore,
    B: bishopScore.slice().reverse(),
    b: bishopScore,
    R: rookScore.slice().reverse(),
    r: rookScore,
    K: kingScore.slice().reverse(),
    k: kingScore,
    Q: queenScore.slice().reverse(),
    q: queenScore,
}

export function up (location) {
    return CLOSE_FIELDS_MAP.UP[location]
}

export function down (location) {
    return CLOSE_FIELDS_MAP.DOWN[location]
}

export function left (location) {
    return CLOSE_FIELDS_MAP.LEFT[location]
}

export function right (location) {
    return CLOSE_FIELDS_MAP.RIGHT[location]
}

export function upLeft (location) {
    return CLOSE_FIELDS_MAP.UP_LEFT[location]
}

export function upRight (location) {
    return CLOSE_FIELDS_MAP.UP_RIGHT[location]
}

export function downLeft (location) {
    return CLOSE_FIELDS_MAP.DOWN_LEFT[location]
}

export function downRight (location) {
    return CLOSE_FIELDS_MAP.DOWN_RIGHT[location]
}

export function upLeftUp (location) {
    const field = upLeft(location)
    return field ? up(field) : null
}

export function upLeftLeft (location) {
    const field = upLeft(location)
    return field ? left(field) : null
}

export function upRightUp (location) {
    const field = upRight(location)
    return field ? up(field) : null
}

export function upRightRight (location) {
    const field = upRight(location)
    return field ? right(field) : null
}

export function downLeftDown (location) {
    const field = downLeft(location)
    return field ? down(field) : null
}

export function downLeftLeft (location) {
    const field = downLeft(location)
    return field ? left(field) : null
}

export function downRightDown (location) {
    const field = downRight(location)
    return field ? down(field) : null
}

export function downRightRight (location) {
    const field = downRight(location)
    return field ? right(field) : null
}

export function upByColor (location, color) {
    if (color === COLORS.WHITE) {
        return CLOSE_FIELDS_MAP.UP[location]
    } else {
        return CLOSE_FIELDS_MAP.DOWN[location]
    }
}

export function downByColor (location, color) {
    if (color === COLORS.WHITE) {
        return CLOSE_FIELDS_MAP.DOWN[location]
    } else {
        return CLOSE_FIELDS_MAP.UP[location]
    }
}

export function leftByColor (location, color) {
    if (color === COLORS.WHITE) {
        return CLOSE_FIELDS_MAP.LEFT[location]
    } else {
        return CLOSE_FIELDS_MAP.RIGHT[location]
    }
}

export function rightByColor (location, color) {
    if (color === COLORS.WHITE) {
        return CLOSE_FIELDS_MAP.RIGHT[location]
    } else {
        return CLOSE_FIELDS_MAP.LEFT[location]
    }
}

export function upLeftByColor (location, color) {
    if (color === COLORS.WHITE) {
        return CLOSE_FIELDS_MAP.UP_LEFT[location]
    } else {
        return CLOSE_FIELDS_MAP.DOWN_RIGHT[location]
    }
}

export function upRightByColor (location, color) {
    if (color === COLORS.WHITE) {
        return CLOSE_FIELDS_MAP.UP_RIGHT[location]
    } else {
        return CLOSE_FIELDS_MAP.DOWN_LEFT[location]
    }
}

export function downLeftByColor (location, color) {
    if (color === COLORS.WHITE) {
        return CLOSE_FIELDS_MAP.DOWN_LEFT[location]
    } else {
        return CLOSE_FIELDS_MAP.UP_RIGHT[location]
    }
}

export function downRightByColor (location, color) {
    if (color === COLORS.WHITE) {
        return CLOSE_FIELDS_MAP.DOWN_RIGHT[location]
    } else {
        return CLOSE_FIELDS_MAP.UP_LEFT[location]
    }
}
