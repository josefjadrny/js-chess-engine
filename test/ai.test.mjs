import chai from 'chai'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { Game } from '../lib/js-chess-engine.mjs'
const __filename = fileURLToPath(import.meta.url) // eslint-disable-line
const __dirname = path.dirname(__filename)

const expect = chai.expect

describe('Should properly calculate BEST AI move', function () {
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
        expect(game.exportJson().checkMate).to.be.equal(true)
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
        expect(game.exportJson().checkMate).to.be.equal(true)
    })

    it('Should move with knight', function () {
        const game = new Game({
            pieces: {
                E1: 'K',
                D3: 'R',
                A3: 'B',
                H1: 'B',
                C7: 'N',
                G1: 'N',
                A2: 'P',
                B4: 'P',
                D2: 'P',
                F2: 'P',
                F3: 'P',
                H2: 'P',
                F7: 'k',
                H8: 'r',
                F8: 'b',
                G8: 'n',
                B8: 'n',
                A7: 'p',
                G4: 'p',
                H6: 'p',
            },
            turn: 'black',
        })
        game.printToConsole()
        const result = game.board.calculateAiMove(this.aiLevel)
        expect(['B8', 'G8'].includes(result.from)).to.be.equal(true)
        expect(['C6', 'F6'].includes(result.to)).to.be.equal(true)
    })
})

describe('Should properly calculate and increase maximum AI depth', function () {
    it('For new game', function () {
        const game = new Game()
        expect(game.board.getAIMaxDepth(1)).to.be.equal(1)
    })
    it('For game with few but valuable pieces', function () {
        const game = new Game({
            pieces: {
                E1: 'K',
                A7: 'Q',
                A6: 'q',
                E8: 'k',
            },
        })
        expect(game.board.getAIMaxDepth(1)).to.be.equal(1)
    })
    it('For game with few pieces', function () {
        const game = new Game({
            pieces: {
                E1: 'K',
                A7: 'Q',
                A6: 'r',
                E8: 'k',
            },
        })
        expect(game.board.getAIMaxDepth(1)).to.be.equal(2)
    })
    it('For game with many but useless valuable pieces', function () {
        const game = new Game({
            pieces: {
                E1: 'K',
                A2: 'P',
                B2: 'P',
                C2: 'P',
                D2: 'P',
                E2: 'P',
                F2: 'P',
                G2: 'P',
                H2: 'P',
                E8: 'k',
                A7: 'p',
                B7: 'p',
                C7: 'p',
                D7: 'p',
                E7: 'p',
                F7: 'p',
                G7: 'p',
                H7: 'p',
            },
        })
        expect(game.board.getAIMaxDepth(1)).to.be.equal(2)
    })
})
