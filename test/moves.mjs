import chai from 'chai'
import { Game } from '../lib/js-chess-engine.mjs'

const expect = chai.expect

describe('Should properly calculate possible moves', function () {
    it('for new game', function () {
        const game = new Game()
        const expectedMoves = {
            B1: ['A3', 'C3'],
            G1: ['F3', 'H3'],
            A2: ['A3', 'A4'],
            B2: ['B3', 'B4'],
            C2: ['C3', 'C4'],
            D2: ['D3', 'D4'],
            E2: ['E3', 'E4'],
            F2: ['F3', 'F4'],
            G2: ['G3', 'G4'],
            H2: ['H3', 'H4'],
        }
        expect(game.moves()).to.deep.equal(expectedMoves)
    })
})
