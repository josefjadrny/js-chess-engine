import { COLUMNS, ROWS, COLORS, AI_LEVELS } from './const/board.mjs'
import Field from './Field.mjs'
import Player from './Player.mjs'

export default class Board {
    constructor () {
        this.playerWhite = new Player(COLORS.WHITE, this)
        this.playerBlack = new Player(COLORS.BLACK, this)
        this.playingPlayer = this.playerWhite
        this.isFinished = false
        this.checkMate = false
        this.castlings = {
            whiteLong: true,
            whiteShort: true,
            blackLong: true,
            blackShort: true,
        }

        this.init()
    }

    calculateAiMove (level) {
        const scores = this.calculateAiMoves(level)
        return scores[0]
    }

    calculateAiMoves (level) {
        level = parseInt(level)
        if (!AI_LEVELS.includes(level)) {
            throw new Error(`Invalid level ${level}. You can choose ${AI_LEVELS}`)
        }
        const playingPlayerColor = this.playingPlayer.color
        const scores = []
        for (const from in this.playingPlayer.moves) {
            this.playingPlayer.moves[from].map(to => {
                const scoreTable = []
                this.testMoveScores(from, to, playingPlayerColor, level, scoreTable)
                const moveStatus = {
                    from,
                    to,
                    plusScore: scoreTable.reduce((plusScore, score) => { return score > 0 ? plusScore + score : plusScore }),
                    minScore: scoreTable.reduce((minScore, score) => { return score < minScore ? score : minScore }),
                    randomizer: Math.random() / 1000,
                }
                moveStatus.avgPlusScore = moveStatus.plusScore / scoreTable.length
                scores.push(moveStatus)
            })
        }

        scores.sort((previous, next) => {
            if (previous.minScore === next.minScore) {
                return previous.avgPlusScore + previous.randomizer < next.avgPlusScore + next.randomizer ? 0 : -1
            } else {
                return previous.minScore < next.minScore ? 0 : -1
            }
        })

        return scores
    }

    testMoveScores (from, to, playingPlayerColor, level, scoreTable) {
        const boardJson = this.exportJson()
        const testBoard = new Board().createFromJson(boardJson)
        testBoard.move(from, to, false)

        while (level > 0) {
            level--
            testBoard.recalculate()
            for (const fromNested in testBoard.playingPlayer.moves) {
                testBoard.playingPlayer.moves[fromNested].map(toNested => {
                    testBoard.testMoveScores(fromNested, toNested, playingPlayerColor, level, scoreTable)
                })
            }
        }

        if (level === 0) {
            if (this.hasPlayingPlayerCheck() || this.hasNonPlayingPlayerCheck()) {
                testBoard.recalculate()
            }
            scoreTable.push(testBoard.calculateScore(playingPlayerColor))
        }
    }

    calculateScore (playerColor = this.playingPlayer.color) {
        let scoreIndex = 0

        if (this.checkMate) {
            if (this.playingPlayer.color === playerColor) {
                return -50
            } else {
                return 50
            }
        }

        this.getPlayerByColor(playerColor).chessMen.map(chessman => {
            if (chessman.isInGame()) {
                scoreIndex += chessman.getValue()
            }
        })
        this.getPlayerEnemyByColor(playerColor).chessMen.map(chessman => {
            if (chessman.isInGame()) {
                scoreIndex -= chessman.getValue()
            }
        })
        return scoreIndex
    }

    recalculate () {
        this.playingPlayer.moves = this.calculateMoves(this.playingPlayer)
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
                testBoard.move(from, to, false)
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
            moves[player.king.field.location].push(player.king.field.left().left().location)
        }
        if (this.isRightCastlingPossible(player)) {
            moves[player.king.field.location].push(player.king.field.right().right().location)
        }
        return moves
    }

    isLeftCastlingPossible (player) {
        if (player.color === COLORS.WHITE && !this.castlings.whiteLong) return false
        if (player.color === COLORS.BLACK && !this.castlings.blackLong) return false
        let field = player.king.field
        field = field.left()
        if (!field || !field.isEmpty() || this.getNonPlayingPlayer().getAttackingFields().includes(field.location)) return false
        field = field.left()
        if (!field || !field.isEmpty() || this.getNonPlayingPlayer().getAttackingFields().includes(field.location)) return false
        field = field.left()
        if (!field || !field.isEmpty()) return false
        field = field.left()
        if (field && field.chessMan && field.chessMan.color === this.playingPlayer.color && field.chessMan.isRook()) {
            return true
        }
        return false
    }

    isRightCastlingPossible (player) {
        if (player.color === COLORS.WHITE && !this.castlings.whiteShort) return false
        if (player.color === COLORS.BLACK && !this.castlings.blackShort) return false
        let field = player.king.field
        field = field.right()
        if (!field || !field.isEmpty() || this.getNonPlayingPlayer().getAttackingFields().includes(field.location)) return false
        field = field.right()
        if (!field || !field.isEmpty() || this.getNonPlayingPlayer().getAttackingFields().includes(field.location)) return false
        field = field.right()
        if (field && field.chessMan && field.chessMan.color === this.playingPlayer.color && field.chessMan.isRook()) {
            return true
        }
        return false
    }

    getNonPlayingPlayer () {
        return this.playingPlayer.color === COLORS.WHITE ? this.playerBlack : this.playerWhite
    }

    getPlayerByColor (color = COLORS.WHITE) {
        return color === COLORS.WHITE ? this.playerWhite : this.playerBlack
    }

    getPlayerEnemyByColor (color = COLORS.WHITE) {
        return color === COLORS.WHITE ? this.playerBlack : this.playerWhite
    }

    hasPlayingPlayerCheck () {
        return this.getNonPlayingPlayer().getAttackingFields().includes(this.playingPlayer.king.field.location)
    }

    hasNonPlayingPlayerCheck () {
        return this.playingPlayer.getAttackingFields().includes(this.getNonPlayingPlayer().king.field.location)
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

        if (jsonConfig.turn === this.playerBlack.color) {
            this.playingPlayer = this.playerBlack
        } else if (jsonConfig.turn === this.playerWhite.color) {
            this.playingPlayer = this.playerWhite
        }
        if (jsonConfig.castling && typeof jsonConfig.castling === 'object') {
            Object.assign(this.castlings, jsonConfig.castling)
        }
        return this
    }

    exportJson () {
        const jsonConfig = { pieces: {} }
        this.playerWhite.chessMen.map(chessman => {
            if (chessman.isInGame()) {
                Object.assign(jsonConfig.pieces, {
                    [chessman.field.location]: chessman.getAlias(),
                })
            }
        })
        this.playerBlack.chessMen.map(chessman => {
            if (chessman.isInGame()) {
                Object.assign(jsonConfig.pieces, {
                    [chessman.field.location]: chessman.getAlias(),
                })
            }
        })

        Object.assign(jsonConfig,
            { turn: this.playingPlayer.color },
            { moves: this.playingPlayer.moves },
            { isFinished: this.isFinished },
            { checkMate: this.checkMate },
            { castling: this.castlings },
        )
        return jsonConfig
    }

    move (from, to, recalculate = true) {
        // Move logic
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

        // pawn reaches an end of a chessboard
        if (this.playingPlayer.color === COLORS.WHITE && chessmanFrom.isPawn() && to[1] === '8') {
            this.playerWhite.addQueen(to)
        }
        if (this.playingPlayer.color === COLORS.BLACK && chessmanFrom.isPawn() && to[1] === '1') {
            this.playerBlack.addQueen(to)
        }

        // Castling - disabling
        if (from === 'E1') {
            Object.assign(this.castlings, { whiteLong: false, whiteShort: false })
        }
        if (from === 'E8') {
            Object.assign(this.castlings, { blackLong: false, blackShort: false })
        }
        if (from === 'A1') {
            Object.assign(this.castlings, { whiteLong: false })
        }
        if (from === 'H1') {
            Object.assign(this.castlings, { whiteShort: false })
        }
        if (from === 'A8') {
            Object.assign(this.castlings, { blackLong: false })
        }
        if (from === 'H8') {
            Object.assign(this.castlings, { blackShort: false })
        }

        // Castling - rook is moving too
        if (chessmanFrom.isKing()) {
            if (from === 'E1' && to === 'C1') return this.move('A1', 'D1')
            if (from === 'E8' && to === 'C8') return this.move('A8', 'D8')
            if (from === 'E1' && to === 'G1') return this.move('H1', 'F1')
            if (from === 'E8' && to === 'G8') return this.move('H8', 'F8')
        }

        this.playingPlayer = this.getNonPlayingPlayer()

        if (recalculate) {
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
