#!/usr/bin/env node
/**
 * AI Level Performance Benchmark
 * Tests all 6 AI levels with mid-game positions (~70% pieces remaining)
 */

import { Game } from '../dist/index.js';

// Mid-game test positions with ~70% pieces (22-24 pieces)
const TEST_POSITIONS = [
    // Position 1: Italian Game (24 pieces)
    'r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 4 4',

    // Position 2: Queen's Gambit Declined (24 pieces)
    'rnbqkb1r/ppp2ppp/4pn2/3p4/2PP4/2N2N2/PP2PPPP/R1BQKB1R w KQkq - 0 5',

    // Position 3: Sicilian Defense (23 pieces)
    'r1bqkbnr/pp1ppppp/2n5/2p5/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3',
];

async function benchmarkLevel(level, positions) {
    const times = [];

    console.log(`\nTesting Level ${level}...`);

    for (let i = 0; i < positions.length; i++) {
        const game = new Game(positions[i]);

        const start = process.hrtime.bigint();
        game.aiMove(level);
        const end = process.hrtime.bigint();

        const timeMs = Number(end - start) / 1_000_000;
        times.push(timeMs);

        console.log(`  Position ${i + 1}: ${timeMs.toFixed(1)}ms`);
    }

    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    const min = Math.min(...times);
    const max = Math.max(...times);

    return { avg, min, max, times };
}

async function main() {
    console.log('AI Level Performance Benchmark');
    console.log('==============================');
    console.log(`Testing ${TEST_POSITIONS.length} mid-game positions per level`);
    console.log(`Platform: ${process.platform} ${process.arch}`);
    console.log(`Node.js: ${process.version}\n`);

    const results = {};

    // Test all levels
    for (let level = 1; level <= 6; level++) {
        const result = await benchmarkLevel(level, TEST_POSITIONS);
        results[level] = result;
    }

    // Summary table
    console.log('\n\nSummary');
    console.log('=======');
    console.log('Level | Avg Time  | Min Time  | Max Time  | Search Depth');
    console.log('------|-----------|-----------|-----------|-------------');

    const depths = ['1-2 ply', '2-3 ply', '3-4 ply', '4-5 ply', '5-6 ply', '6-7 ply'];

    for (let level = 1; level <= 6; level++) {
        const { avg, min, max } = results[level];
        const avgStr = formatTime(avg);
        const minStr = formatTime(min);
        const maxStr = formatTime(max);

        console.log(`  ${level}   | ${avgStr.padEnd(9)} | ${minStr.padEnd(9)} | ${maxStr.padEnd(9)} | ${depths[level - 1]}`);
    }

    console.log('\nRecommended README.md values (use avg times):');
    console.log('---------------------------------------------');
    for (let level = 1; level <= 6; level++) {
        const { avg } = results[level];
        const formatted = formatTime(avg, true);
        console.log(`Level ${level}: ${formatted}`);
    }
}

function formatTime(ms, forDocs = false) {
    if (ms < 10) return forDocs ? '<10ms' : `${ms.toFixed(1)}ms`;
    if (ms < 100) return `~${Math.round(ms / 10) * 10}ms`;
    if (ms < 1000) return `~${Math.round(ms / 50) * 50}ms`;
    const seconds = ms / 1000;
    if (seconds < 10) return `~${seconds.toFixed(1)}s`;
    return `~${Math.round(seconds)}s`;
}

main().catch(console.error);
