import { King, Queen, Rook, Bishop, Knight, Pawn } from './chessmen/index.mjs'

export default class Player {
    constructor (color, board) {
        this.color = color
        this.board = board
        this.chessMen = []
        this.king = null
        this.moves = {}
    }

    getMoves () {
        const moves = {}
        this.chessMen.map(chessman => {
            if (chessman.isInGame()) {
                Object.assign(moves, { [chessman.field.location]: chessman.getMoves() })
            }
        })
        return moves
    }

    getAttackingFields () {
        let attackingFields = []
        this.chessMen.map(chessman => {
            if (chessman.isInGame()) {
                attackingFields = [...attackingFields, ...chessman.getMoves()]
            }
        })
        return attackingFields
    }

    addChessman (chessman, location) {
        this.board.addChessman(chessman, location)
        this.chessMen.push(chessman)
    }

    addKing (location) {
        const king = new King(this.color)
        this.addChessman(king, location)
        this.king = king
    }

    addQueen (location) {
        this.addChessman(new Queen(this.color), location)
    }

    addRook (location) {
        this.addChessman(new Rook(this.color), location)
    }

    addBishop (location) {
        this.addChessman(new Bishop(this.color), location)
    }

    addKnight (location) {
        this.addChessman(new Knight(this.color), location)
    }

    addPawn (location) {
        this.addChessman(new Pawn(this.color), location)
    }

    addPawns (locations = []) {
        locations.map(location => {
            this.addPawn(location)
        })
    }
}
