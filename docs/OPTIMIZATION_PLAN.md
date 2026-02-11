# Chess Engine Performance Optimization Plan

## Problem
The search is slow due to excessive object allocations (board copies, arrays, wrapper objects) at every node in the search tree. At depth 4 with ~30 moves/position, that's ~800K+ nodes, each allocating multiple objects → heavy GC pressure.

## Optimizations (ordered by expected impact)

### 1. ~~Make/Unmake Move Instead of Board Copy~~ — SKIPPED (no gain in JS)
**Result:** Tested 3 variants (setPiece/removePiece unmake, bitboard snapshot unmake, pre-allocated undo stack). All were equal or slower than `copyBoard()`. V8's generational GC makes short-lived nursery objects nearly free — `new Int8Array(64)` is a fast memcpy, and object literals benefit from hidden class optimization. The save/restore overhead of make/unmake exceeds the allocation cost it eliminates. This optimization only helps in C/C++ where malloc/free is expensive.

### 2. ~~Encode Castling Rights as a 4-bit Integer~~ — SKIPPED (no measurable gain)
**Result:** Implemented and tested. Replaced `CastlingRights` object with a 4-bit number, eliminated `{ ...castlingRights }` spreads in `copyBoard()` and `applyMoveComplete()`. No measurable improvement — the 4-boolean object is tiny and V8 handles small monomorphic object creation/spreading very efficiently. Reverted to avoid unnecessary code churn.

**Broader conclusion on #1 and #2:** Allocation-focused optimizations (#1, #2, #4, #6, #7) are unlikely to help this engine. V8's generational GC makes short-lived small objects nearly free. The real bottleneck is compute work (BigInt operations in attack detection, full-board evaluation loops), not GC pressure. Future efforts should target #3 (pawn attack tables) and #8 (incremental evaluation).

### 3. ~~Precompute Pawn Attack Tables~~ — SKIPPED (no measurable gain)
**Result:** Implemented `WHITE_PAWN_ATTACKS[64]` and `BLACK_PAWN_ATTACKS[64]` lookup tables matching the knight/king pattern. Replaced per-call `1n << BigInt(square)` + two shifts with a direct array lookup. No measurable performance difference — V8 already handles the simple BigInt shift operations efficiently, and the array lookup overhead offsets any savings. Reverted.

### 4. Reduce Move Ordering Allocations (MEDIUM impact)
**Files:** `src/ai/MoveOrdering.ts`

Replace the double `.map()` + `.sort()` pattern with an in-place sort. Score moves by writing scores into a parallel `Int32Array`, then sort the moves array using those scores. Avoids creating `{ m, score }` wrapper objects for every move at every node.

### 5. Eliminate Redundant Legal Move Generation at Root (LOW impact)
**Files:** `src/ai/AIEngine.ts`, `src/ai/Search.ts`

`getAdaptiveDepth()` calls `generateLegalMoves()` just to count moves. Instead, pass the move count from `Search.findBestMove()` or defer counting until after the first iteration.

### 6. Avoid TT Probe Object Spread (LOW impact)
**Files:** `src/ai/TranspositionTable.ts`

Return the TT entry directly and adjust mate scores in the caller, instead of `{ ...entry, score: adjusted }` on every hit.

### 7. Avoid `.filter()` in Quiescence (LOW impact)
**Files:** `src/ai/Search.ts`

Replace `allMoves.filter(m => ...)` with an in-place loop that skips non-forcing moves, avoiding array allocation per quiescence node.

### 8. Incremental Evaluation (MEDIUM impact, more complex)
**Files:** `src/ai/Evaluator.ts`, `src/ai/Search.ts`

Instead of looping over all 64 squares to evaluate, maintain a running material+PST score that's updated incrementally in make/unmake. This depends on optimization #1 being done first.

## Implementation Order
1 → 2 → 3 → 4 → 6 → 7 → 5 → 8

Optimizations 1-2 are structural changes that unlock #8. Items 3-7 are independent and can be done in any order.

## Verification
- Run existing test suite: `npm test`
- Compare search results before/after at multiple positions to confirm identical move choices
- Benchmark with `console.time` around `findBestMove()` on a standard position (e.g., starting position at depth 5) to measure speedup

## Tactical test timing baseline (for perf tracking)

Captured by running Jest on `test/integration/ai.tactical.test.ts` on **2026-01-31**. These numbers are meant to be compared *relatively* after each optimization step.

**Suite wall time:** 87.682 s

| Test case | Time (ms) |
|---|---:|
| Mate-in-N: should find mate in 1 - back rank mate (all levels) | 358 |
| Mate-in-N: should find mate in 2 - smothered mate pattern (level 4-5) | 114 |
| Mate-in-N: should find forcing checks in mate in 3 - rook ladder (level 5) | 2436 |
| Tactical Combinations: should find knight fork (family fork) | 256 |
| Tactical Combinations: should recognize and respect pin | 155 |
| Tactical Combinations: should find discovered attack | 157 |
| Material Evaluation: should capture free piece when available | 112 |
| Material Evaluation: considers tactical sacrifices (Bxf7+ pattern) | 501 |
| Material Evaluation: should support winning pawn in endgame | 990 |
| Defensive Tactics: should respond correctly to check | 332 |
| Defensive Tactics: should find counter-threat in tactical position | 219 |
| Defensive Tactics: should create luft to avoid back rank mate | 226 |
| Endgame Techniques: should promote pawn immediately when possible | 140 |
| Endgame Techniques: should maintain opposition in king and pawn endgame | 62 |
| Endgame Techniques: should recognize zugzwang position | 37 |
| Bug Regression: should not hang queen (regression test - 2026-01-29) | 123 |
| Bug Regression: should prefer center control in starting position (PST orientation) | 51 |
| Bug Regression: should evaluate checkmate correctly (minimax negation) | 46 |
| Level Differentiation: should show increasing tactical strength from level 3 to 5 | 3015 |
| Level Differentiation: should handle complex middlegame position at all levels | 4918 |
| Avoiding Hanging Pieces: should not hang the queen with C6-C5 (allowing G3xH4) | 990 |
| Avoiding Hanging Pieces: should play safe developing moves instead of hanging knight | 803 |
| Avoiding Hanging Pieces: should develop pieces safely instead of hanging bishop | 4594 |
| Avoiding Hanging Pieces: should choose a solid developing move (avoid early tactical blunders) | 2018 |
| Finding Tactical Wins: should capture central pawn with Nxe5 | 1862 |
| Finding Tactical Wins: should improve rook activity or prepare tactical strikes | 403 |
| Finding Tactical Wins: should push winning passed d-pawn | 286 |
| Finding Tactical Wins: should respond sensibly to the Bb5 pin (develop or break the center) | 797 |
| Finding Tactical Wins: should play strong developing moves in Italian Game | 1907 |
| Defensive Tactics (complex): should defend f2 weakness properly | 6023 |
| Defensive Tactics (complex): should counter-attack when under pressure | 2919 |
| Defensive Tactics (complex): should convert advantage when up a queen vs knight | 25053 |
| Complex Middlegame: should play principled moves in Ruy Lopez | 1179 |
| Complex Middlegame: should attack actively in Sicilian Dragon | 1275 |
| Complex Middlegame: should break in the center with d4 | 1646 |
| Complex Middlegame: should play aggressively with opposite-side castling | 1437 |
| Complex Middlegame: should activate rook in winning endgame | 419 |
| Endgame Precision: should activate king to capture d5 pawn | 54 |
| Endgame Precision: should not push f7 prematurely (draws after Kg7) | 155 |
| Performance/Correctness: should play consistently (deterministic) | 3838 |
| External Puzzle (Mate in 2): should find Nf6+ mate pattern (two knights) | 1772 |
| External Puzzle (Mate in 2): should find Qb8+ deflection sacrifice | 1035 |
| External Puzzle (Mate in 2): should find Qd8+ deflection sacrifice | 4049 |
| External Puzzle (Mate in 2): should find Qxf8+ sacrifice | 553 |
| External Puzzle (Mate in 2): should find Qd7+ clearance sacrifice | 2136 |
| External Puzzle (Tactical): should capture undefended queen | 779 |
| External Puzzle (Tactical): should not push pawn in Philidor endgame (draws after Kg7) | 123 |
| External Puzzle (Tactical): should defend against Scholar mate threat | 1920 |

---

# V2: Revised Optimization Plan (Algorithmic Pruning)

V1 optimizations #1-3 all showed no measurable improvement — V8 handles short-lived objects efficiently. Remaining V1 items (#4-8) were also allocation-focused and unlikely to help. This revised plan targets **algorithmic improvements** to reduce nodes searched.

---

## Phase A: Safe Optimizations (no strength loss)

These produce mathematically identical results — same moves, same scores. Implement first.

### A1. ~~Incremental Move Sorting via Selection Sort (~10-15% speedup)~~ — DONE (~5% speedup)
**File:** `src/ai/MoveOrdering.ts`

Replaced `orderMoves()` with `MoveSelector` class using pick-best-on-demand via selection sort. Scores into parallel `Int32Array`, swaps best to front on each `pickNext()` call. Measured ~5% speedup — less than estimated because sorting was a small fraction of per-node cost.

### A2. ~~Principal Variation Search (PVS) (~10-20% speedup)~~ — DONE (~24% speedup)
**File:** `src/ai/Search.ts` — negamax inner loop

After the first (PV) move, search remaining moves with zero-window `(-alpha-1, -alpha)`. Re-search with full window only if it beats alpha. Mathematically equivalent — just proves non-PV moves inferior more cheaply.

**Result:** Implemented in `negamax()` inner loop. Tactical test suite improved from 83s to 63s (~24% speedup). No re-search overhead issues — move ordering (TT + killers) is good enough that most zero-window searches don't need re-search.

### A3. ~~Quiescence Cleanup (~5% speedup)~~ — DONE (no measurable gain)
**File:** `src/ai/Search.ts` — `quiescence()` method

Consolidated the two redundant mate-check fallback blocks into a single cleaner block at the end of `quiescence()`. The original had separate checks for (1) `forcing.length === 0 && inCheck` and (2) `!anyLegalForcing && inCheck` — now unified into one `!legalForcingFound && isKingInCheck(board)` block.

**Result:** Code is cleaner but no measurable speedup. The mate-check fallback code runs rarely (only when in check AND no legal forcing moves exist), so optimizing it doesn't affect total runtime. The original plan's suggestion to "search ALL moves when in check" was tested but caused ~36% slowdown due to recursive searching of quiet escape moves — reverted to match original behavior (only legality-check quiet moves, don't recursively search them).

### A4. ~~Aspiration Windows (~5-10% speedup)~~ — DONE (~15% speedup)
**File:** `src/ai/Search.ts` — iterative deepening loop

Implemented with ±25cp window (d≥4 only), exponential widening on fail high/low. Re-validated after A1-A3 optimizations improved move ordering (especially PVS in A2), which reduced re-search frequency. Measured ~15% speedup on tactical test suite (98s vs 115s baseline). Previous "no net gain" conclusion was likely tested before PVS was in place — better move ordering means the aspiration window holds more often.

---

## Phase B: Pruning Optimizations (may affect strength — requires careful testing)

These skip parts of the search tree. They make the engine faster but can miss edge-case tactics. Each needs validation against the full tactical test suite.

### B1. Null Move Pruning (~30-50% speedup)
**File:** `src/ai/Search.ts` — insert before move generation in `negamax()`

Before searching all moves, try "passing". If the opponent can't beat beta even with a free move, prune the node. R=2 (depth≤6) or R=3 (depth>6).

**Strength risk:** Can miss **zugzwang** (positions where any move loses). Mitigate: skip when in check, at PV nodes, or when only pawns+kings remain.

### B2. Late Move Reductions (LMR) (~20-30% speedup)
**File:** `src/ai/Search.ts` — negamax inner loop

Moves ordered late (index ≥ 4) that aren't captures/killers/checks get searched at reduced depth. Re-search at full depth if reduced search beats alpha.

**Strength risk:** Can miss deep quiet tactics ordered late. The re-search mitigates this but only if the shallow search already looks promising. Most likely optimization to cause tactical regressions.

### B3. Futility Pruning (~10-15% speedup)
**File:** `src/ai/Search.ts` — negamax, before move loop

At depth 1-2, if static eval + margin (200cp/500cp) is below alpha, skip quiet moves entirely.

**Strength risk:** Can miss sacrificial combinations where a quiet move enables a winning tactic. Use conservative margins to limit risk.

---

## V2 Verification
- `npm test` after **each** optimization (all tactical tests must pass)
- Compare tactical test suite time against 88s baseline
- Phase A should show no test regressions at all
- Phase B: if any tactical test regresses, tune parameters before proceeding

## Key Files
- `src/ai/Search.ts` — all optimizations except A1
- `src/ai/MoveOrdering.ts` — A1
- `test/integration/ai.tactical.test.ts` — test suite & 88s baseline

