import { COLUMNS, ROWS, COLORS } from './const/board.mjs'

export function printToConsole (configuration) {
    process.stdout.write('\n')
    let fieldColor = COLORS.WHITE
    Object.assign([], ROWS).reverse().map(row => {
        process.stdout.write(`${row}`)
        COLUMNS.map(column => {
            switch (configuration.pieces[`${column}${row}`]) {
            case 'K': process.stdout.write('\u265A'); break
            case 'Q': process.stdout.write('\u265B'); break
            case 'R': process.stdout.write('\u265C'); break
            case 'B': process.stdout.write('\u265D'); break
            case 'N': process.stdout.write('\u265E'); break
            case 'P': process.stdout.write('\u265F'); break
            case 'k': process.stdout.write('\u2654'); break
            case 'q': process.stdout.write('\u2655'); break
            case 'r': process.stdout.write('\u2656'); break
            case 'b': process.stdout.write('\u2657'); break
            case 'n': process.stdout.write('\u2658'); break
            case 'p': process.stdout.write('\u2659'); break
            default: process.stdout.write(fieldColor === COLORS.WHITE ? '\u2588' : '\u2591')
            }

            fieldColor = fieldColor === COLORS.WHITE ? COLORS.BLACK : COLORS.WHITE
        })
        fieldColor = fieldColor === COLORS.WHITE ? COLORS.BLACK : COLORS.WHITE
        process.stdout.write('\n')
    })
    process.stdout.write(' ')
    COLUMNS.map(column => {
        process.stdout.write(`${column}`)
    })
    process.stdout.write('\n')
}

export function getPieceValue (piece) {
    let value = 0
    switch (piece) {
    case 'K': value = 10; break
    case 'Q': value = 9; break
    case 'R': value = 5; break
    case 'B': value = 3; break
    case 'N': value = 3; break
    case 'P': value = 1; break
    case 'k': value = 10; break
    case 'q': value = 9; break
    case 'r': value = 5; break
    case 'b': value = 3; break
    case 'n': value = 3; break
    case 'p': value = 1; break
    }

    return value
}

export function getFEN (configuration) {
    let fen = ''
    Object.assign([], ROWS).reverse().map(row => {
        let emptyFields = 0
        if (row < 8) {
            fen += '/'
        }
        COLUMNS.map(column => {
            const piece = configuration.pieces[`${column}${row}`]
            if (piece) {
                if (emptyFields) {
                    fen += emptyFields.toString()
                    emptyFields = 0
                }
                fen += piece
            } else {
                emptyFields++
            }
        })
        fen += `${emptyFields || ''}`
    })

    fen += configuration.turn === COLORS.WHITE ? ' w ' : ' b '

    const { whiteShort, whiteLong, blackLong, blackShort } = configuration.castling
    if (!whiteLong && !whiteShort && !blackLong && !blackShort) {
        fen += '-'
    } else {
        if (whiteShort) fen += 'K'
        if (whiteLong) fen += 'Q'
        if (blackShort) fen += 'k'
        if (blackLong) fen += 'q'
    }

    fen += ` ${configuration.enPassant ? configuration.enPassant.toLowerCase() : '-'}`

    fen += ` ${configuration.halfMove}`

    fen += ` ${configuration.fullMove}`

    return fen
}

export function getJSONfromFEN (fen = '') {
    const configuration = {
        pieces: {},
    }
    const parts = fen.split(' ')
    const pieces = parts[0]
    const player = parts[1]
    const castlings = parts[2]
    const enPassant = parts[3]
    const halfmove = parts[4]
    const fullmove = parts[5]

    // pieces
    let columnIndex = 0
    let rowIndex = ROWS.length - 1
    for (let index = 0; index < pieces.length; index++) {
        if (['K', 'Q', 'R', 'B', 'N', 'P', 'k', 'q', 'r', 'b', 'n', 'p'].includes(pieces[index])) {
            configuration.pieces[`${COLUMNS[columnIndex]}${ROWS[rowIndex]}`] = pieces[index]; columnIndex++
        } else if (['1', '2', '3', '4', '5', '6', '7', '8'].includes(pieces[index])) {
            columnIndex += parseInt(pieces[index])
        } else if (pieces[index] === '/') {
            rowIndex--
            columnIndex = 0
        }
    }

    // playing player
    if (player === 'b') {
        configuration.turn = COLORS.BLACK
    } else {
        configuration.turn = COLORS.WHITE
    }

    // castlings
    configuration.castling = {
        whiteLong: false,
        whiteShort: false,
        blackLong: false,
        blackShort: false,
    }
    if (castlings.includes('K')) {
        configuration.castling.whiteShort = true
    }
    if (castlings.includes('k')) {
        configuration.castling.blackShort = true
    }
    if (castlings.includes('Q')) {
        configuration.castling.whiteLong = true
    }
    if (castlings.includes('q')) {
        configuration.castling.blackLong = true
    }

    // enPassant
    if (isLocationValid(enPassant)) {
        configuration.enPassant = enPassant
    }

    // halfmoves
    configuration.halfMove = parseInt(halfmove)

    // fullmoves
    configuration.fullMove = parseInt(fullmove)

    return configuration
}

export function isLocationValid (location) {
    return location.match('^[a-hA-H]{1}[1-8]{1}$')
}
