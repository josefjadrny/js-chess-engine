import jsChessEngine from '../dist/js-chess-engine.js'
import readline from 'readline'

const game = new jsChessEngine.Game()
play()

function play () {
    game.printToConsole()

    let rl = getInput()
    rl.question('From? ', from => {
        rl.close()
        const moves = game.moves(from)
        console.log('Your options: ', moves)
        rl = getInput()
        rl.question('To? ', to => {
            rl.close()
            try {
                game.move(from, to)
            } catch (error) {
                console.log(`Skipping: ${error}`)
            }
            if (game.exportJson().isFinished) {
                console.log('Game over')
            } else {
                play()
            }
        })
    })
}

function getInput () {
    return readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    })
}
