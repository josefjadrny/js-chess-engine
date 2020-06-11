import { King, Queen, Rook, Bishop, Knight, Pawn } from './chessmen/index.mjs'
import { COLORS } from './const/board.mjs'

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

        if (this.isLeftCastlingPossible()) {
            moves[this.king.field.location].push(this.king.field.left().left().location)
        }
        if (this.isRightCastlingPossible()) {
            moves[this.king.field.location].push(this.king.field.right().right().location)
        }
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

    isLeftCastlingPossible () {
        if (this.color === COLORS.WHITE && !this.board.castlings.whiteLong) return false
        if (this.color === COLORS.BLACK && !this.board.castlings.blackLong) return false
        let field = this.king.field
        field = field.left()
        if (!field || !field.isEmpty() || this.board.getPlayerEnemyByColor(this.color).getAttackingFields().includes(field.location)) return false
        field = field.left()
        if (!field || !field.isEmpty() || this.board.getPlayerEnemyByColor(this.color).getAttackingFields().includes(field.location)) return false
        field = field.left()
        if (!field || !field.isEmpty()) return false
        field = field.left()
        if (field && field.chessMan && field.chessMan.color === this.color && field.chessMan.isRook()) {
            return true
        }
        return false
    }

    isRightCastlingPossible () {
        if (this.color === COLORS.WHITE && !this.board.castlings.whiteShort) return false
        if (this.color === COLORS.BLACK && !this.board.castlings.blackShort) return false
        let field = this.king.field
        field = field.right()
        if (!field || !field.isEmpty() || this.board.getPlayerEnemyByColor(this.color).getAttackingFields().includes(field.location)) return false
        field = field.right()
        if (!field || !field.isEmpty() || this.board.getPlayerEnemyByColor(this.color).getAttackingFields().includes(field.location)) return false
        field = field.right()
        if (field && field.chessMan && field.chessMan.color === this.color && field.chessMan.isRook()) {
            return true
        }
        return false
    }
}
