import chai from 'chai'
import { Game } from '../lib/js-chess-engine.mjs'

const expect = chai.expect

describe('Should properly calculate BEST AI move', function () {
    before(function () {
        this.aiLevel = 4
        console.time('UI test calculated in')
    })

    after(function () {
        console.timeEnd('UI test calculated in')
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

    it('Should not end with draw', function () {
        const game = new Game({
            pieces: {
                E3: 'K',
                F2: 'r',
                D6: 'q',
                E8: 'k',
                G3: 'p',
            },
            turn: 'black',
        })
        game.printToConsole()
        game.aiMove(this.aiLevel)
        expect(game.exportJson().isFinished).to.be.equal(false)
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

    it('Should move with pawn', function () {
        const game = new Game({
            pieces: {
                D1: 'Q',
                A1: 'R',
                B2: 'P',
                C2: 'P',
                F2: 'P',
                G2: 'P',
                H2: 'P',
                D8: 'q',
                A8: 'r',
                A7: 'p',
                B7: 'p',
                C7: 'p',
                F7: 'p',
                G7: 'p',
                H7: 'p',
                E4: 'P',
                E5: 'N',
                A3: 'P',
                C5: 'p',
                D5: 'N',
                G8: 'k',
                F8: 'r',
                B5: 'B',
                B8: 'n',
                E6: 'b',
                G1: 'K',
                F1: 'R',
            },
            turn: 'black',
        })
        game.printToConsole()
        const move = game.aiMove(this.aiLevel)
        expect(move).to.be.deep.equal({ C7: 'C6' })
    })
})
