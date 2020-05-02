import Chessman from './Chessman.mjs'

export default class Rook extends Chessman {
    getUnicode () {
        if (this.isWhite()) {
            return '\u265C'
        }
        if (this.isBlack()) {
            return '\u2656'
        }
        return super.getUnicode()
    }

    getAlias () {
        if (this.isWhite()) {
            return 'R'
        }
        if (this.isBlack()) {
            return 'r'
        }
        return super.getAlias()
    }

    getMoves () {
        const moves = [
            ...this.getMovesUpAll(),
            ...this.getMovesDownAll(),
            ...this.getMovesLeftAll(),
            ...this.getMovesRightAll()
        ]
        return moves
    }
}
