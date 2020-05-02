import Chessman from './Chessman.mjs'

export default class Knight extends Chessman {
    getUnicode () {
        if (this.isWhite()) {
            return '\u265E'
        }
        if (this.isBlack()) {
            return '\u2658'
        }
        return super.getUnicode()
    }

    getAlias () {
        if (this.isWhite()) {
            return 'N'
        }
        if (this.isBlack()) {
            return 'n'
        }
        return super.getAlias()
    }

    getMoves () {
        const moves = []
        if (this.field.up(this.color) &&
            this.field.up(this.color).up(this.color)) {
            const field = this.field.up(this.color).up(this.color)
            if (field.left(this.color) &&
                (field.left(this.color).isEmpty() ||
                    field.left(this.color).chessMan.color !== this.color)) {
                moves.push(field.left(this.color).location)
            }
            if (field.right(this.color) &&
                (field.right(this.color).isEmpty() ||
                    field.right(this.color).chessMan.color !== this.color)) {
                moves.push(field.right(this.color).location)
            }
        }

        if (this.field.down(this.color) &&
            this.field.down(this.color).down(this.color)) {
            const field = this.field.down(this.color).down(this.color)
            if (field.left(this.color) &&
                (field.left(this.color).isEmpty() ||
                    field.left(this.color).chessMan.color !== this.color)) {
                moves.push(field.left(this.color).location)
            }
            if (field.right(this.color) &&
                (field.right(this.color).isEmpty() ||
                    field.right(this.color).chessMan.color !== this.color)) {
                moves.push(field.right(this.color).location)
            }
        }

        if (this.field.left(this.color) &&
            this.field.left(this.color).left(this.color)) {
            const field = this.field.left(this.color).left(this.color)
            if (field.down(this.color) &&
                (field.down(this.color).isEmpty() ||
                    field.down(this.color).chessMan.color !== this.color)) {
                moves.push(field.down(this.color).location)
            }
            if (field.up(this.color) &&
                (field.up(this.color).isEmpty() ||
                    field.up(this.color).chessMan.color !== this.color)) {
                moves.push(field.up(this.color).location)
            }
        }

        if (this.field.right(this.color) &&
            this.field.right(this.color).right(this.color)) {
            const field = this.field.right(this.color).right(this.color)
            if (field.down(this.color) &&
                (field.down(this.color).isEmpty() ||
                    field.down(this.color).chessMan.color !== this.color)) {
                moves.push(field.down(this.color).location)
            }
            if (field.up(this.color) &&
                (field.up(this.color).isEmpty() ||
                    field.up(this.color).chessMan.color !== this.color)) {
                moves.push(field.up(this.color).location)
            }
        }

        return moves
    }
}
