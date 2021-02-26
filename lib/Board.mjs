import {
    COLORS,
    AI_LEVELS,
    NEW_GAME_BOARD_CONFIG,
    NEW_GAME_SETTINGS,
    up,
    left,
    right,
    down,
    downLeft,
    downRight,
    upLeft,
    upRight,
    upRightRight,
    upRightUp,
    upLeftLeft,
    upLeftUp,
    downLeftDown,
    downLeftLeft,
    downRightDown,
    downRightRight,
    upByColor,
    downByColor,
    upLeftByColor,
    upRightByColor,
    downLeftByColor,
    downRightByColor,
    scoreByPosition,
} from './const/board.mjs'

import { getPieceValue, getJSONfromFEN } from './utils.mjs'

const SCORE = {
    MIN: -1000,
    MAX: 1000,
}

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
        let enemyKingLocation = null
        for (const location in this.configuration.pieces) {
            const piece = this.getPiece(location)
            if (this.isKing(piece) && this.getPieceColor(piece) !== color) {
                enemyKingLocation = location
                break
            }
        }

        const enemyColor = this.getPieceOnLocationColor(enemyKingLocation)
        let attackingKing = false
        let field = enemyKingLocation
        let distance = 0
        while (up(field) && !attackingKing) {
            field = up(field)
            distance++
            const piece = this.getPiece(field)
            if (piece && this.getPieceColor(piece) === color &&
                (this.isRook(piece) || this.isQueen(piece) || (this.isKing(piece) && distance === 1))) {
                attackingKing = true
            }
            if (piece) break
        }

        field = enemyKingLocation
        distance = 0
        while (down(field) && !attackingKing) {
            field = down(field)
            distance++
            const piece = this.getPiece(field)
            if (piece && this.getPieceColor(piece) === color &&
                (this.isRook(piece) || this.isQueen(piece) || (this.isKing(piece) && distance === 1))) {
                attackingKing = true
            }
            if (piece) break
        }

        field = enemyKingLocation
        distance = 0
        while (left(field) && !attackingKing) {
            field = left(field)
            distance++
            const piece = this.getPiece(field)
            if (piece && this.getPieceColor(piece) === color &&
                (this.isRook(piece) || this.isQueen(piece) || (this.isKing(piece) && distance === 1))) {
                attackingKing = true
            }
            if (piece) break
        }

        field = enemyKingLocation
        distance = 0
        while (right(field) && !attackingKing) {
            field = right(field)
            distance++
            const piece = this.getPiece(field)
            if (piece && this.getPieceColor(piece) === color &&
                (this.isRook(piece) || this.isQueen(piece) || (this.isKing(piece) && distance === 1))) {
                attackingKing = true
            }
            if (piece) break
        }

        field = enemyKingLocation
        distance = 0
        while (upRightByColor(field, enemyColor) && !attackingKing) {
            field = upRightByColor(field, enemyColor)
            distance++
            const piece = this.getPiece(field)
            if (piece && this.getPieceColor(piece) === color &&
                (this.isBishop(piece) || this.isQueen(piece) || (distance === 1 && (this.isKing(piece) || this.isPawn(piece))))) {
                attackingKing = true
            }
            if (piece) break
        }

        field = enemyKingLocation
        distance = 0
        while (upLeftByColor(field, enemyColor) && !attackingKing) {
            field = upLeftByColor(field, enemyColor)
            distance++
            const piece = this.getPiece(field)
            if (piece && this.getPieceColor(piece) === color &&
                (this.isBishop(piece) || this.isQueen(piece) || (distance === 1 && (this.isKing(piece) || this.isPawn(piece))))) {
                attackingKing = true
            }
            if (piece) break
        }

        field = enemyKingLocation
        distance = 0
        while (downRightByColor(field, enemyColor) && !attackingKing) {
            field = downRightByColor(field, enemyColor)
            distance++
            const piece = this.getPiece(field)
            if (piece && this.getPieceColor(piece) === color &&
                (this.isBishop(piece) || this.isQueen(piece) || (this.isKing(piece) && distance === 1))) {
                attackingKing = true
            }
            if (piece) break
        }

        field = enemyKingLocation
        distance = 0
        while (downLeftByColor(field, enemyColor) && !attackingKing) {
            field = downLeftByColor(field, enemyColor)
            distance++
            const piece = this.getPiece(field)
            if (piece && this.getPieceColor(piece) === color &&
                (this.isBishop(piece) || this.isQueen(piece) || (this.isKing(piece) && distance === 1))) {
                attackingKing = true
            }
            if (piece) break
        }

        field = upRightUp(enemyKingLocation)
        let piece = this.getPiece(field)
        if (piece && this.getPieceColor(piece) === color && this.isKnight(piece)) {
            attackingKing = true
        }
        field = upRightRight(enemyKingLocation)
        piece = this.getPiece(field)
        if (piece && this.getPieceColor(piece) === color && this.isKnight(piece)) {
            attackingKing = true
        }
        field = upLeftLeft(enemyKingLocation)
        piece = this.getPiece(field)
        if (piece && this.getPieceColor(piece) === color && this.isKnight(piece)) {
            attackingKing = true
        }
        field = upLeftUp(enemyKingLocation)
        piece = this.getPiece(field)
        if (piece && this.getPieceColor(piece) === color && this.isKnight(piece)) {
            attackingKing = true
        }
        field = downLeftDown(enemyKingLocation)
        piece = this.getPiece(field)
        if (piece && this.getPieceColor(piece) === color && this.isKnight(piece)) {
            attackingKing = true
        }
        field = downLeftLeft(enemyKingLocation)
        piece = this.getPiece(field)
        if (piece && this.getPieceColor(piece) === color && this.isKnight(piece)) {
            attackingKing = true
        }
        field = downRightDown(enemyKingLocation)
        piece = this.getPiece(field)
        if (piece && this.getPieceColor(piece) === color && this.isKnight(piece)) {
            attackingKing = true
        }
        field = downRightRight(enemyKingLocation)
        piece = this.getPiece(field)
        if (piece && this.getPieceColor(piece) === color && this.isKnight(piece)) {
            attackingKing = true
        }

        return attackingKing
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

    getMoves (color = this.getPlayingColor(), testMoves = true) {
        const allMoves = {}
        for (const location in this.configuration.pieces) {
            const piece = this.getPiece(location)
            if (this.getPieceColor(piece) === color) {
                Object.assign(allMoves, { [location]: this.getPieceMoves(piece, location) })
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

        if (!testMoves) return allMoves

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

    isEmpty (location) {
        return !this.configuration.pieces[location]
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
            throw new Error(`Invalid level ${level}. You can choose ${AI_LEVELS}`)
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
                    score: testBoard.testMoveScores(this.getPlayingColor(), this.getAIMaxDepth(level, from, to), wasScoreChanged ? testBoard.calculateScore(this.getPlayingColor()) : initialScore).score +
                        testBoard.calculateScoreByPiecesLocation(this.getPlayingColor()) +
                        (Math.floor(Math.random() * 10) / 10),
                })
            })
        }

        scoreTable.sort((previous, next) => {
            return previous.score < next.score ? 0 : -1
        })
        return scoreTable
    }

    getAIMaxDepth (level, from, to) {
        const basicDepthByLevel = {
            0: 1,
            1: 2,
            2: 3,
            3: 3,
        }
        let maxPieceValue = 0;
        ['K', 'k', 'Q', 'q'].map(piece => {
            maxPieceValue += getPieceValue(piece)
        })
        let basicDepth = basicDepthByLevel[level]
        if (this.getIngamePiecesValue() < maxPieceValue) {
            basicDepth += 1
        }
        if (level >= 3 && this.configuration.pieces[to]) {
            basicDepth += 1
        }
        return basicDepth
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

    testMoveScores (playingPlayerColor, maxDepth, initialScore, depth = 1) {
        let nextMoves = {}
        if (this.hasPlayingPlayerCheck()) {
            initialScore = null
            nextMoves = this.getMoves(this.getPlayingColor())
        } else if (depth < maxDepth) {
            nextMoves = this.getMoves(this.getPlayingColor(), false)
        }

        if (depth >= maxDepth || this.configuration.isFinished) {
            if (initialScore !== null) return { score: initialScore, checkMate: false }
            let score = this.calculateScore(playingPlayerColor)
            if (this.configuration.checkMate) {
                score += (this.getPlayingColor() === playingPlayerColor ? depth : -depth)
            }
            return {
                score,
                checkMate: this.configuration.checkMate,
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
                const result = testBoard.testMoveScores(playingPlayerColor, maxDepth, wasScoreChanged ? testBoard.calculateScore(playingPlayerColor) : initialScore, depth + 1)
                if (result.checkMate) {
                    maxValueReached = true
                }
                if (this.getPlayingColor() === playingPlayerColor) {
                    bestScore = Math.max(bestScore, result.score)
                } else {
                    bestScore = Math.min(bestScore, result.score)
                }
            })
        }

        return { score: bestScore, checkMate: false }
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
        const scoreMultiplier = 10
        let scoreIndex = 0

        if (this.configuration.checkMate) {
            if (this.getPlayingColor() === playerColor) {
                return SCORE.MIN
            } else {
                return SCORE.MAX
            }
        }

        for (const location in this.configuration.pieces) {
            const piece = this.getPiece(location)
            if (this.getPieceColor(piece) === playerColor) {
                scoreIndex += getPieceValue(piece) * scoreMultiplier
            } else {
                scoreIndex -= getPieceValue(piece) * scoreMultiplier
            }
        }

        return scoreIndex
    }
}
