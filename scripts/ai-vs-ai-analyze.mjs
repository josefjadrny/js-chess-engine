#!/usr/bin/env node
/**
 * AI vs AI analyzer
 *
 * Runs self-play (highest difficulty vs highest difficulty by default), logs moves, and flags
 * potentially bad moves by comparing the played move's evaluation to the
 * best available alternative at that ply.
 *
 * Notes:
 * - This is not a full engine-vs-engine validation (no external oracle).
 *   It’s an internal consistency check: “did we pick (near) the best move
 *   according to our own search at this level?”.
 */

import { Game } from '../dist/index.js';

import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

// Internal imports (we intentionally import from dist/ as well, because dist is CommonJS)
const { parseFEN } = require('../dist/utils/fen.js');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { generateLegalMoves, applyMoveComplete } = require('../dist/core/MoveGenerator.js');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { copyBoard } = require('../dist/core/Board.js');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { Evaluator } = require('../dist/ai/Evaluator.js');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { AIEngine } = require('../dist/ai/AIEngine.js');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { Search } = require('../dist/ai/Search.js');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { indexToSquare } = require('../dist/utils/conversion.js');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { InternalColor } = require('../dist/types/index.js');

function parseArgs(argv) {
  const opts = {
    fen: null,
    plies: 120,
    levelWhite: 6,
    levelBlack: 6,
    ttSizeMB: 32,
    thresholdCp: 80,
    verifyDepth: 0,
    verifyExtendedDepth: 0,
    quiet: false,
  };

  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    const next = () => argv[++i];

    if (a === '--fen') opts.fen = next();
    else if (a === '--plies') opts.plies = Number(next());
    else if (a === '--levelWhite') opts.levelWhite = Number(next());
    else if (a === '--levelBlack') opts.levelBlack = Number(next());
    else if (a === '--tt') opts.ttSizeMB = Number(next());
    else if (a === '--threshold') opts.thresholdCp = Number(next());
    else if (a === '--verifyDepth') opts.verifyDepth = Number(next());
    else if (a === '--verifyExtendedDepth') opts.verifyExtendedDepth = Number(next());
    else if (a === '--quiet') opts.quiet = true;
    else if (a === '--help' || a === '-h') opts.help = true;
    else {
      throw new Error(`Unknown arg: ${a}`);
    }
  }

  return opts;
}

function moveToUciLike(m) {
  // Not full UCI (no promotion suffix), but good enough for logging.
  const from = indexToSquare(m.from);
  const to = indexToSquare(m.to);
  return `${from}${to}`;
}

function colorName(internalColor) {
  return internalColor === InternalColor.WHITE ? 'white' : 'black';
}

function evalAfterMove(boardBefore, move, rootColor) {
  const b = copyBoard(boardBefore);
  applyMoveComplete(b, move);
  return {
    score: Evaluator.evaluate(b, rootColor, 0),
    boardAfter: b,
  };
}

function getLevelDepth(level) {
  // AIEngine exposes depth mapping statically.
  return AIEngine.getLevelDepth(level);
}

function scoreMoveBySearch(boardBefore, move, level, ttSizeMB) {
  // Validates a candidate move by scoring it with the same search settings
  // the engine uses (baseDepth/extendedDepth for that level).
  //
  // We do this by applying the move, then searching from the resulting position.
  // The returned score is from the original root color perspective.
  const depthCfg = getLevelDepth(level);
  const rootColor = boardBefore.turn;

  const b = copyBoard(boardBefore);
  applyMoveComplete(b, move);

  const search = new Search(ttSizeMB);
  const res = search.findBestMove(b, depthCfg.baseDepth, depthCfg.extendedDepth);

  // If opponent has no legal reply, treat as leaf.
  return res ? res.score : Evaluator.evaluate(b, rootColor, 0);
}

function analyzePlyOptionsBySearch(boardBefore, level, ttSizeMB) {
  const legal = generateLegalMoves(boardBefore);
  if (!legal.length) return null;

  let best = null;
  let worst = null;
  const scored = [];

  for (const m of legal) {
    const score = scoreMoveBySearch(boardBefore, m, level, ttSizeMB);
    scored.push({ move: m, score });
    if (!best || score > best.score) best = { move: m, score };
    if (!worst || score < worst.score) worst = { move: m, score };
  }

  scored.sort((a, b) => b.score - a.score);

  return { best, worst, legalCount: legal.length, scored };
}

function analyzePlyOptions(boardBefore, rootColor) {
  const legal = generateLegalMoves(boardBefore);
  if (!legal.length) return null;

  let best = null;
  let worst = null;
  for (const m of legal) {
    const { score } = evalAfterMove(boardBefore, m, rootColor);
    if (!best || score > best.score) best = { move: m, score };
    if (!worst || score < worst.score) worst = { move: m, score };
  }

  return { best, worst, legalCount: legal.length };
}

function formatCp(score) {
  // Evaluator is roughly centipawn-ish but not exactly; keep terminology consistent.
  const s = Number(score);
  if (s > 0) return `+${s}`;
  return `${s}`;
}

async function main() {
  const opts = parseArgs(process.argv);
  if (opts.help) {
    process.stdout.write(
      [
        'AI vs AI analyzer',
        '',
        'Usage:',
        '  node scripts/ai-vs-ai-analyze.mjs [--fen <FEN>] [--plies <n>]',
        '                                  [--levelWhite 6] [--levelBlack 6]',
        '                                  [--tt 32] [--threshold 80]',
        '                                  [--verifyDepth 0] [--verifyExtendedDepth 0]',
        '                                  [--quiet]',
        '',
        'What it does:',
        '  - Plays AI vs AI for N plies.',
        '  - For each ply, scores every legal root move using the engine search at that level.',
        '  - Flags moves with a score drop >= threshold.',
        '',
      ].join('\n')
    );
    return;
  }

  if (Number.isNaN(opts.plies) || opts.plies <= 0) throw new Error('--plies must be > 0');
  if (opts.levelWhite < 1 || opts.levelWhite > 6) throw new Error('--levelWhite must be 1..6');
  if (opts.levelBlack < 1 || opts.levelBlack > 6) throw new Error('--levelBlack must be 1..6');

  // We use Game for move application convenience, but do analysis off internal boards.
  const game = opts.fen ? new Game(opts.fen) : new Game();
  const engine = new AIEngine();

  const flagged = [];

  for (let ply = 1; ply <= opts.plies; ply++) {
    const fenBefore = game.exportFEN();
    const boardBefore = parseFEN(fenBefore);
    const rootColor = boardBefore.turn;

    const level = rootColor === InternalColor.WHITE ? opts.levelWhite : opts.levelBlack;
    const bestMove = engine.findBestMove(boardBefore, level, opts.ttSizeMB);

    if (!bestMove) {
      if (!opts.quiet) {
        console.log(`Ply ${ply}: no legal moves. Game over.`);
        console.log(`FEN: ${fenBefore}`);
      }
      break;
    }

  // Validate move using the engine's own search score.
  // This is more meaningful than Evaluator(one-ply), but much more expensive.
  const summary = analyzePlyOptionsBySearch(boardBefore, level, opts.ttSizeMB);
  const bestBySearch = summary?.best;
  const playedScore = scoreMoveBySearch(boardBefore, bestMove, level, opts.ttSizeMB);
  const bestScore = bestBySearch ? bestBySearch.score : playedScore;

  const delta = bestScore - playedScore;
    const isSuspicious = delta >= opts.thresholdCp;

    // Play it on the Game for forward progress.
    const from = indexToSquare(bestMove.from);
    const to = indexToSquare(bestMove.to);
    game.move(from, to);
    const fenAfter = game.exportFEN();

    const moveStr = moveToUciLike(bestMove);
    if (!opts.quiet) {
      const turnPrefix = rootColor === InternalColor.WHITE
        ? `${Math.ceil(ply / 2)}.`
        : `${Math.ceil(ply / 2)}...`;
      const line = `${turnPrefix} ${colorName(rootColor)} ${moveStr}  score=${formatCp(playedScore)}  best=${formatCp(bestScore)}  Δ=${formatCp(delta)}`;
      console.log(line);
    }

    if (isSuspicious) {
      const record = {
        ply,
        color: colorName(rootColor),
        fenBefore,
        fenAfter,
        played: moveStr,
        playedScore,
        bestAlt: bestBySearch ? moveToUciLike(bestBySearch.move) : null,
        bestScore,
        delta,
        legalCount: summary?.legalCount ?? 0,
      };
      flagged.push(record);

      if (!opts.quiet) {
        console.log(`  ⚠ flagged: played=${record.played} bestAlt=${record.bestAlt} Δ=${formatCp(record.delta)} legalMoves=${record.legalCount}`);

        const top = (summary?.scored || []).slice(0, 5);
        if (top.length) {
          console.log('  top candidates:');
          for (const t of top) {
            console.log(`    ${moveToUciLike(t.move)}  score=${formatCp(t.score)}`);
          }
        }
      }

      // Optional deeper verification pass: compare engine's chosen move at deeper depth vs played.
      // We don't mutate the engine's LEVEL_CONFIG; instead we ask user to set verifyDepth and
      // run a separate engine instance by calling Search directly is not exposed, so we just
      // re-run AIEngine is not configurable. Therefore we implement a simple workaround:
  // run multiple times: already at the highest difficulty (6/7). verifyDepth is implemented by temporarily
      // re-evaluating all moves via Evaluator only (still shallow), unless verifyDepth == 0.
      //
      // If you want true deeper verification, we can add an exported method later.
      // verifyDepth/verifyExtendedDepth are currently not wired.
    }

    // Stop if game ends
    const status = game.exportJson();
    if (status.isFinished) {
      if (!opts.quiet) {
        console.log('Game finished:', status.checkMate ? 'checkmate' : 'draw');
        console.log('Final FEN:', fenAfter);
      }
      break;
    }
  }

  // Summary
  console.log('\n=== Analysis summary ===');
  console.log(`Flagged moves: ${flagged.length}`);
  if (flagged.length) {
    for (const f of flagged) {
      console.log(
        `ply ${f.ply} ${f.color}: played ${f.played} (score ${formatCp(f.playedScore)}) vs best ${f.bestAlt} (score ${formatCp(f.bestScore)}), Δ=${formatCp(f.delta)}`
      );
      console.log(`  FEN before: ${f.fenBefore}`);
    }
  }
}

main().catch((e) => {
  console.error(e?.stack || e?.message || String(e));
  process.exit(1);
});
