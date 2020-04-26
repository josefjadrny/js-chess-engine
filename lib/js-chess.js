import Board from './Board.js'
import { NEW_GAME_BOARD_CONFIG } from './const/board.js'

export class Game {
    constructor (config = NEW_GAME_BOARD_CONFIG) {
        this.board = new Board().createFromJson(config).recalculate()
    }

    move (from, to) {
        from = from.toUpperCase()
        to = to.toUpperCase()
        if (!this.board.playingPlayer.moves[from] || !this.board.playingPlayer.moves[from].includes(to)) {
            throw new Error(`Invalid move from ${from} to ${to} for ${this.board.playingPlayer.color}`)
        }
        this.board.move(from, to)
    }

    moves (from = null) {
        return (from ? this.board.playingPlayer.moves[from.toUpperCase()] : this.board.playingPlayer.moves) || []
    }

    printToConsole () {
        this.board.print()
    }

    exportJson () {
        return this.board.exportJson()
    }
}

export function chessMoves (config) {
    const game = new Game(config)
    return game.moves()
}

export function chessStatus (config) {
    const game = new Game(config)
    return game.exportJson()
}

export function chessMove (config) {
    const game = new Game(config)
    game.move(config.move.from, config.move.to)
    return game.exportJson()
}
