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

describe('Should properly import FEN', function () {
    it('For new board', function () {
        const gameFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
        const game = new Game(gameFen)

        expect(game.board.getChessman('A1').getAlias()).to.be.equal('R')
        expect(game.board.getChessman('H1').getAlias()).to.be.equal('R')
        expect(game.board.getChessman('A8').getAlias()).to.be.equal('r')
        expect(game.board.getChessman('H8').getAlias()).to.be.equal('r')
        expect(game.board.getChessman('B1').getAlias()).to.be.equal('N')
        expect(game.board.getChessman('G1').getAlias()).to.be.equal('N')
        expect(game.board.getChessman('B8').getAlias()).to.be.equal('n')
        expect(game.board.getChessman('G8').getAlias()).to.be.equal('n')
        expect(game.board.getChessman('C1').getAlias()).to.be.equal('B')
        expect(game.board.getChessman('F1').getAlias()).to.be.equal('B')
        expect(game.board.getChessman('C8').getAlias()).to.be.equal('b')
        expect(game.board.getChessman('F8').getAlias()).to.be.equal('b')
        expect(game.board.getChessman('D1').getAlias()).to.be.equal('Q')
        expect(game.board.getChessman('E1').getAlias()).to.be.equal('K')
        expect(game.board.getChessman('D8').getAlias()).to.be.equal('q')
        expect(game.board.getChessman('E8').getAlias()).to.be.equal('k')
        expect(game.board.getChessman('A2').getAlias()).to.be.equal('P')
        expect(game.board.getChessman('B2').getAlias()).to.be.equal('P')
        expect(game.board.getChessman('C2').getAlias()).to.be.equal('P')
        expect(game.board.getChessman('D2').getAlias()).to.be.equal('P')
        expect(game.board.getChessman('E2').getAlias()).to.be.equal('P')
        expect(game.board.getChessman('F2').getAlias()).to.be.equal('P')
        expect(game.board.getChessman('G2').getAlias()).to.be.equal('P')
        expect(game.board.getChessman('H2').getAlias()).to.be.equal('P')
        expect(game.board.getChessman('A7').getAlias()).to.be.equal('p')
        expect(game.board.getChessman('B7').getAlias()).to.be.equal('p')
        expect(game.board.getChessman('C7').getAlias()).to.be.equal('p')
        expect(game.board.getChessman('D7').getAlias()).to.be.equal('p')
        expect(game.board.getChessman('E7').getAlias()).to.be.equal('p')
        expect(game.board.getChessman('F7').getAlias()).to.be.equal('p')
        expect(game.board.getChessman('G7').getAlias()).to.be.equal('p')
        expect(game.board.getChessman('H7').getAlias()).to.be.equal('p')
        expect(game.board.playerWhite.chessMen.length).to.be.equal(16)
        expect(game.board.playerBlack.chessMen.length).to.be.equal(16)

        expect(game.board.playingPlayer).to.be.equal(game.board.playerWhite)
        expect(game.board.castlings).to.be.deep.equal({
            whiteLong: true,
            whiteShort: true,
            blackLong: true,
            blackShort: true,
        })
        expect(game.board.enPassant).to.be.equal(null)
        expect(game.board.counters).to.be.deep.equal({
            halfMove: 0,
            fullMove: 1,
        })
    })

    it('For new board after E2 to E4', function () {
        const gameFen = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1'
        const game = new Game(gameFen)

        expect(game.board.getChessman('A1').getAlias()).to.be.equal('R')
        expect(game.board.getChessman('H1').getAlias()).to.be.equal('R')
        expect(game.board.getChessman('A8').getAlias()).to.be.equal('r')
        expect(game.board.getChessman('H8').getAlias()).to.be.equal('r')
        expect(game.board.getChessman('B1').getAlias()).to.be.equal('N')
        expect(game.board.getChessman('G1').getAlias()).to.be.equal('N')
        expect(game.board.getChessman('B8').getAlias()).to.be.equal('n')
        expect(game.board.getChessman('G8').getAlias()).to.be.equal('n')
        expect(game.board.getChessman('C1').getAlias()).to.be.equal('B')
        expect(game.board.getChessman('F1').getAlias()).to.be.equal('B')
        expect(game.board.getChessman('C8').getAlias()).to.be.equal('b')
        expect(game.board.getChessman('F8').getAlias()).to.be.equal('b')
        expect(game.board.getChessman('D1').getAlias()).to.be.equal('Q')
        expect(game.board.getChessman('E1').getAlias()).to.be.equal('K')
        expect(game.board.getChessman('D8').getAlias()).to.be.equal('q')
        expect(game.board.getChessman('E8').getAlias()).to.be.equal('k')
        expect(game.board.getChessman('A2').getAlias()).to.be.equal('P')
        expect(game.board.getChessman('B2').getAlias()).to.be.equal('P')
        expect(game.board.getChessman('C2').getAlias()).to.be.equal('P')
        expect(game.board.getChessman('D2').getAlias()).to.be.equal('P')
        expect(game.board.getChessman('E4').getAlias()).to.be.equal('P')
        expect(game.board.getChessman('F2').getAlias()).to.be.equal('P')
        expect(game.board.getChessman('G2').getAlias()).to.be.equal('P')
        expect(game.board.getChessman('H2').getAlias()).to.be.equal('P')
        expect(game.board.getChessman('A7').getAlias()).to.be.equal('p')
        expect(game.board.getChessman('B7').getAlias()).to.be.equal('p')
        expect(game.board.getChessman('C7').getAlias()).to.be.equal('p')
        expect(game.board.getChessman('D7').getAlias()).to.be.equal('p')
        expect(game.board.getChessman('E7').getAlias()).to.be.equal('p')
        expect(game.board.getChessman('F7').getAlias()).to.be.equal('p')
        expect(game.board.getChessman('G7').getAlias()).to.be.equal('p')
        expect(game.board.getChessman('H7').getAlias()).to.be.equal('p')
        expect(game.board.playerWhite.chessMen.length).to.be.equal(16)
        expect(game.board.playerBlack.chessMen.length).to.be.equal(16)

        expect(game.board.playingPlayer).to.be.equal(game.board.playerBlack)
        expect(game.board.castlings).to.be.deep.equal({
            whiteLong: true,
            whiteShort: true,
            blackLong: true,
            blackShort: true,
        })
        expect(game.board.enPassant).to.be.equal('e3')
        expect(game.board.counters).to.be.deep.equal({
            halfMove: 0,
            fullMove: 1,
        })
    })

    it('For new board after E2 to E4 and C7 to C5 and E1 to E2', function () {
        const gameFen = 'rnbqkbnr/pp1ppppp/8/2p5/4P3/8/PPPPKPPP/RNBQ1BNR b kq - 1 2'
        const game = new Game(gameFen)

        expect(game.board.getChessman('A1').getAlias()).to.be.equal('R')
        expect(game.board.getChessman('H1').getAlias()).to.be.equal('R')
        expect(game.board.getChessman('A8').getAlias()).to.be.equal('r')
        expect(game.board.getChessman('H8').getAlias()).to.be.equal('r')
        expect(game.board.getChessman('B1').getAlias()).to.be.equal('N')
        expect(game.board.getChessman('G1').getAlias()).to.be.equal('N')
        expect(game.board.getChessman('B8').getAlias()).to.be.equal('n')
        expect(game.board.getChessman('G8').getAlias()).to.be.equal('n')
        expect(game.board.getChessman('C1').getAlias()).to.be.equal('B')
        expect(game.board.getChessman('F1').getAlias()).to.be.equal('B')
        expect(game.board.getChessman('C8').getAlias()).to.be.equal('b')
        expect(game.board.getChessman('F8').getAlias()).to.be.equal('b')
        expect(game.board.getChessman('D1').getAlias()).to.be.equal('Q')
        expect(game.board.getChessman('E2').getAlias()).to.be.equal('K')
        expect(game.board.getChessman('D8').getAlias()).to.be.equal('q')
        expect(game.board.getChessman('E8').getAlias()).to.be.equal('k')
        expect(game.board.getChessman('A2').getAlias()).to.be.equal('P')
        expect(game.board.getChessman('B2').getAlias()).to.be.equal('P')
        expect(game.board.getChessman('C2').getAlias()).to.be.equal('P')
        expect(game.board.getChessman('D2').getAlias()).to.be.equal('P')
        expect(game.board.getChessman('E4').getAlias()).to.be.equal('P')
        expect(game.board.getChessman('F2').getAlias()).to.be.equal('P')
        expect(game.board.getChessman('G2').getAlias()).to.be.equal('P')
        expect(game.board.getChessman('H2').getAlias()).to.be.equal('P')
        expect(game.board.getChessman('A7').getAlias()).to.be.equal('p')
        expect(game.board.getChessman('B7').getAlias()).to.be.equal('p')
        expect(game.board.getChessman('C5').getAlias()).to.be.equal('p')
        expect(game.board.getChessman('D7').getAlias()).to.be.equal('p')
        expect(game.board.getChessman('E7').getAlias()).to.be.equal('p')
        expect(game.board.getChessman('F7').getAlias()).to.be.equal('p')
        expect(game.board.getChessman('G7').getAlias()).to.be.equal('p')
        expect(game.board.getChessman('H7').getAlias()).to.be.equal('p')
        expect(game.board.playerWhite.chessMen.length).to.be.equal(16)
        expect(game.board.playerBlack.chessMen.length).to.be.equal(16)

        expect(game.board.playingPlayer).to.be.equal(game.board.playerBlack)
        expect(game.board.castlings).to.be.deep.equal({
            whiteLong: false,
            whiteShort: false,
            blackLong: true,
            blackShort: true,
        })
        expect(game.board.enPassant).to.be.equal(null)
        expect(game.board.counters).to.be.deep.equal({
            halfMove: 1,
            fullMove: 2,
        })
    })
})
