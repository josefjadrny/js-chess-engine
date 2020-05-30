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
        console.time('UI test calculated in')
    })

    after(function () {
        console.timeEnd('UI test calculated in')
    })

    it.skip('Black should move with pawn E7 to E5', function () {
        const boardConfiguration = JSON.parse(fs.readFileSync(path.resolve(__dirname, './boards/pawn_e7e5.json')))
        const game = new Game(boardConfiguration)
        game.printToConsole()
        expect(game.board.calculateAiMove(this.aiLevel)).to.deep.include({ from: 'E7', to: 'E5' })
    })

    it('Should do checkmate in one move', function () {
        const game = new Game({
            turn: 'white',
            pieces: {
                E1: 'K',
                A7: 'R',
                B6: 'R',
                E8: 'k',
            },
        })
        game.printToConsole()
        game.aiMove(this.aiLevel)
        expect(game.board.checkMate).to.be.equal(true)
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
        game.aiMove(this.aiLevel)
        game.aiMove(0)
        game.aiMove(this.aiLevel)
        expect(game.board.checkMate).to.be.equal(true)
    })
})
