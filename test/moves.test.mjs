import chai from 'chai'
import { Game } from '../lib/js-chess-engine.mjs'
import { COLORS } from '../lib/const/board.mjs'

const expect = chai.expect

describe('Should properly calculate possible moves', function () {
    it('For rook', function () {
        const game = new Game({
            pieces: {
                B8: 'R',
                E8: 'k',
            },
        })
        const expectedMoves = {
            B8: ['B7', 'B6', 'B5', 'B4', 'B3', 'B2', 'B1', 'C8', 'D8', 'E8', 'A8'],
        }
        expect(game.moves()).to.deep.equal(expectedMoves)
    })

    it('For rook in corner', function () {
        const game = new Game({
            pieces: {
                H8: 'R',
                F7: 'k',
                H7: 'p',
            },
        })
        const expectedMoves = {
            H8: ['H7', 'G8', 'F8', 'E8', 'D8', 'C8', 'B8', 'A8'],
        }
        expect(game.moves()).to.deep.equal(expectedMoves)
    })

    it('New game when white is on move', function () {
        const game = new Game()
        const expectedMoves = {
            B1: ['C3', 'A3'],
            G1: ['H3', 'F3'],
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

    it('White can do a long castling', function () {
        const game = new Game({
            pieces: {
                E1: 'K',
                A1: 'R',
                E8: 'k',
            },
        })

        const expectedMovesCastle = ['A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'B1', 'C1', 'D1']
        const expectedMovesKing = ['E2', 'F1', 'D1', 'D2', 'F2', 'C1']

        expect(game.moves('E1')).to.have.members(expectedMovesKing)
        expect(game.moves('A1')).to.have.members(expectedMovesCastle)
    })

    it('White can do a short castling', function () {
        const game = new Game({
            pieces: {
                E1: 'K',
                H1: 'R',
                E8: 'k',
            },
        })

        const expectedMoves = {
            E1: ['E2', 'F1', 'D1', 'D2', 'F2', 'G1'],
            H1: ['H2', 'H3', 'H4', 'H5', 'H6', 'H7', 'H8', 'G1', 'F1'],
        }

        expect(game.moves()).to.deep.equal(expectedMoves)
    })

    it('White can`t do a long castling when his King was moved', function () {
        const game = new Game({
            pieces: {
                E1: 'K',
                A1: 'R',
                E8: 'k',
            },
        })

        const expectedMoves = {
            E1: ['E2', 'F1', 'D1', 'D2', 'F2'],
            A1: ['A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'B1', 'C1', 'D1'],
        }
        game.move('E1', 'D1')
        game.move('E8', 'E7')
        game.move('D1', 'E1')
        game.move('E7', 'E6')

        expect(game.moves()).to.deep.equal(expectedMoves)
    })

    it('White can`t do a short castling when his King was moved', function () {
        const game = new Game({
            pieces: {
                E1: 'K',
                H1: 'R',
                E8: 'k',
            },
        })

        const expectedMoves = {
            E1: ['E2', 'F1', 'D1', 'D2', 'F2'],
            H1: ['H2', 'H3', 'H4', 'H5', 'H6', 'H7', 'H8', 'G1', 'F1'],
        }
        game.move('E1', 'D1')
        game.move('E8', 'E7')
        game.move('D1', 'E1')
        game.move('E7', 'E6')

        expect(game.moves()).to.deep.equal(expectedMoves)
    })

    it('White can`t do castling when is in check', function () {
        const game = new Game({
            pieces: {
                E1: 'K',
                E2: 'P',
                H1: 'R',
                H4: 'b',
                E8: 'k',
            },
        })

        const expectedMoves = ['F1', 'D1', 'D2']
        expect(game.moves('E1')).to.have.members(expectedMoves)
    })

    it('White can`t do castling when jumped field is under attack', function () {
        const game = new Game({
            pieces: {
                E1: 'K',
                E2: 'P',
                H1: 'R',
                F4: 'r',
                E8: 'k',
            },
        })
        const expectedMoves = ['D1', 'D2']
        expect(game.moves('E1')).to.have.members(expectedMoves)
    })

    it('black can do castling after white castling (https://github.com/josefjadrny/js-chess-engine/issues/9)', function () {
        const expectedMoves = ['E7', 'D7', 'G8', 'F8']

        const game = new Game({
            pieces: {
                E1: 'K',
                H1: 'R',
                H2: 'P',
                G2: 'P',
                F2: 'P',
                H7: 'p',
                G7: 'p',
                F7: 'p',
                E8: 'k',
                D8: 'q',
                H8: 'r',
            },
        })
        game.printToConsole()
        game.move('E1', 'G1')
        game.printToConsole()
        expect(game.moves('E8')).to.have.members(expectedMoves)
    })

    it('black can not do castling over attacked fields', function () {
        const expectedMoves = ['E7', 'D7', 'D8']

        const game = new Game({
            pieces: {
                E1: 'K',
                H1: 'R',
                H2: 'P',
                H7: 'p',
                E8: 'k',
                H8: 'r',
            },
        })
        game.printToConsole()
        game.move('E1', 'G1')
        game.printToConsole()
        expect(game.moves('E8')).to.have.members(expectedMoves)
    })

    it('White can do a en Passant', function () {
        const expectedMoves = ['C6', 'B6']

        const game = new Game()
        game.move('C2', 'C4')
        game.move('A7', 'A5')
        game.move('C4', 'C5')
        game.move('B7', 'B5')

        expect(game.moves('C5')).to.deep.equal(expectedMoves)

        game.move('C5', 'B6')

        expect(game.board.getPiece('B5')).to.be.a('undefined')
    })

    it('White can do a en Passant from FEN (#11)', function () {
        const expectedMoves = ['D6']
        const game = new Game('rn1qk2r/pbp1nppp/1p2p3/3pP3/1bBP4/2N2N2/PPP2PPP/R1BQK2R w KQkq d6 0 7')

        expect(game.moves('E5')).to.deep.equal(expectedMoves)
    })

    it('White cannot do a en Passant later', function () {
        const expectedMoves = ['C6']

        const game = new Game()
        game.move('C2', 'C4')
        game.move('A7', 'A5')
        game.move('C4', 'C5')
        game.move('B7', 'B5')
        game.move('A2', 'A4')
        game.move('H7', 'H6')

        expect(game.moves('C5')).to.deep.equal(expectedMoves)
    })

    it('Black can do a en Passant', function () {
        const expectedMoves = ['A3', 'B3']

        const game = new Game()
        game.move('C2', 'C3')
        game.move('A7', 'A5')
        game.move('C3', 'C4')
        game.move('A5', 'A4')
        game.move('B2', 'B4')

        expect(game.moves('A4')).to.deep.equal(expectedMoves)

        game.move('A4', 'B3')

        expect(game.board.getPiece('B4')).to.be.a('undefined')
    })
})

describe('Should properly calculate score', function () {
    it('Black player score is -128', function () {
        const game = new Game({
            turn: 'black',
            pieces: {
                // There is a piece value multiplier = 10
                E1: 'K', // 10
                C6: 'R', // 9
                H1: 'R', // 5
                B1: 'N', // 3
                E8: 'k', // 10
                E5: 'p', // 1
                D5: 'b', // 3
            },
        })

        expect(game.board.calculateScore()).to.be.equal(-90)
    })
    it('White player score is +129', function () {
        const game = new Game({
            turn: 'white',
            pieces: {
                // There is a piece value multiplier = 10
                E1: 'K', // 10
                c6: 'Q', // 9
                H1: 'R', // 5
                B1: 'N', // 3
                E8: 'k', // 10
                E5: 'p', // 1
                D5: 'b', // 3
            },
        })
        game.printToConsole()

        expect(game.board.calculateScore()).to.be.equal(130)
    })
    it('Only piece values for new game', function () {
        const game = new Game()

        expect(game.board.getIngamePiecesValue()).to.be.equal(98)
    })
})

describe('Should properly calculate score by pieces locations', function () {
    before(function () {
        this.multiplier = 0.5
    })

    it('for pawns', function () {
        const game = new Game({
            pieces: {
                A2: 'P', // 0.5
                C7: 'P', // 5
                H3: 'P', // 0.5
                D2: 'P', // -2
                A6: 'p', // -0.5
                E3: 'p', // -3
            },
        })

        expect(game.board.calculateScoreByPiecesLocation()).to.be.equal(0.5 * this.multiplier)
    })
})

describe('Should properly calculate check', function () {
    it('when Rook is attacking from left', function () {
        const game = new Game({
            turn: 'black',
            pieces: {
                E1: 'K',
                C8: 'R',
                E8: 'k',
            },
        })

        // eslint-disable-next-line no-unused-expressions
        expect(game.exportJson().check).to.be.true
    })
    it('when Rook is attacking from right', function () {
        const game = new Game({
            turn: 'black',
            pieces: {
                E1: 'K',
                H8: 'R',
                E8: 'k',
            },
        })

        // eslint-disable-next-line no-unused-expressions
        expect(game.exportJson().check).to.be.true
    })
    it('when Queen is attacking from bottom', function () {
        const game = new Game({
            turn: 'black',
            pieces: {
                E1: 'K',
                E4: 'Q',
                E8: 'k',
            },
        })

        // eslint-disable-next-line no-unused-expressions
        expect(game.exportJson().check).to.be.true
    })
    it('when Bishop is attacking from left down', function () {
        const game = new Game({
            turn: 'black',
            pieces: {
                E1: 'K',
                C6: 'B',
                E8: 'k',
            },
        })

        // eslint-disable-next-line no-unused-expressions
        expect(game.exportJson().check).to.be.true
    })
    it('when Queen is attacking from right down', function () {
        const game = new Game({
            turn: 'black',
            pieces: {
                E1: 'K',
                G6: 'Q',
                E8: 'k',
            },
        })

        // eslint-disable-next-line no-unused-expressions
        expect(game.exportJson().check).to.be.true
    })
    it('when and opponent is in check', function () {
        const game = new Game({
            turn: 'white',
            pieces: {
                E1: 'K',
                G6: 'Q',
                E8: 'k',
            },
        })

        // eslint-disable-next-line no-unused-expressions
        expect(game.exportJson().check).to.be.false
        // eslint-disable-next-line no-unused-expressions
        expect(game.board.isAttackingKing()).to.be.true
    })
    it('when Bishop is blocked by pawn', function () {
        const game = new Game({
            turn: 'black',
            pieces: {
                E1: 'K',
                C6: 'B',
                D7: 'p',
                E8: 'k',
            },
        })

        // eslint-disable-next-line no-unused-expressions
        expect(game.exportJson().check).to.be.false
    })
    it('when Pawn is attacking from left', function () {
        const game = new Game({
            turn: 'black',
            pieces: {
                E1: 'K',
                D7: 'P',
                E8: 'k',
            },
        })

        // eslint-disable-next-line no-unused-expressions
        expect(game.exportJson().check).to.be.true
        // eslint-disable-next-line no-unused-expressions
        expect(game.board.isAttackingKing(COLORS.BLACK)).to.be.false
    })
    it('when Pawn is attacking from right', function () {
        const game = new Game({
            turn: 'white',
            pieces: {
                E1: 'K',
                F2: 'p',
                E8: 'k',
            },
        })

        // eslint-disable-next-line no-unused-expressions
        expect(game.exportJson().check).to.be.true
        // eslint-disable-next-line no-unused-expressions
        expect(game.board.isAttackingKing(COLORS.BLACK)).to.be.true
    })
    it('when Knight is attacking from left', function () {
        const game = new Game({
            turn: 'white',
            pieces: {
                E1: 'K',
                C2: 'n',
                E8: 'k',
            },
        })

        // eslint-disable-next-line no-unused-expressions
        expect(game.exportJson().check).to.be.true
        // eslint-disable-next-line no-unused-expressions
        expect(game.board.isAttackingKing(COLORS.BLACK)).to.be.true
    })
    it('when Knight was attacking from left', function () {
        const game = new Game({
            turn: 'white',
            pieces: {
                E1: 'K',
                C2: 'n',
                E8: 'k',
            },
        })

        // eslint-disable-next-line no-unused-expressions
        expect(game.exportJson().check).to.be.true
        // eslint-disable-next-line no-unused-expressions
        expect(game.board.isAttackingKing(COLORS.BLACK)).to.be.true

        game.move('e1', 'e2')

        // eslint-disable-next-line no-unused-expressions
        expect(game.exportJson().check).to.be.false
        // eslint-disable-next-line no-unused-expressions
        expect(game.board.isAttackingKing(COLORS.BLACK)).to.be.false
    })
    it('when Knight is attacking from left up', function () {
        const game = new Game({
            turn: 'white',
            pieces: {
                E1: 'K',
                D3: 'n',
                E8: 'k',
            },
        })

        // eslint-disable-next-line no-unused-expressions
        expect(game.exportJson().check).to.be.true
        // eslint-disable-next-line no-unused-expressions
        expect(game.board.isAttackingKing(COLORS.BLACK)).to.be.true
    })
    it('when Knight is attacking from right up', function () {
        const game = new Game({
            turn: 'white',
            pieces: {
                E1: 'K',
                F3: 'n',
                E8: 'k',
            },
        })

        // eslint-disable-next-line no-unused-expressions
        expect(game.exportJson().check).to.be.true
        // eslint-disable-next-line no-unused-expressions
        expect(game.board.isAttackingKing(COLORS.BLACK)).to.be.true
    })
    it('when Knight is attacking from right', function () {
        const game = new Game({
            turn: 'white',
            pieces: {
                E1: 'K',
                G2: 'n',
                E8: 'k',
            },
        })

        // eslint-disable-next-line no-unused-expressions
        expect(game.exportJson().check).to.be.true
        // eslint-disable-next-line no-unused-expressions
        expect(game.board.isAttackingKing(COLORS.BLACK)).to.be.true
    })
})
