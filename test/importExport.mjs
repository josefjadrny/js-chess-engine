import chai from 'chai'
import { Game } from '../lib/js-chess-engine.mjs'

const expect = chai.expect

describe('Should properly export FEN', function () {
    it('For new board', function () {
        const expectedFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
        const game = new Game()
        expect(game.exportFEN()).to.be.deep.equal(expectedFen)
    })
    it('For new board after E2 to E4', function () {
        const expectedFen = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1'
        const game = new Game()
        game.move('E2', 'E4')
        expect(game.exportFEN()).to.be.deep.equal(expectedFen)
    })
    it('For new board after E2 to E4 and C7 to C5', function () {
        const expectedFen = 'rnbqkbnr/pp1ppppp/8/2p5/4P3/8/PPPP1PPP/RNBQKBNR w KQkq c6 0 2'
        const game = new Game()
        game.move('E2', 'E4')
        game.move('C7', 'C5')
        expect(game.exportFEN()).to.be.deep.equal(expectedFen)
    })
    it('For new board after E2 to E4 and C7 to C5 and E1 to E2', function () {
        const expectedFen = 'rnbqkbnr/pp1ppppp/8/2p5/4P3/8/PPPPKPPP/RNBQ1BNR b kq - 1 2'
        const game = new Game()
        game.move('E2', 'E4')
        game.move('C7', 'C5')
        game.move('E1', 'E2')
        expect(game.exportFEN()).to.be.deep.equal(expectedFen)
    })
    it('For new board after E2 to E4 and C7 to C5 and E1 to E2 and D7 do D6', function () {
        const expectedFen = 'rnbqkbnr/pp2pppp/3p4/2p5/4P3/8/PPPPKPPP/RNBQ1BNR w kq - 0 3'
        const game = new Game()
        game.move('E2', 'E4')
        game.move('C7', 'C5')
        game.move('E1', 'E2')
        game.move('D7', 'D6')
        expect(game.exportFEN()).to.be.deep.equal(expectedFen)
    })
    it('For new board after E2 to E4 and C7 to C5 and E1 to E2 and D7 do D6 nad G1 to F3', function () {
        const expectedFen = 'rnbqkbnr/pp2pppp/3p4/2p5/4P3/5N2/PPPPKPPP/RNBQ1B1R b kq - 1 3'
        const game = new Game()
        game.move('E2', 'E4')
        game.move('C7', 'C5')
        game.move('E1', 'E2')
        game.move('D7', 'D6')
        game.move('G1', 'F3')
        expect(game.exportFEN()).to.be.deep.equal(expectedFen)
    })
    it('For new board after E2 to E4 and C7 to C5 and E1 to E2 and D7 do D6 nad G1 to F3 and E8 to D7', function () {
        const expectedFen = 'rnbq1bnr/pp1kpppp/3p4/2p5/4P3/5N2/PPPPKPPP/RNBQ1B1R w - - 2 4'
        const game = new Game()
        game.move('E2', 'E4')
        game.move('C7', 'C5')
        game.move('E1', 'E2')
        game.move('D7', 'D6')
        game.move('G1', 'F3')
        game.move('E8', 'D7')
        expect(game.exportFEN()).to.be.deep.equal(expectedFen)
    })
})
