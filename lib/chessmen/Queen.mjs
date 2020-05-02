import Chessman from './Chessman.mjs'

export default class Queen extends Chessman {
    getUnicode () {
        if (this.isWhite()) {
            return '\u265B'
        }
        if (this.isBlack()) {
            return '\u2655'
        }
        return super.getUnicode()
    }

    getAlias () {
        if (this.isWhite()) {
            return 'Q'
        }
        if (this.isBlack()) {
            return 'q'
        }
        return super.getAlias()
    }

    getMoves () {
        const moves = [
            ...this.getMovesUpAll(),
            ...this.getMovesDownAll(),
            ...this.getMovesLeftAll(),
            ...this.getMovesRightAll(),
            ...this.getMovesUpLeftAll(),
            ...this.getMovesUpRightAll(),
            ...this.getMovesDownRightAll(),
            ...this.getMovesDownLeftAll()
        ]
        return moves
    }
}
