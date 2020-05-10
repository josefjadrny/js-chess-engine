import chai from 'chai'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
const __filename = fileURLToPath(import.meta.url) // eslint-disable-line
const __dirname = path.dirname(__filename);
import { Game } from '../lib/js-chess-engine.mjs'

const expect = chai.expect

describe('Should properly calculate BEST AI move for 4 future moves', function () {
    before(function() {
        this.aiLevel = 2
    });

    it('Black should move with pawn E7 to E5', function () {
        const boardConfiguration = JSON.parse(fs.readFileSync(path.resolve(__dirname, './boards/pawn_e7e5.json')))
        const game = new Game(boardConfiguration)
        game.printToConsole()
        expect(game.board.calculateAiMove(this.aiLevel)).to.deep.include({from: 'E7', to: 'E5'})
    })
})
