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
            throw new Error(`Invalid move from ${from} to ${to} for ${this.playingPlayer.color}`)
        }
        this.board.move(from, to)
        this.board.playingPlayer = this.board.playingPlayer === this.board.playerWhite ? this.board.playerBlack : this.board.playerWhite
    }

    status () {
        const reamingMoves = Object.keys(this.board.playingPlayer.moves).length
        return {
            turn: this.board.playingPlayer.color,
            isFinished: reamingMoves === 0,
            checkMate: reamingMoves === 0 && this.board.hasPlayingPlayerCheck()
        }
    }

    moves () {
        return this.board.playingPlayer.moves
    }

    printToConsole () {
        this.board.print()
    }
}

export function getMoves (config) {
    const game = new Game(config)
    return game.moves()
}

export function getStatus (config) {
    const game = new Game(config)
    return game.status()
}
