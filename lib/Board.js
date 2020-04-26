import { COLUMNS, ROWS, COLORS } from './const/board.js'
import Field from './Field.js'
import Player from './Player.js'

export default class Board {
    constructor () {
        this.playerWhite = new Player(COLORS.WHITE, this)
        this.playerBlack = new Player(COLORS.BLACK, this)
        this.playingPlayer = this.playerWhite
        this.isFinished = false
        this.checkMate = false
        this.init()
    }

    recalculate () {
        this.playerWhite.moves = this.calculateMoves(this.playerWhite)
        this.playerBlack.moves = this.calculateMoves(this.playerBlack)
        const reamingMoves = Object.keys(this.playingPlayer.moves).length
        this.isFinished = reamingMoves === 0
        this.checkMate = reamingMoves === 0 && this.hasPlayingPlayerCheck()
        return this
    }

    calculateMoves (player) {
        const moves = {}
        const playerAllMoves = player.getMoves()
        const boardJson = this.exportJson()
        for (const from in playerAllMoves) {
            playerAllMoves[from].map(to => {
                const testBoard = new Board().createFromJson(boardJson)
                testBoard.move(from, to, true)
                if (
                    (player.color === COLORS.WHITE && testBoard.playerWhite.king.field && !testBoard.hasWhitePlayerCheck()) ||
                    (player.color === COLORS.BLACK && testBoard.playerBlack.king.field && !testBoard.hasBlackPlayerCheck())
                ) {
                    if (!moves[from]) {
                        moves[from] = []
                    }
                    moves[from].push(to)
                }
            })
        }
        if (this.isLeftCastlingPossible(player)) {
            moves[player.king.field.location].push(player.king.field.left(player.color).left(player.color).location)
        }
        if (this.isRightCastlingPossible(player)) {
            moves[player.king.field.location].push(player.king.field.right(player.color).right(player.color).location)
        }
        return moves
    }

    isLeftCastlingPossible (player) {
        if (player.king.moved) return false
        let field = player.king.field
        field = field.left(player.color)
        if (!field.isEmpty() || this.getNonPlayingPlayer().getAttackingFields().includes(field.location)) return false
        field = field.left(player.color)
        if (!field.isEmpty() || this.getNonPlayingPlayer().getAttackingFields().includes(field.location)) return false
        field = field.left(player.color)
        if (!field.isEmpty()) return false
        field = field.left(player.color)
        if (field.chessMan && !field.chessMan.moved && field.chessMan.color === this.playingPlayer.color && field.chessMan.constructor.name === 'Rook') {
            return true
        }
        return false
    }

    isRightCastlingPossible (player) {
        if (player.king.moved) return false
        let field = player.king.field
        field = field.right(player.color)
        if (!field.isEmpty() || this.getNonPlayingPlayer().getAttackingFields().includes(field.location)) return false
        field = field.right(player.color)
        if (!field.isEmpty() || this.getNonPlayingPlayer().getAttackingFields().includes(field.location)) return false
        field = field.left(player.color)
        if (field.chessMan && !field.chessMan.moved && field.chessMan.color === this.playingPlayer.color && field.chessMan.constructor.name === 'Rook') {
            return true
        }
        return false
    }

    getNonPlayingPlayer () {
        return this.playingPlayer.color === COLORS.WHITE ? this.playerBlack : this.playerWhite
    }

    hasPlayingPlayerCheck () {
        return this.getNonPlayingPlayer().getAttackingFields().includes(this.playingPlayer.king.field.location)
    }

    hasWhitePlayerCheck () {
        return this.playerBlack.getAttackingFields().includes(this.playerWhite.king.field.location)
    }

    hasBlackPlayerCheck () {
        return this.playerWhite.getAttackingFields().includes(this.playerBlack.king.field.location)
    }

    init () {
        this.board = {}
        let color = COLORS.WHITE
        COLUMNS.map(column => {
            color = color === COLORS.BLACK ? COLORS.WHITE : COLORS.BLACK
            ROWS.map(row => {
                if (!this.board[column]) this.board[column] = {}
                this.board[column][row] = new Field(color, `${column}${row}`)
                color = color === COLORS.BLACK ? COLORS.WHITE : COLORS.BLACK
            })
        })
        COLUMNS.map(column => {
            ROWS.map(row => {
                if (column !== 'A') {
                    this.board[column][row].neighbours.left = this.board[String.fromCharCode(column.charCodeAt(0) - 1)][row]
                }
                if (column !== 'H') {
                    this.board[column][row].neighbours.right = this.board[String.fromCharCode(column.charCodeAt(0) + 1)][row]
                }
                if (row !== '1') {
                    this.board[column][row].neighbours.down = this.board[column][String.fromCharCode(row.charCodeAt(0) - 1)]
                }
                if (row !== '8') {
                    this.board[column][row].neighbours.up = this.board[column][String.fromCharCode(row.charCodeAt(0) + 1)]
                }
            })
        })
    }

    createFromJson (jsonConfig = {}) {
        for (let location in jsonConfig.pieces) {
            const chessmanType = jsonConfig.pieces[location]
            location = location.toUpperCase()
            switch (chessmanType) {
            case 'K': this.playerWhite.addKing(location); break
            case 'Q': this.playerWhite.addQueen(location); break
            case 'R': this.playerWhite.addRook(location); break
            case 'B': this.playerWhite.addBishop(location); break
            case 'N': this.playerWhite.addKnight(location); break
            case 'P': this.playerWhite.addPawn(location); break
            case 'k': this.playerBlack.addKing(location); break
            case 'q': this.playerBlack.addQueen(location); break
            case 'r': this.playerBlack.addRook(location); break
            case 'b': this.playerBlack.addBishop(location); break
            case 'n': this.playerBlack.addKnight(location); break
            case 'p': this.playerBlack.addPawn(location); break
            }
        }
        if (jsonConfig.turn === this.playerWhite.color) {
            this.playingPlayer = this.playerWhite
        } else if (jsonConfig.turn === this.playerBlack.color) {
            this.playingPlayer = this.playerBlack
        }
        return this
    }

    exportJson () {
        const jsonConfig = { pieces: {} }
        this.playerWhite.chessMen.map(chessman => {
            if (chessman.field) {
                Object.assign(jsonConfig.pieces, {
                    [chessman.field.location]: chessman.getAlias()
                })
            }
        })
        this.playerBlack.chessMen.map(chessman => {
            if (chessman.field) {
                Object.assign(jsonConfig.pieces, {
                    [chessman.field.location]: chessman.getAlias()
                })
            }
        })

        Object.assign(jsonConfig,
            { turn: this.playingPlayer.color },
            { moves: this.playingPlayer.moves },
            { isFinished: this.isFinished },
            { checkMate: this.checkMate }
        )
        return jsonConfig
    }

    move (from, to, testMove = false) {
        const fieldFrom = this.board[from[0]][from[1]]
        const fieldTo = this.board[to[0]][to[1]]
        if (!fieldFrom.chessMan) {
            throw new Error(`There is no piece at ${from}`)
        }
        const chessmanFrom = fieldFrom.chessMan
        const chessmanTo = fieldTo.chessMan
        if (chessmanTo) {
            chessmanTo.field = null
        }
        chessmanFrom.field = fieldTo
        fieldFrom.chessMan = null
        fieldTo.chessMan = chessmanFrom
        chessmanFrom.moved = true

        if (chessmanFrom.isKing()) {
            if (from === 'E1' && to === 'C1') return this.move('A1', 'D1')
            if (from === 'E8' && to === 'C8') return this.move('A8', 'D8')
            if (from === 'E1' && to === 'G1') return this.move('H1', 'F1')
            if (from === 'E8' && to === 'G8') return this.move('H8', 'F8')
        }

        if (!testMove) {
            this.playingPlayer = this.getNonPlayingPlayer()
            this.recalculate()
        }
    }

    addChessman (chessman, location) {
        if (!this.isLocationValid(location)) {
            throw new Error(`Invalid location ${location}`)
        }
        const field = this.board[location[0]][location[1]]
        field.setField(chessman)
    }

    getChessman (location) {
        if (!this.isLocationValid(location)) {
            throw new Error(`Invalid location ${location}`)
        }
        const field = this.board[location[0]][location[1]]
        return field.chessMan || null
    }

    isLocationValid (location) {
        return location.match('^[a-hA-H]{1}[1-8]{1}$')
    }

    print () {
        process.stdout.write('\n')
        Object.assign([], ROWS).reverse().map(row => {
            process.stdout.write(`${row}`)
            COLUMNS.map(column => {
                process.stdout.write(this.board[column][row].getUnicode())
            })
            process.stdout.write('\n')
        })
        process.stdout.write(' ')
        COLUMNS.map(column => {
            process.stdout.write(`${column}`)
        })
        process.stdout.write('\n')
    }
}
