import fastify from 'fastify'
import * as cors from 'fastify-cors'
import { chessMoves, chessStatus, chessMove } from '../lib/js-chess-engine.mjs'

const ROUTE_MAP = {
    '/moves': chessMoves,
    '/status': chessStatus,
    '/move': chessMove
}
const server = fastify({
    logger: true
}).register(cors.default)

for (const route in ROUTE_MAP) {
    server.post(route, (request, response) => {
        try {
            const result = ROUTE_MAP[route](request.body)
            response.send(result)
        } catch (error) {
            response.code(404).send(error)
        }
    })
}

server.listen(8000, '0.0.0.0')
