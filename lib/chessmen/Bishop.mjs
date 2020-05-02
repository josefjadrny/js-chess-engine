import Chessman from './Chessman.mjs'

export default class Bishop extends Chessman {
    getUnicode () {
        if (this.isWhite()) {
            return '\u265D'
        }
        if (this.isBlack()) {
            return '\u2657'
        }
        return super.getUnicode()
    }

    getAlias () {
        if (this.isWhite()) {
            return 'B'
        }
        if (this.isBlack()) {
            return 'b'
        }
        return super.getAlias()
    }

    getMoves () {
        const moves = [
            ...this.getMovesUpLeftAll(),
            ...this.getMovesUpRightAll(),
            ...this.getMovesDownRightAll(),
            ...this.getMovesDownLeftAll()
        ]
        return moves
    }
}
