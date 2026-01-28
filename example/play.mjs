import { Game } from '../dist/index.js';
import readline from 'readline';

let game;
let whitePlayer; // 'human' or 'ai'
let blackPlayer; // 'human' or 'ai'
let whiteAiLevel;
let blackAiLevel;

function getInput() {
    return readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
}

function askQuestion(question) {
    return new Promise((resolve) => {
        const rl = getInput();
        rl.question(question, (answer) => {
            rl.close();
            resolve(answer);
        });
    });
}

async function setupGame() {
    console.log('\n=== JS Chess Engine - Interactive Game ===\n');

    // Ask for white player
    const whiteAnswer = await askQuestion('Who plays WHITE? (h=human, a=ai): ');
    whitePlayer = whiteAnswer.toLowerCase() === 'a' ? 'ai' : 'human';

    if (whitePlayer === 'ai') {
        const level = await askQuestion('White AI level (1-5, default 3): ');
        whiteAiLevel = level ? parseInt(level) : 3;
        if (whiteAiLevel < 1 || whiteAiLevel > 5) whiteAiLevel = 3;
    }

    // Ask for black player
    const blackAnswer = await askQuestion('Who plays BLACK? (h=human, a=ai): ');
    blackPlayer = blackAnswer.toLowerCase() === 'a' ? 'ai' : 'human';

    if (blackPlayer === 'ai') {
        const level = await askQuestion('Black AI level (1-5, default 3): ');
        blackAiLevel = level ? parseInt(level) : 3;
        if (blackAiLevel < 1 || blackAiLevel > 5) blackAiLevel = 3;
    }

    console.log('\n--- Game Setup ---');
    console.log(`White: ${whitePlayer}${whitePlayer === 'ai' ? ` (level ${whiteAiLevel})` : ''}`);
    console.log(`Black: ${blackPlayer}${blackPlayer === 'ai' ? ` (level ${blackAiLevel})` : ''}`);
    console.log('------------------\n');

    // Create game
    game = new Game();

    // Start playing
    await play();
}

async function play() {
    const status = game.exportJson();

    game.printToConsole();

    // Check if game is finished
    if (status.isFinished) {
        console.log('\n=== GAME OVER ===');
        if (status.checkMate) {
            console.log(`${status.turn === 'white' ? 'BLACK' : 'WHITE'} wins by checkmate!`);
        } else {
            console.log('Game ended in a draw!');
        }
        return;
    }

    // Show current turn
    console.log(`\nTurn: ${status.turn.toUpperCase()}`);
    if (status.check) {
        console.log('*** CHECK ***');
    }

    // Determine current player
    const currentPlayer = status.turn === 'white' ? whitePlayer : blackPlayer;

    if (currentPlayer === 'ai') {
        await makeAiMove(status.turn);
    } else {
        await makeHumanMove();
    }
}

async function makeAiMove(color) {
    console.log('\nAI is thinking...');

    const level = color === 'white' ? whiteAiLevel : blackAiLevel;

    console.time('Calculated in');
    const result = game.ai({ level });
    console.timeEnd('Calculated in');

    // Display the move
    const [from, to] = Object.entries(result.move)[0];
    console.log(`AI moved: ${from} → ${to}`);

    // Show check/checkmate status
    if (result.board.checkMate) {
        console.log('*** CHECKMATE ***');
    } else if (result.board.check) {
        console.log('*** CHECK ***');
    }

    await play();
}

async function makeHumanMove() {
    try {
        const from = await askQuestion('\nFrom square (e.g., E2): ');

        if (!from || from.toLowerCase() === 'q') {
            console.log('Exiting game...');
            return;
        }

        // Show available moves
        const moves = game.moves(from);
        const toSquares = moves[from.toUpperCase()] || moves[from.toLowerCase()];

        if (!toSquares || toSquares.length === 0) {
            console.log('No valid moves from this square. Try again.');
            return await play();
        }

        console.log(`Available moves: ${toSquares.join(', ')}`);

        const to = await askQuestion('To square: ');

        if (!to || to.toLowerCase() === 'q') {
            console.log('Exiting game...');
            return;
        }

        // Make the move
        game.move(from, to);
        await play();

    } catch (error) {
        console.log(`Error: ${error.message}`);
        console.log('Try again.');
        await play();
    }
}

// Start the game
setupGame().catch(error => {
    console.error('Error:', error);
    process.exit(1);
});
