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
