import { COLORS } from './const/board.mjs'

export default class Field {
    constructor (color, location) {
        this.chessMan = null
        this.color = color
        this.location = location
        this.neighbours = {
            left: null,
            right: null,
            up: null,
            down: null,
        }
    }

    up (color = COLORS.WHITE) {
        return color === COLORS.WHITE ? this.neighbours.up : this.neighbours.down
    }

    down (color = COLORS.WHITE) {
        return color === COLORS.WHITE ? this.neighbours.down : this.neighbours.up
    }

    left (color = COLORS.WHITE) {
        return color === COLORS.WHITE ? this.neighbours.left : this.neighbours.right
    }

    right (color = COLORS.WHITE) {
        return color === COLORS.WHITE ? this.neighbours.right : this.neighbours.left
    }

    upLeft (color) {
        return this.up(color) ? this.up(color).left(color) : null
    }

    upRight (color) {
        return this.up(color) ? this.up(color).right(color) : null
    }

    downLeft (color) {
        return this.down(color) ? this.down(color).left(color) : null
    }

    downRight (color) {
        return this.down(color) ? this.down(color).right(color) : null
    }

    setField (chessman) {
        if (this.chessMan) {
            this.removeChessMan()
        }
        if (chessman) {
            chessman.field = this
        }
        this.chessMan = chessman
    }

    removeChessMan () {
        Object.assign(this.chessMan.field, null)
        Object.assign(this.chessMan, null)
    }

    isEmpty () {
        return this.chessMan == null
    }

    isWhite () {
        return this.color === COLORS.WHITE
    }

    isBlack () {
        return this.color === COLORS.BLACK
    }

    getUnicode () {
        if (!this.isEmpty()) {
            return this.chessMan.getUnicode()
        }
        if (this.isBlack()) {
            return '\u2591'
        }
        if (this.isWhite()) {
            return '\u2588'
        }
        throw new Error('No unicode defined')
    }
}
