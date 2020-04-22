import { JsChess } from './lib/Game.js'
import readline from 'readline'

const game = new JsChess()
play()

function play () {
    game.printToConsole()

    let rl = getInput()
    rl.question('From? ', from => {
        rl.close()
        console.log('Your options: ', game.moves(from))

        rl = getInput()
        rl.question('To? ', to => {
            rl.close()
            game.move(from, to)
            play()
        })
    })
}

function getInput () {
    return readline.createInterface({
        input: process.stdin,
        output: process.stdout
    })
}
