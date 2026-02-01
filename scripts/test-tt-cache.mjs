#!/usr/bin/env node
/**
 * TT Cache Performance Test Script - Multiple Positions
 *
 * Tests all AI levels (1-5) with different transposition table cache sizes
 * across multiple tactical positions to understand how the cache affects
 * calculation performance in different scenarios.
 *
 * TT Cache Values tested: 0, 1, 2, 4, 8, 16, 32, 64 MB
 */

import { Game } from '../dist/index.js';

// Test multiple positions from the tactical test suite
const TEST_POSITIONS = [
    {
        name: 'Italian Game - Complex Middlegame',
        fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 4',
    },
    {
        name: 'Smothered Mate - Mate in 2',
        fen: 'r1b2rk1/pppp1Npp/4pn2/8/1b1P4/8/PPP2PPP/RNBQR1K1 w - - 0 1',
    },
    {
        name: 'Back Rank Mate - Mate in 1',
        fen: '6k1/5ppp/8/8/8/8/5PPP/R5K1 w - - 0 1',
    },
    {
        name: 'King and Pawn Endgame',
        fen: '8/8/8/4k3/4P3/4K3/8/8 w - - 0 1',
    },
    {
        name: 'Rook Ladder - Mate in 3',
        fen: '6k1/5ppp/8/8/8/8/R4PPP/R5K1 w - - 0 1',
    },
];

const AI_LEVELS = [1, 2, 3, 4, 5];
const TT_CACHE_SIZES = [0, 1, 2, 4, 8, 16, 32, 64]; // In MB

/**
 * Run a single test: Position + AI level + TT cache size
 */
function runTest(fen, positionName, level, ttSizeMB) {
    const game = new Game(fen);

    const startTime = performance.now();
    const result = game.ai({ level, ttSizeMB, play: false });
    const endTime = performance.now();

    const timeMs = endTime - startTime;
    const move = Object.entries(result.move)[0].join('-');

    return {
        position: positionName,
        level,
        ttSize: ttSizeMB,
        timeMs,
        move,
    };
}

/**
 * Format time in a human-readable way
 */
function formatTime(ms) {
    if (ms < 1) {
        return `${ms.toFixed(3)}ms`;
    } else if (ms < 1000) {
        return `${ms.toFixed(1)}ms`;
    } else {
        return `${(ms / 1000).toFixed(2)}s`;
    }
}

/**
 * Main test runner
 */
async function main() {
    console.log('='.repeat(80));
    console.log('TT Cache Performance Test - Multiple Positions');
    console.log('='.repeat(80));
    console.log();

    const allResults = [];

    // Run tests for each position
    for (const position of TEST_POSITIONS) {
        console.log('\n' + '='.repeat(80));
        console.log(`POSITION: ${position.name}`);
        console.log('='.repeat(80));
        console.log(`FEN: ${position.fen}`);
        console.log();

        // Run tests for each AI level
        for (const level of AI_LEVELS) {
            console.log(`\nLevel ${level}:`);
            console.log('-'.repeat(80));
            console.log(`${'TT Size (MB)'.padEnd(15)} ${'Time'.padEnd(12)} ${'Move'.padEnd(10)}`);
            console.log('-'.repeat(80));

            for (const ttSize of TT_CACHE_SIZES) {
                const result = runTest(position.fen, position.name, level, ttSize);
                allResults.push(result);

                const ttSizeStr = ttSize === 0 ? 'Disabled' : `${ttSize} MB`;
                console.log(
                    `${ttSizeStr.padEnd(15)} ${formatTime(result.timeMs).padEnd(12)} ${result.move.padEnd(10)}`
                );
            }
        }

        // Summary for this position
        console.log();
        console.log('-'.repeat(80));
        console.log(`Summary for ${position.name}:`);
        console.log('-'.repeat(80));

        for (const level of AI_LEVELS) {
            const levelResults = allResults.filter(
                r => r.position === position.name && r.level === level
            );
            const times = levelResults.map(r => r.timeMs);
            const minTime = Math.min(...times);

            const noCache = levelResults.find(r => r.ttSize === 0);
            const withCache = levelResults.filter(r => r.ttSize > 0);
            const bestWithCache = withCache.reduce((best, curr) =>
                curr.timeMs < best.timeMs ? curr : best
            );

            const improvement = ((noCache.timeMs - bestWithCache.timeMs) / noCache.timeMs * 100);

            console.log(
                `  Level ${level}: ${formatTime(noCache.timeMs)} → ${formatTime(bestWithCache.timeMs)} ` +
                `(${bestWithCache.ttSize} MB) = ${improvement >= 0 ? '+' : ''}${improvement.toFixed(1)}% improvement`
            );
        }
    }

    // Overall comparison
    console.log();
    console.log('\n' + '='.repeat(80));
    console.log('OVERALL COMPARISON - Cache Impact by Position Type');
    console.log('='.repeat(80));

    for (const position of TEST_POSITIONS) {
        console.log(`\n${position.name}:`);

        for (const level of AI_LEVELS) {
            const levelResults = allResults.filter(
                r => r.position === position.name && r.level === level
            );

            const noCache = levelResults.find(r => r.ttSize === 0);
            const withCache = levelResults.filter(r => r.ttSize > 0);
            const bestWithCache = withCache.reduce((best, curr) =>
                curr.timeMs < best.timeMs ? curr : best
            );

            const improvement = ((noCache.timeMs - bestWithCache.timeMs) / noCache.timeMs * 100);

            console.log(
                `  Level ${level}: ${formatTime(noCache.timeMs).padEnd(10)} → ` +
                `${formatTime(bestWithCache.timeMs).padEnd(10)} ` +
                `(${String(bestWithCache.ttSize).padStart(2)} MB) | ` +
                `${improvement >= 0 ? '+' : ''}${improvement.toFixed(1).padStart(5)}%`
            );
        }
    }

    // Best cache sizes
    console.log();
    console.log('\n' + '='.repeat(80));
    console.log('OPTIMAL CACHE SIZES BY LEVEL AND POSITION');
    console.log('='.repeat(80));

    for (const level of AI_LEVELS) {
        console.log(`\nLevel ${level}:`);
        for (const position of TEST_POSITIONS) {
            const levelResults = allResults.filter(
                r => r.position === position.name && r.level === level
            );
            const withCache = levelResults.filter(r => r.ttSize > 0);
            const bestWithCache = withCache.reduce((best, curr) =>
                curr.timeMs < best.timeMs ? curr : best
            );

            console.log(`  ${position.name.padEnd(40)} : ${bestWithCache.ttSize.toString().padStart(2)} MB`);
        }
    }

    console.log();
    console.log('='.repeat(80));
}

// Run the tests
main().catch(console.error);
