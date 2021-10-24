import { COLUMNS, ROWS, COLORS, PIECES } from './const/board.mjs'

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
    const values = { k: 10, q: 9, r: 5, b: 3, n: 3, p: 1 }
    return values[piece.toLowerCase()] || 0
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
    const [board, player, castlings, enPassant, halfmove, fullmove] = fen.split(' ')

    // pieces
    const configuration = {
        pieces: Object.fromEntries(board.split('/').flatMap((row, rowIdx) => {
            let colIdx = 0
            return row.split('').reduce((acc, sign) => {
                const piece = sign.match(/k|b|q|n|p|r/i)
                if (piece) {
                    acc.push([`${COLUMNS[colIdx]}${ROWS[7 - rowIdx]}`, piece[0]])
                    colIdx += 1
                }
                const squares = sign.match(/[1-8]/)
                if (squares) {
                    colIdx += Number(squares)
                }
                return acc
            }, [])
        })),
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
        configuration.enPassant = enPassant.toUpperCase()
    }

    // halfmoves
    configuration.halfMove = parseInt(halfmove)

    // fullmoves
    configuration.fullMove = parseInt(fullmove)

    return configuration
}

export function isLocationValid (location) {
    return typeof location === 'string' && location.match('^[a-hA-H]{1}[1-8]{1}$')
}

export function isPieceValid (piece) {
    return Object.values(PIECES).includes(piece)
}
