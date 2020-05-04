import Chessman from './Chessman.mjs'

export default class King extends Chessman {
    getValue () {
        return 20
    }

    isKing () {
        return true
    }

    getUnicode () {
        if (this.isWhite()) {
            return '\u265A'
        }
        if (this.isBlack()) {
            return '\u2654'
        }
        return super.getUnicode()
    }

    getAlias () {
        if (this.isWhite()) {
            return 'K'
        }
        if (this.isBlack()) {
            return 'k'
        }
        return super.getAlias()
    }

    getMoves () {
        const moves = []
        if (this.field.up(this.color) && (
            this.field.up(this.color).isEmpty() ||
            this.field.up(this.color).chessMan.color !== this.color
        )) {
            moves.push(this.field.up(this.color).location)
        }

        if (this.field.down(this.color) && (
            this.field.down(this.color).isEmpty() ||
            this.field.down(this.color).chessMan.color !== this.color
        )) {
            moves.push(this.field.down(this.color).location)
        }

        if (this.field.left(this.color) && (
            this.field.left(this.color).isEmpty() ||
            this.field.left(this.color).chessMan.color !== this.color
        )) {
            moves.push(this.field.left(this.color).location)
        }

        if (this.field.right(this.color) && (
            this.field.right(this.color).isEmpty() ||
            this.field.right(this.color).chessMan.color !== this.color
        )) {
            moves.push(this.field.right(this.color).location)
        }

        if (this.field.upRight(this.color) && (
            this.field.upRight(this.color).isEmpty() ||
            this.field.upRight(this.color).chessMan.color !== this.color
        )) {
            moves.push(this.field.upRight(this.color).location)
        }

        if (this.field.upLeft(this.color) && (
            this.field.upLeft(this.color).isEmpty() ||
            this.field.upLeft(this.color).chessMan.color !== this.color
        )) {
            moves.push(this.field.upLeft(this.color).location)
        }

        if (this.field.downLeft(this.color) && (
            this.field.downLeft(this.color).isEmpty() ||
            this.field.downLeft(this.color).chessMan.color !== this.color
        )) {
            moves.push(this.field.downLeft(this.color).location)
        }

        if (this.field.downRight(this.color) && (
            this.field.downRight(this.color).isEmpty() ||
            this.field.downRight(this.color).chessMan.color !== this.color
        )) {
            moves.push(this.field.downRight(this.color).location)
        }

        return moves
    }
}
