import Board from './Board.mjs'
import { printToConsole } from './utils.mjs'

export class Game {
    constructor (configuration) {
        this.board = new Board(configuration)
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
        return (from ? this.board.getAllMoves()[from.toUpperCase()] : this.board.getAllMoves()) || []
    }

    aiMove (level = 2) {
        const move = this.board.calculateAiMove(level)
        return this.move(move.from, move.to)
    }

    printToConsole () {
        printToConsole(this.board.configuration)
    }

    exportJson () {
        return this.board.exportJson()
    }

    exportFEN () {
        return this.board.exportFEN()
    }
}

export function moves (config) {
    const game = new Game(config)
    return game.moves()
}

export function status (config) {
    const game = new Game(config)
    return game.exportJson()
}

export function getFen (config) {
    const game = new Game(config)
    return game.exportFEN()
}

export function move (config, from, to) {
    const game = new Game(config)
    game.move(from, to)
    if (typeof config === 'object') {
        return game.exportJson()
    } else {
        return game.exportFEN()
    }
}

export function aiMove (config, level = 2) {
    const game = new Game(config)
    const move = game.board.calculateAiMove(level)
    return { [move.from]: move.to }
}
