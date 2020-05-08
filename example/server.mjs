import fastify from 'fastify'
import * as cors from 'fastify-cors'
import jsChessEngine from '../dist/js-chess-engine.js'
const { move, status, moves, aiMove } = jsChessEngine

const ROUTE_MAP = {
    '/moves': moves,
    '/status': status,
    '/move': move,
    '/aimove': aiMove,
}
const server = fastify({
    logger: true,
}).register(cors.default)

for (const route in ROUTE_MAP) {
    server.post(route, (request, response) => {
        try {
            const result = ROUTE_MAP[route](request.body, ...Object.values(request.query))
            response.send(result)
        } catch (error) {
            response.code(404).send(error)
        }
    })
}

server.listen(8000, '0.0.0.0')
