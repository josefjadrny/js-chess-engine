import chai from 'chai'
import { Game } from '../lib/js-chess-engine.mjs'

const expect = chai.expect

describe('Should properly calculate', function () {
    it('Lowest value piece attacking filed for new board', function () {
        const game = new Game()
        expect(game.board.playerWhite.getLowestValuePieceAttackingLocation('C3')).to.be.equal(1)
    })
    it('Lowest value piece attacking filed for custom board', function () {
        const game = new Game({
            pieces: {
                E1: 'K',
                D1: 'Q',
                A2: 'R',
                E8: 'k',
            },
        })
        expect(game.board.playerWhite.getLowestValuePieceAttackingLocation('D2')).to.be.equal(5)
    })
    it('Highest value attacking piece', function () {
        const game = new Game({
            pieces: {
                E1: 'K',
                E4: 'P',
                D5: 'r',
                D1: 'n',
                E2: 'p',
                E8: 'k',
            },
        })
        expect(game.board.playerWhite.getHighestValueAttackingPiece()).to.be.equal(5)
    })
})
