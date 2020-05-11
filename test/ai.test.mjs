import chai from 'chai'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { Game } from '../lib/js-chess-engine.mjs'
const __filename = fileURLToPath(import.meta.url) // eslint-disable-line
const __dirname = path.dirname(__filename)

const expect = chai.expect

describe('Should properly calculate BEST AI move for 4 future moves', function () {
    before(function () {
        this.aiLevel = 3
    })

    it.skip('Black should move with pawn E7 to E5', function () {
        const boardConfiguration = JSON.parse(fs.readFileSync(path.resolve(__dirname, './boards/pawn_e7e5.json')))
        const game = new Game(boardConfiguration)
        game.printToConsole()
        expect(game.board.calculateAiMove(this.aiLevel)).to.deep.include({ from: 'E7', to: 'E5' })
    })

    it('Should do checkmate in one move', function () {
        const game = new Game({
            pieces: {
                E1: 'K',
                A7: 'R',
                B6: 'R',
                E8: 'k',
            },
        })
        game.printToConsole()
        const nextMove = game.board.calculateAiMove(this.aiLevel)
        expect(nextMove).to.deep.include({ from: 'B6' })
    })

    it('Should do checkmate in tree moves', function () {
        const game = new Game({
            pieces: {
                E1: 'K',
                A7: 'R',
                A6: 'R',
                E8: 'k',
            },
        })
        game.printToConsole()
        const nextMove = game.board.calculateAiMove(this.aiLevel)
        expect(game.board.calculateAiMove(this.aiLevel)).to.deep.include({ from: 'A6' })
        expect(nextMove.to).to.be.oneOf(['B6', 'C6', 'D6', 'F6', 'G6', 'H6'])
    })
})
