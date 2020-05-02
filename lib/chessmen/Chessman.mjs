import { COLORS } from '../const/board.mjs'

export default class Chessman {
    constructor (color) {
        this.color = color
        this.field = null
        this.moved = false
    }

    isInGame () {
        return !!this.field
    }

    isWhite () {
        return this.color === COLORS.WHITE
    }

    isBlack () {
        return this.color === COLORS.BLACK
    }

    getUnicode () {
        throw new Error('No unicode defined')
    }

    getAlias () {
        throw new Error('Alias not defined')
    }

    getMoves () {
        throw new Error('Not implemented')
    }

    isMoveInMoves (move) {
        return this.getMoves().includes(move)
    }

    isKing () {
        return false
    }

    getMovesUpAll () {
        const moves = []
        let field = this.field
        while (field.up(this.color) && field.up(this.color).isEmpty()) {
            field = field.up(this.color)
            moves.push(field.location)
        }
        if (field.up(this.color) && field.up(this.color).chessMan.color !== this.color) {
            moves.push(field.up(this.color).location)
        }
        return moves
    }

    getMovesDownAll () {
        const moves = []
        let field = this.field
        while (field.down(this.color) && field.down(this.color).isEmpty()) {
            field = field.down(this.color)
            moves.push(field.location)
        }
        if (field.down(this.color) && field.down(this.color).chessMan.color !== this.color) {
            moves.push(field.down(this.color).location)
        }
        return moves
    }

    getMovesRightAll () {
        const moves = []
        let field = this.field
        while (field.right(this.color) && field.right(this.color).isEmpty()) {
            field = field.right(this.color)
            moves.push(field.location)
        }
        if (field.right(this.color) && field.right(this.color).chessMan.color !== this.color) {
            moves.push(field.right(this.color).location)
        }
        return moves
    }

    getMovesLeftAll () {
        const moves = []
        let field = this.field
        while (field.left(this.color) && field.left(this.color).isEmpty()) {
            field = field.left(this.color)
            moves.push(field.location)
        }
        if (field.left(this.color) && field.left(this.color).chessMan.color !== this.color) {
            moves.push(field.left(this.color).location)
        }
        return moves
    }

    getMovesUpLeftAll () {
        const moves = []
        let field = this.field
        while (field.upLeft(this.color) && field.upLeft(this.color).isEmpty()) {
            field = field.upLeft(this.color)
            moves.push(field.location)
        }
        if (field.upLeft(this.color) && field.upLeft(this.color).chessMan.color !== this.color) {
            moves.push(field.upLeft(this.color).location)
        }
        return moves
    }

    getMovesUpRightAll () {
        const moves = []
        let field = this.field
        while (field.upRight(this.color) && field.upRight(this.color).isEmpty()) {
            field = field.upRight(this.color)
            moves.push(field.location)
        }
        if (field.upRight(this.color) && field.upRight(this.color).chessMan.color !== this.color) {
            moves.push(field.upRight(this.color).location)
        }
        return moves
    }

    getMovesDownRightAll () {
        const moves = []
        let field = this.field
        while (field.downRight(this.color) && field.downRight(this.color).isEmpty()) {
            field = field.downRight(this.color)
            moves.push(field.location)
        }
        if (field.downRight(this.color) && field.downRight(this.color).chessMan.color !== this.color) {
            moves.push(field.downRight(this.color).location)
        }
        return moves
    }

    getMovesDownLeftAll () {
        const moves = []
        let field = this.field
        while (field.downLeft(this.color) && field.downLeft(this.color).isEmpty()) {
            field = field.downLeft(this.color)
            moves.push(field.location)
        }
        if (field.downLeft(this.color) && field.downLeft(this.color).chessMan.color !== this.color) {
            moves.push(field.downLeft(this.color).location)
        }
        return moves
    }
}
