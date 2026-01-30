const { Game } = require('../dist/index.js');

// Diagnostic tool to understand why AI chooses specific moves
function diagnoseMoveChoice(fen, expectedMoves, badMove, level = 6) {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Position FEN:', fen);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const game = new Game(fen);
    const moveResult = game.ai({ level, play: false });

    const [[from, to]] = Object.entries(moveResult.move);
    const playedMove = `${from}-${to}`;

    console.log('\n🎯 AI CHOSE:', playedMove);
    if (Array.isArray(expectedMoves) && expectedMoves.length > 0) {
        console.log('   Expected:', expectedMoves.join(', '));
        console.log('   Bad move:', badMove);
        console.log('   Match:', expectedMoves.includes(playedMove) ? '✅ GOOD' : '❌ BAD');
    }

    // Show all available moves
    const movesMap = game.moves();
    console.log('\n📋 Available moves:');
    for (const [fromSq, toSquares] of Object.entries(movesMap)) {
        console.log(`   ${fromSq}: ${toSquares.join(', ')}`);
    }

    console.log('\n');
}

// Test cases from failing tests
const testCases = [
    {
        name: 'Opening - should play central pawns',
        fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        badMove: 'B1-C3',
        goodMoves: ['E2-E4', 'D2-D4', 'G1-F3', 'C2-C4']
    },
    {
        name: 'Should not hang knight with Nxc2+',
        fen: 'r1bqkbnr/pppp1ppp/2n5/4p3/4P3/2N2N2/PPPP1PPP/R1BQKB1R b KQkq - 3 3',
        badMove: 'D6-E5',
        goodMoves: ['C7-C6', 'C7-C5', 'F8-E7', 'F8-D6', 'B4-D5', 'B4-A6']
    },
    {
        name: 'Should not overvalue knight centralization (1)',
        fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4',
        badMove: 'F3-E5',
        goodMoves: ['E1-G1', 'D2-D3', 'D2-D4', 'B1-C3', 'F3-G5']
    },
    {
        name: 'Should not overvalue knight centralization (2)',
        fen: 'r1bqk2r/ppppbppp/2n2n2/4p3/1PB1P3/5N2/P1PP1PPP/RNBQK2R w KQkq - 6 5',
        badMove: 'F3-E5',
        goodMoves: ['D2-D4', 'C2-C3', 'B1-D2', 'F3-H4', 'A2-A4', 'H2-H3']
    },
    {
        name: 'Should not play F6-E4',
        fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 4 4',
        badMove: 'F6-E4',
        goodMoves: ['E8-G8', 'D7-D6', 'C5-B6', 'C5-A7', 'F8-E7', 'H7-H6']
    }
];

console.log('\n🔍 DIAGNOSING MOVE CHOICES\n');

/**
 * CLI usage:
 *   node scripts/diagnose-move.js "<fen>" [level]
 *
 * If no args provided, runs the built-in diagnostic suite.
 */
const [, , fenArg, levelArg] = process.argv;
const parsedLevel = levelArg ? Number(levelArg) : 6;

if (fenArg) {
    const level = Number.isFinite(parsedLevel) ? parsedLevel : 6;
    console.log('\n' + '='.repeat(80));
    console.log(`TEST: Ad-hoc FEN (level=${level})`);
    diagnoseMoveChoice(fenArg, [], '(n/a)', level);
} else {
    testCases.forEach(test => {
        console.log('\n' + '='.repeat(80));
        console.log(`TEST: ${test.name}`);
        diagnoseMoveChoice(test.fen, test.goodMoves, test.badMove, 6);
    });
}
