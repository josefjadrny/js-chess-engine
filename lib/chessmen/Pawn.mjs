import Chessman from './Chessman.mjs'

export default class Pawn extends Chessman {
    getValue () {
        return 1
    }

    getUnicode () {
        if (this.isWhite()) {
            return '\u265F'
        }
        if (this.isBlack()) {
            return '\u2659'
        }
        return super.getUnicode()
    }

    getAlias () {
        if (this.isWhite()) {
            return 'P'
        }
        if (this.isBlack()) {
            return 'p'
        }
        return super.getAlias()
    }

    isInStartLine () {
        if (this.isWhite() && this.field.location[1] === '2') {
            return true
        }
        if (this.isBlack() && this.field.location[1] === '7') {
            return true
        }
        return false
    }

    getMoves () {
        const moves = []
        if (this.field.up(this.color) && this.field.up(this.color).isEmpty()) {
            moves.push(this.field.up(this.color).location)
            if (this.isInStartLine() && this.field.up(this.color).up(this.color) && this.field.up(this.color).up(this.color).isEmpty()) {
                moves.push(this.field.up(this.color).up(this.color).location)
            }
        }

        if (this.field.upLeft(this.color) &&
            !this.field.upLeft(this.color).isEmpty() &&
            this.field.upLeft(this.color).chessMan.color !== this.color) {
            moves.push(this.field.upLeft(this.color).location)
        }

        if (this.field.upRight(this.color) &&
            !this.field.upRight(this.color).isEmpty() &&
            this.field.upRight(this.color).chessMan.color !== this.color) {
            moves.push(this.field.upRight(this.color).location)
        }
        return moves
    }
}
