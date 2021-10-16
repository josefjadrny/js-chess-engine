import {
    AI_LEVELS,
    AI_DEPTH_BY_LEVEL,
    COLORS,
    NEW_GAME_BOARD_CONFIG,
    NEW_GAME_SETTINGS,
    down,
    downByColor,
    downLeft,
    downLeftByColor,
    downLeftDown,
    downLeftLeft,
    downRight,
    downRightByColor,
    downRightDown,
    downRightRight,
    left,
    right,
    scoreByPosition,
    up,
    upByColor,
    upLeft,
    upLeftByColor,
    upLeftLeft,
    upLeftUp,
    upRight,
    upRightByColor,
    upRightRight,
    upRightUp,
} from './const/board.mjs'

import { getPieceValue, getJSONfromFEN, isPieceValid, isLocationValid } from './utils.mjs'

const SCORE = {
    MIN: -1000,
    MAX: 1000,
}

const PIECE_VALUE_MULTIPLIER = 10

export default class Board {
    constructor (configuration = JSON.parse(JSON.stringify(NEW_GAME_BOARD_CONFIG))) {
        if (typeof configuration === 'object') {
            this.configuration = Object.assign({}, NEW_GAME_SETTINGS, configuration)
        } else if (typeof configuration === 'string') {
            this.configuration = Object.assign({}, NEW_GAME_SETTINGS, getJSONfromFEN(configuration))
        } else {
            throw new Error(`Unknown configuration type ${typeof config}.`)
        }
        if (!this.configuration.castling) {
            this.configuration.castling = {
                whiteShort: true,
                blackShort: true,
                whiteLong: true,
                blackLong: true,
            }
        }
        this.history = []
    }

    getAttackingFields (color = this.getPlayingColor()) {
        let attackingFields = []
        for (const location in this.configuration.pieces) {
            const piece = this.getPiece(location)
            if (this.getPieceColor(piece) === color) {
                attackingFields = [...attackingFields, ...this.getPieceMoves(piece, location)]
            }
        }
        return attackingFields
    }

    isAttackingKing (color = this.getPlayingColor()) {
        let kingLocation = null
        for (const location in this.configuration.pieces) {
            const piece = this.getPiece(location)
            if (this.isKing(piece) && this.getPieceColor(piece) !== color) {
                kingLocation = location
                break
            }
        }

        return this.isPieceUnderAttack(kingLocation)
    }

    isPieceUnderAttack (pieceLocation) {
        const playerColor = this.getPieceOnLocationColor(pieceLocation)
        const enemyColor = this.getEnemyColor(playerColor)
        let isUnderAttack = false

        let field = pieceLocation
        let distance = 0
        while (up(field) && !isUnderAttack) {
            field = up(field)
            distance++
            const piece = this.getPiece(field)
            if (piece && this.getPieceColor(piece) === enemyColor &&
                (this.isRook(piece) || this.isQueen(piece) || (this.isKing(piece) && distance === 1))) {
                isUnderAttack = true
            }
            if (piece) break
        }

        field = pieceLocation
        distance = 0
        while (down(field) && !isUnderAttack) {
            field = down(field)
            distance++
            const piece = this.getPiece(field)
            if (piece && this.getPieceColor(piece) === enemyColor &&
                (this.isRook(piece) || this.isQueen(piece) || (this.isKing(piece) && distance === 1))) {
                isUnderAttack = true
            }
            if (piece) break
        }

        field = pieceLocation
        distance = 0
        while (left(field) && !isUnderAttack) {
            field = left(field)
            distance++
            const piece = this.getPiece(field)
            if (piece && this.getPieceColor(piece) === enemyColor &&
                (this.isRook(piece) || this.isQueen(piece) || (this.isKing(piece) && distance === 1))) {
                isUnderAttack = true
            }
            if (piece) break
        }

        field = pieceLocation
        distance = 0
        while (right(field) && !isUnderAttack) {
            field = right(field)
            distance++
            const piece = this.getPiece(field)
            if (piece && this.getPieceColor(piece) === enemyColor &&
                (this.isRook(piece) || this.isQueen(piece) || (this.isKing(piece) && distance === 1))) {
                isUnderAttack = true
            }
            if (piece) break
        }

        field = pieceLocation
        distance = 0
        while (upRightByColor(field, playerColor) && !isUnderAttack) {
            field = upRightByColor(field, playerColor)
            distance++
            const piece = this.getPiece(field)
            if (piece && this.getPieceColor(piece) === enemyColor &&
                (this.isBishop(piece) || this.isQueen(piece) || (distance === 1 && (this.isKing(piece) || this.isPawn(piece))))) {
                isUnderAttack = true
            }
            if (piece) break
        }

        field = pieceLocation
        distance = 0
        while (upLeftByColor(field, playerColor) && !isUnderAttack) {
            field = upLeftByColor(field, playerColor)
            distance++
            const piece = this.getPiece(field)
            if (piece && this.getPieceColor(piece) === enemyColor &&
                (this.isBishop(piece) || this.isQueen(piece) || (distance === 1 && (this.isKing(piece) || this.isPawn(piece))))) {
                isUnderAttack = true
            }
            if (piece) break
        }

        field = pieceLocation
        distance = 0
        while (downRightByColor(field, playerColor) && !isUnderAttack) {
            field = downRightByColor(field, playerColor)
            distance++
            const piece = this.getPiece(field)
            if (piece && this.getPieceColor(piece) === enemyColor &&
                (this.isBishop(piece) || this.isQueen(piece) || (this.isKing(piece) && distance === 1))) {
                isUnderAttack = true
            }
            if (piece) break
        }

        field = pieceLocation
        distance = 0
        while (downLeftByColor(field, playerColor) && !isUnderAttack) {
            field = downLeftByColor(field, playerColor)
            distance++
            const piece = this.getPiece(field)
            if (piece && this.getPieceColor(piece) === enemyColor &&
                (this.isBishop(piece) || this.isQueen(piece) || (this.isKing(piece) && distance === 1))) {
                isUnderAttack = true
            }
            if (piece) break
        }

        field = upRightUp(pieceLocation)
        let piece = this.getPiece(field)
        if (piece && this.getPieceColor(piece) === enemyColor && this.isKnight(piece)) {
            isUnderAttack = true
        }
        field = upRightRight(pieceLocation)
        piece = this.getPiece(field)
        if (piece && this.getPieceColor(piece) === enemyColor && this.isKnight(piece)) {
            isUnderAttack = true
        }
        field = upLeftLeft(pieceLocation)
        piece = this.getPiece(field)
        if (piece && this.getPieceColor(piece) === enemyColor && this.isKnight(piece)) {
            isUnderAttack = true
        }
        field = upLeftUp(pieceLocation)
        piece = this.getPiece(field)
        if (piece && this.getPieceColor(piece) === enemyColor && this.isKnight(piece)) {
            isUnderAttack = true
        }
        field = downLeftDown(pieceLocation)
        piece = this.getPiece(field)
        if (piece && this.getPieceColor(piece) === enemyColor && this.isKnight(piece)) {
            isUnderAttack = true
        }
        field = downLeftLeft(pieceLocation)
        piece = this.getPiece(field)
        if (piece && this.getPieceColor(piece) === enemyColor && this.isKnight(piece)) {
            isUnderAttack = true
        }
        field = downRightDown(pieceLocation)
        piece = this.getPiece(field)
        if (piece && this.getPieceColor(piece) === enemyColor && this.isKnight(piece)) {
            isUnderAttack = true
        }
        field = downRightRight(pieceLocation)
        piece = this.getPiece(field)
        if (piece && this.getPieceColor(piece) === enemyColor && this.isKnight(piece)) {
            isUnderAttack = true
        }

        return isUnderAttack
    }

    hasPlayingPlayerCheck () {
        return this.isAttackingKing(this.getNonPlayingColor())
    }

    hasNonPlayingPlayerCheck () {
        return this.isAttackingKing(this.getPlayingColor())
    }

    getLowestValuePieceAttackingLocation (location, color = this.getPlayingColor()) {
        let pieceValue = null
        for (const field in this.configuration.pieces) {
            const piece = this.getPiece(field)
            if (this.getPieceColor(piece) === color) {
                this.getPieceMoves(piece, field).map(attackingLocation => {
                    if (attackingLocation === location && (pieceValue === null || getPieceValue(piece) < pieceValue)) {
                        pieceValue = getPieceValue(piece)
                    }
                })
            }
        }
        return pieceValue
    }

    getMoves (color = this.getPlayingColor(), movablePiecesRequiredToSkipTest = null) {
        const allMoves = {}
        let movablePiecesCount = 0
        for (const location in this.configuration.pieces) {
            const piece = this.getPiece(location)
            if (this.getPieceColor(piece) === color) {
                const moves = this.getPieceMoves(piece, location)
                if (moves.length) {
                    movablePiecesCount++
                }
                Object.assign(allMoves, { [location]: moves })
            }
        }

        const enemyAttackingFields = this.getAttackingFields(this.getNonPlayingColor())
        if (this.isLeftCastlingPossible(enemyAttackingFields)) {
            if (this.isPlayingWhite()) allMoves.E1.push('C1')
            if (this.isPlayingBlack()) allMoves.E8.push('C8')
        }
        if (this.isRightCastlingPossible(enemyAttackingFields)) {
            if (this.isPlayingWhite()) allMoves.E1.push('G1')
            if (this.isPlayingBlack()) allMoves.E8.push('G8')
        }

        if (movablePiecesRequiredToSkipTest && movablePiecesCount > movablePiecesRequiredToSkipTest) return allMoves

        const moves = {}
        for (const from in allMoves) {
            allMoves[from].map(to => {
                const testConfiguration = {
                    pieces: Object.assign({}, this.configuration.pieces),
                    castling: Object.assign({}, this.configuration.castling),
                }
                const testBoard = new Board(testConfiguration)
                testBoard.move(from, to)
                if (
                    (this.isPlayingWhite() && !testBoard.isAttackingKing(COLORS.BLACK)) ||
                    (this.isPlayingBlack() && !testBoard.isAttackingKing(COLORS.WHITE))
                ) {
                    if (!moves[from]) {
                        moves[from] = []
                    }
                    moves[from].push(to)
                }
            })
        }

        if (!Object.keys(moves).length) {
            this.configuration.isFinished = true
            if (this.hasPlayingPlayerCheck()) {
                this.configuration.checkMate = true
            }
        }

        return moves
    }

    isLeftCastlingPossible (enemyAttackingFields) {
        if (this.isPlayingWhite() && !this.configuration.castling.whiteLong) return false
        if (this.isPlayingBlack() && !this.configuration.castling.blackLong) return false

        let kingLocation = null
        if (this.isPlayingWhite() && this.getPiece('E1') === 'K' && this.getPiece('A1') === 'R' && !enemyAttackingFields.includes('E1')) {
            kingLocation = 'E1'
        } else if (this.isPlayingBlack() && this.getPiece('E8') === 'k' && this.getPiece('A8') === 'r' && !enemyAttackingFields.includes('E8')) {
            kingLocation = 'E8'
        }
        if (!kingLocation) return false
        let field = left(kingLocation)
        if (this.getPiece(field) || enemyAttackingFields.includes(field)) return false
        field = left(field)
        if (this.getPiece(field) || enemyAttackingFields.includes(field)) return false
        field = left(field)
        if (this.getPiece(field)) return false

        return true
    }

    isRightCastlingPossible (enemyAttackingFields) {
        if (this.isPlayingWhite() && !this.configuration.castling.whiteShort) return false
        if (this.isPlayingBlack() && !this.configuration.castling.blackShort) return false

        let kingLocation = null
        if (this.isPlayingWhite() && this.getPiece('E1') === 'K' && this.getPiece('H1') === 'R' && !enemyAttackingFields.includes('E1')) {
            kingLocation = 'E1'
        } else if (this.isPlayingBlack() && this.getPiece('E8') === 'k' && this.getPiece('H8') === 'r' && !enemyAttackingFields.includes('E8')) {
            kingLocation = 'E8'
        }
        if (!kingLocation) return false

        let field = right(kingLocation)
        if (this.getPiece(field) || enemyAttackingFields.includes(field)) return false
        field = right(field)
        if (this.getPiece(field) || enemyAttackingFields.includes(field)) return false

        return true
    }

    getPieceMoves (piece, location) {
        if (this.isPawn(piece)) return this.getPawnMoves(piece, location)
        if (this.isKnight(piece)) return this.getKnightMoves(piece, location)
        if (this.isRook(piece)) return this.getRookMoves(piece, location)
        if (this.isBishop(piece)) return this.getBishopMoves(piece, location)
        if (this.isQueen(piece)) return this.getQueenMoves(piece, location)
        if (this.isKing(piece)) return this.getKingMoves(piece, location)
        return []
    }

    isPawn (piece) {
        return piece.toUpperCase() === 'P'
    }

    isKnight (piece) {
        return piece.toUpperCase() === 'N'
    }

    isRook (piece) {
        return piece.toUpperCase() === 'R'
    }

    isBishop (piece) {
        return piece.toUpperCase() === 'B'
    }

    isQueen (piece) {
        return piece.toUpperCase() === 'Q'
    }

    isKing (piece) {
        return piece.toUpperCase() === 'K'
    }

    getPawnMoves (piece, location) {
        const moves = []
        const color = this.getPieceColor(piece)
        let move = upByColor(location, color)

        if (move && !this.getPiece(move)) {
            moves.push(move)
            move = upByColor(move, color)
            if (isInStartLine(color, location) && move && !this.getPiece(move)) {
                moves.push(move)
            }
        }

        move = upLeftByColor(location, color)
        if (move && ((this.getPiece(move) && this.getPieceOnLocationColor(move) !== color) || (move === this.configuration.enPassant))) {
            moves.push(move)
        }

        move = upRightByColor(location, color)
        if (move && ((this.getPiece(move) && this.getPieceOnLocationColor(move) !== color) || (move === this.configuration.enPassant))) {
            moves.push(move)
        }

        function isInStartLine (color, location) {
            if (color === COLORS.WHITE && location[1] === '2') {
                return true
            }
            if (color === COLORS.BLACK && location[1] === '7') {
                return true
            }
            return false
        }

        return moves
    }

    getKnightMoves (piece, location) {
        const moves = []
        const color = this.getPieceColor(piece)

        let field = upRightUp(location)
        if (field && this.getPieceOnLocationColor(field) !== color) {
            moves.push(field)
        }

        field = upRightRight(location)
        if (field && this.getPieceOnLocationColor(field) !== color) {
            moves.push(field)
        }

        field = upLeftUp(location)
        if (field && this.getPieceOnLocationColor(field) !== color) {
            moves.push(field)
        }

        field = upLeftLeft(location)
        if (field && this.getPieceOnLocationColor(field) !== color) {
            moves.push(field)
        }

        field = downLeftLeft(location)
        if (field && this.getPieceOnLocationColor(field) !== color) {
            moves.push(field)
        }

        field = downLeftDown(location)
        if (field && this.getPieceOnLocationColor(field) !== color) {
            moves.push(field)
        }

        field = downRightRight(location)
        if (field && this.getPieceOnLocationColor(field) !== color) {
            moves.push(field)
        }

        field = downRightDown(location)
        if (field && this.getPieceOnLocationColor(field) !== color) {
            moves.push(field)
        }

        return moves
    }

    getRookMoves (piece, location) {
        const moves = []
        const color = this.getPieceColor(piece)

        let field = location
        while (up(field)) {
            field = up(field)
            const pieceOnFieldColor = this.getPieceOnLocationColor(field)
            if (this.getPieceOnLocationColor(field) !== color) {
                moves.push(field)
            }
            if (pieceOnFieldColor) break
        }

        field = location
        while (down(field)) {
            field = down(field)
            const pieceOnFieldColor = this.getPieceOnLocationColor(field)
            if (this.getPieceOnLocationColor(field) !== color) {
                moves.push(field)
            }
            if (pieceOnFieldColor) break
        }

        field = location
        while (right(field)) {
            field = right(field)
            const pieceOnFieldColor = this.getPieceOnLocationColor(field)
            if (this.getPieceOnLocationColor(field) !== color) {
                moves.push(field)
            }
            if (pieceOnFieldColor) break
        }

        field = location
        while (left(field)) {
            field = left(field)
            const pieceOnFieldColor = this.getPieceOnLocationColor(field)
            if (this.getPieceOnLocationColor(field) !== color) {
                moves.push(field)
            }
            if (pieceOnFieldColor) break
        }

        return moves
    }

    getBishopMoves (piece, location) {
        const moves = []
        const color = this.getPieceColor(piece)

        let field = location
        while (upLeft(field)) {
            field = upLeft(field)
            const pieceOnFieldColor = this.getPieceOnLocationColor(field)
            if (this.getPieceOnLocationColor(field) !== color) {
                moves.push(field)
            }
            if (pieceOnFieldColor) break
        }

        field = location
        while (upRight(field)) {
            field = upRight(field)
            const pieceOnFieldColor = this.getPieceOnLocationColor(field)
            if (this.getPieceOnLocationColor(field) !== color) {
                moves.push(field)
            }
            if (pieceOnFieldColor) break
        }

        field = location
        while (downLeft(field)) {
            field = downLeft(field)
            const pieceOnFieldColor = this.getPieceOnLocationColor(field)
            if (this.getPieceOnLocationColor(field) !== color) {
                moves.push(field)
            }
            if (pieceOnFieldColor) break
        }

        field = location
        while (downRight(field)) {
            field = downRight(field)
            const pieceOnFieldColor = this.getPieceOnLocationColor(field)
            if (this.getPieceOnLocationColor(field) !== color) {
                moves.push(field)
            }
            if (pieceOnFieldColor) break
        }

        return moves
    }

    getQueenMoves (piece, location) {
        const moves = [
            ...this.getRookMoves(piece, location),
            ...this.getBishopMoves(piece, location),
        ]
        return moves
    }

    getKingMoves (piece, location) {
        const moves = []
        const color = this.getPieceColor(piece)

        let field = location
        field = up(field)
        if (field && this.getPieceOnLocationColor(field) !== color) {
            moves.push(field)
        }

        field = location
        field = right(field)
        if (field && this.getPieceOnLocationColor(field) !== color) {
            moves.push(field)
        }

        field = location
        field = down(field)
        if (field && this.getPieceOnLocationColor(field) !== color) {
            moves.push(field)
        }

        field = location
        field = left(field)
        if (field && this.getPieceOnLocationColor(field) !== color) {
            moves.push(field)
        }

        field = location
        field = upLeft(field)
        if (field && this.getPieceOnLocationColor(field) !== color) {
            moves.push(field)
        }

        field = location
        field = upRight(field)
        if (field && this.getPieceOnLocationColor(field) !== color) {
            moves.push(field)
        }

        field = location
        field = downLeft(field)
        if (field && this.getPieceOnLocationColor(field) !== color) {
            moves.push(field)
        }

        field = location
        field = downRight(field)
        if (field && this.getPieceOnLocationColor(field) !== color) {
            moves.push(field)
        }

        return moves
    }

    getPieceColor (piece) {
        if (piece.toUpperCase() === piece) return COLORS.WHITE
        return COLORS.BLACK
    }

    getPieceOnLocationColor (location) {
        const piece = this.getPiece(location)
        if (!piece) return null
        if (piece.toUpperCase() === piece) return COLORS.WHITE
        return COLORS.BLACK
    }

    getPiece (location) {
        return this.configuration.pieces[location]
    }

    setPiece (location, piece) {
        if (!isPieceValid(piece)) {
            throw new Error(`Invalid piece ${piece}`)
        }

        if (!isLocationValid(location)) {
            throw new Error(`Invalid location ${location}`)
        }

        this.configuration.pieces[location.toUpperCase()] = piece
    }

    removePiece (location) {
        if (!isLocationValid(location)) {
            throw new Error(`Invalid location ${location}`)
        }

        delete this.configuration.pieces[location.toUpperCase()]
    }

    isEmpty (location) {
        if (!isLocationValid(location)) {
            throw new Error(`Invalid location ${location}`)
        }

        return !this.configuration.pieces[location.toUpperCase()]
    }

    getEnemyColor (playerColor) {
        return playerColor === COLORS.WHITE ? COLORS.BLACK : COLORS.WHITE
    }

    getPlayingColor () {
        return this.configuration.turn
    }

    getNonPlayingColor () {
        return this.isPlayingWhite() ? COLORS.BLACK : COLORS.WHITE
    }

    isPlayingWhite () {
        return this.configuration.turn === COLORS.WHITE
    }

    isPlayingBlack () {
        return this.configuration.turn === COLORS.BLACK
    }

    addMoveToHistory (from, to) {
        this.history.push({ from, to, configuration: JSON.parse(JSON.stringify(this.configuration)) })
    }

    move (from, to) {
        // Move logic
        const chessmanFrom = this.getPiece(from)
        const chessmanTo = this.getPiece(to)

        if (!chessmanFrom) {
            throw new Error(`There is no piece at ${from}`)
        }

        Object.assign(this.configuration.pieces, { [to]: chessmanFrom })
        delete this.configuration.pieces[from]

        // pawn reaches an end of a chessboard
        if (this.isPlayingWhite() && this.isPawn(chessmanFrom) && to[1] === '8') {
            Object.assign(this.configuration.pieces, { [to]: 'Q' })
        }
        if (this.isPlayingBlack() && this.isPawn(chessmanFrom) && to[1] === '1') {
            Object.assign(this.configuration.pieces, { [to]: 'q' })
        }

        // En passant check
        if (this.isPawn(chessmanFrom) && to === this.configuration.enPassant) {
            delete this.configuration.pieces[downByColor(to, this.getPlayingColor())]
        }

        // pawn En passant special move history
        if (this.isPawn(chessmanFrom) && this.isPlayingWhite() && from[1] === '2' && to[1] === '4') {
            this.configuration.enPassant = `${from[0]}3`
        } else if (this.isPawn(chessmanFrom) && this.isPlayingBlack() && from[1] === '7' && to[1] === '5') {
            this.configuration.enPassant = `${from[0]}6`
        } else {
            this.configuration.enPassant = null
        }

        // Castling - disabling
        if (from === 'E1') {
            Object.assign(this.configuration.castling, { whiteLong: false, whiteShort: false })
        }
        if (from === 'E8') {
            Object.assign(this.configuration.castling, { blackLong: false, blackShort: false })
        }
        if (from === 'A1') {
            Object.assign(this.configuration.castling, { whiteLong: false })
        }
        if (from === 'H1') {
            Object.assign(this.configuration.castling, { whiteShort: false })
        }
        if (from === 'A8') {
            Object.assign(this.configuration.castling, { blackLong: false })
        }
        if (from === 'H8') {
            Object.assign(this.configuration.castling, { blackShort: false })
        }

        // Castling - rook is moving too
        if (this.isKing(chessmanFrom)) {
            if (from === 'E1' && to === 'C1') return this.move('A1', 'D1')
            if (from === 'E8' && to === 'C8') return this.move('A8', 'D8')
            if (from === 'E1' && to === 'G1') return this.move('H1', 'F1')
            if (from === 'E8' && to === 'G8') return this.move('H8', 'F8')
        }

        this.configuration.turn = this.isPlayingWhite() ? COLORS.BLACK : COLORS.WHITE

        if (this.isPlayingWhite()) {
            this.configuration.fullMove++
        }

        this.configuration.halfMove++
        if (chessmanTo || this.isPawn(chessmanFrom)) {
            this.configuration.halfMove = 0
        }
    }

    exportJson () {
        return {
            moves: this.getMoves(),
            pieces: this.configuration.pieces,
            turn: this.configuration.turn,
            isFinished: this.configuration.isFinished,
            check: this.hasPlayingPlayerCheck(),
            checkMate: this.configuration.checkMate,
            castling: this.configuration.castling,
            enPassant: this.configuration.enPassant,
            halfMove: this.configuration.halfMove,
            fullMove: this.configuration.fullMove,
        }
    }

    calculateAiMove (level) {
        const scores = this.calculateAiMoves(level)
        return scores[0]
    }

    calculateAiMoves (level) {
        level = parseInt(level)
        if (!AI_LEVELS.includes(level)) {
            throw new Error(`Invalid level ${level}. You can choose ${AI_LEVELS.join(',')}`)
        }
        if (this.shouldIncreaseLevel()) {
            level++
        }
        const scoreTable = []
        const initialScore = this.calculateScore(this.getPlayingColor())
        const moves = this.getMoves()
        for (const from in moves) {
            moves[from].map(to => {
                const testBoard = this.getTestBoard()
                const wasScoreChanged = Boolean(testBoard.getPiece(to))
                testBoard.move(from, to)
                scoreTable.push({
                    from,
                    to,
                    score: testBoard.testMoveScores(this.getPlayingColor(), level, wasScoreChanged, wasScoreChanged ? testBoard.calculateScore(this.getPlayingColor()) : initialScore, to).score +
                        testBoard.calculateScoreByPiecesLocation(this.getPlayingColor()) +
                        (Math.floor(Math.random() * (this.configuration.halfMove > 10 ? this.configuration.halfMove - 10 : 1) * 10) / 10),
                })
            })
        }

        scoreTable.sort((previous, next) => {
            return previous.score < next.score ? 1 : previous.score > next.score ? -1 : 0
        })
        return scoreTable
    }

    shouldIncreaseLevel () {
        return this.getIngamePiecesValue() < 50
    }

    getIngamePiecesValue () {
        let scoreIndex = 0
        for (const location in this.configuration.pieces) {
            const piece = this.getPiece(location)
            scoreIndex += getPieceValue(piece)
        }
        return scoreIndex
    }

    getTestBoard () {
        const testConfiguration = {
            pieces: Object.assign({}, this.configuration.pieces),
            castling: Object.assign({}, this.configuration.castling),
            turn: this.configuration.turn,
            enPassant: this.configuration.enPassant,
        }
        return new Board(testConfiguration)
    }

    testMoveScores (playingPlayerColor, level, capture, initialScore, move, depth = 1) {
        let nextMoves = null
        if (depth < AI_DEPTH_BY_LEVEL.EXTENDED[level] && this.hasPlayingPlayerCheck()) {
            nextMoves = this.getMoves(this.getPlayingColor())
        } else if (depth < AI_DEPTH_BY_LEVEL.BASE[level] || (capture && depth < AI_DEPTH_BY_LEVEL.EXTENDED[level])) {
            nextMoves = this.getMoves(this.getPlayingColor(), 5)
        }

        if (this.configuration.isFinished) {
            return {
                score: this.calculateScore(playingPlayerColor) + (this.getPlayingColor() === playingPlayerColor ? depth : -depth),
                max: true,
            }
        }

        if (!nextMoves) {
            if (initialScore !== null) return { score: initialScore, max: false }
            const score = this.calculateScore(playingPlayerColor)
            return {
                score,
                max: false,
            }
        }

        let bestScore = this.getPlayingColor() === playingPlayerColor ? SCORE.MIN : SCORE.MAX
        let maxValueReached = false
        for (const from in nextMoves) {
            if (maxValueReached) continue
            nextMoves[from].map(to => {
                if (maxValueReached) return
                const testBoard = this.getTestBoard()
                const wasScoreChanged = Boolean(testBoard.getPiece(to))
                testBoard.move(from, to)
                if (testBoard.hasNonPlayingPlayerCheck()) return
                const result = testBoard.testMoveScores(playingPlayerColor, level, wasScoreChanged, wasScoreChanged ? testBoard.calculateScore(playingPlayerColor) : initialScore, to, depth + 1)
                if (result.max) {
                    maxValueReached = true
                }
                if (this.getPlayingColor() === playingPlayerColor) {
                    bestScore = Math.max(bestScore, result.score)
                } else {
                    bestScore = Math.min(bestScore, result.score)
                }
            })
        }

        return { score: bestScore, max: false }
    }

    calculateScoreByPiecesLocation (player = this.getPlayingColor()) {
        const columnMapping = { A: 0, B: 1, C: 2, D: 3, E: 4, F: 5, G: 6, H: 7 }
        const scoreMultiplier = 0.5
        let score = 0
        for (const location in this.configuration.pieces) {
            const piece = this.getPiece(location)
            if (scoreByPosition[piece]) {
                const scoreIndex = scoreByPosition[piece][location[1] - 1][columnMapping[location[0]]]
                score += (this.getPieceColor(piece) === player ? scoreIndex : -scoreIndex) * scoreMultiplier
            }
        }
        return score
    }

    calculateScore (playerColor = this.getPlayingColor()) {
        let scoreIndex = 0

        if (this.configuration.checkMate) {
            if (this.getPlayingColor() === playerColor) {
                return SCORE.MIN
            } else {
                return SCORE.MAX
            }
        }

        if (this.configuration.isFinished) {
            if (this.getPlayingColor() === playerColor) {
                return SCORE.MAX
            } else {
                return SCORE.MIN
            }
        }

        for (const location in this.configuration.pieces) {
            const piece = this.getPiece(location)
            if (this.getPieceColor(piece) === playerColor) {
                scoreIndex += getPieceValue(piece) * PIECE_VALUE_MULTIPLIER
            } else {
                scoreIndex -= getPieceValue(piece) * PIECE_VALUE_MULTIPLIER
            }
        }

        return scoreIndex
    }
}
