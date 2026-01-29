# AI Implementation Guide

Complete technical documentation for the chess engine's AI system, including algorithms, optimizations, architecture, and implementation details.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Core Algorithm](#core-algorithm)
- [Performance Optimizations](#performance-optimizations)
- [Position Evaluation](#position-evaluation)
- [Search Enhancements](#search-enhancements)
- [Data Structures](#data-structures)
- [Performance Metrics](#performance-metrics)
- [Future Enhancements](#future-enhancements)
- [Developer Guide](#developer-guide)

## Overview

The js-chess-engine v2 AI is a competitive chess engine built on classical chess programming techniques, enhanced with modern optimizations. It achieves strong tactical play through efficient search algorithms and sophisticated position evaluation.

**Key Features:**
- Minimax algorithm with alpha-beta pruning
- Transposition table with Zobrist hashing (configurable size: 0-256 MB, disable for minimal memory)
- Advanced move ordering (PV moves, MVV-LVA, killer moves)
- Iterative deepening
- Quiescence search for tactical stability
- Configurable difficulty levels (1-5)
- Memory-efficient with tunable cache size (browser and mobile-friendly)

**Performance:** 65% faster than baseline implementation (16.3s → 5.6s on test suite)

## Architecture

### File Structure

```
src/ai/
├── AIEngine.ts           # Main AI interface and level configuration
├── Search.ts             # Alpha-beta search with optimizations
├── Evaluator.ts          # Static position evaluation
├── TranspositionTable.ts # Position caching system
└── MoveOrdering.ts       # Move ordering heuristics
```

### Component Relationships

```
Game (API Layer)
  ↓
AIEngine (Level Configuration)
  ↓
Search (Alpha-Beta + Optimizations)
  ↓
├─→ TranspositionTable (Position Cache)
├─→ MoveOrdering (Move Prioritization)
├─→ Evaluator (Position Scoring)
└─→ MoveGenerator (Legal Moves)
```

### Data Flow

1. **API Call**: User calls `game.ai()` or `game.aiMove()`
2. **Configuration**: AIEngine maps level (1-5) to search depths
3. **Search**: Iterative deepening progressively searches deeper
4. **Ordering**: Moves ordered by PV → Captures → Killers → Quiet
5. **Evaluation**: Positions scored by material + piece-square tables
6. **Caching**: Results stored in transposition table
7. **Return**: Best move returned to API layer

## Core Algorithm

### Minimax with Alpha-Beta Pruning

**Location:** `src/ai/Search.ts` - `alphaBeta()` method

**Description:** Classical minimax algorithm that explores the game tree to find the best move, enhanced with alpha-beta pruning to eliminate branches that cannot affect the final decision.

**Pseudocode:**
```
function alphaBeta(board, depth, alpha, beta, maximizing):
    if depth == 0 or game_over:
        return evaluate(board)

    if maximizing:
        maxEval = -∞
        for each move in moves:
            eval = alphaBeta(after_move, depth-1, alpha, beta, false)
            maxEval = max(maxEval, eval)
            alpha = max(alpha, eval)
            if beta <= alpha:
                break  # Beta cutoff
        return maxEval
    else:
        minEval = +∞
        for each move in moves:
            eval = alphaBeta(after_move, depth-1, alpha, beta, true)
            minEval = min(minEval, eval)
            beta = min(beta, eval)
            if beta <= alpha:
                break  # Alpha cutoff
        return minEval
```

**Key Properties:**
- **Time Complexity**: O(b^d) worst case, O(b^(d/2)) with optimal move ordering
- **Space Complexity**: O(d) for call stack
- **Pruning Efficiency**: 50-90% of nodes eliminated with good move ordering

### Search Extensions

**Check Extension:**
- When king is in check, search 1 ply deeper
- Prevents horizon effect in tactical positions
- Location: `Search.ts` lines 158-173

**Quiescence Search:**
- Continue searching captures/checks at leaf nodes
- Prevents missing tactical sequences at search boundary
- Controlled by `extendedDepth` parameter

**Implementation Detail:**
```typescript
// Extend search if in check (always search deeper)
if (depth < extendedDepth && inCheck) {
    shouldSearch = true;
}
// Continue base search or extend on captures
else if (depth < baseDepth || (wasCapture && depth < extendedDepth)) {
    shouldSearch = true;
}
```

## Performance Optimizations

### 1. Transposition Table

**Location:** `src/ai/TranspositionTable.ts`

**Purpose:** Cache previously evaluated positions to avoid redundant computation. Chess positions can be reached through different move orders (transpositions).

**Implementation:**

```typescript
interface TTEntry {
    zobristHash: bigint;     // Position identifier
    depth: number;           // Search depth
    score: Score;            // Position score
    type: TTEntryType;       // EXACT, LOWER_BOUND, UPPER_BOUND
    bestMove: InternalMove;  // Best move found
    age: number;             // Search generation
}
```

**Configuration:**

The transposition table size is **auto-configured** based on the runtime environment:
- **Node.js**: 16 MB (default) - ample memory available
- **Browser**: 1 MB (default) - mobile-friendly

You can override the default through AI options:

```typescript
// Use auto-detected default (recommended)
game.ai({ level: 3 });
// → Node.js: 16 MB cache
// → Browser: 1 MB cache

// Override for specific requirements
game.ai({ level: 4, ttSizeMB: 64 });     // High-performance: 64MB
game.ai({ level: 2, ttSizeMB: 2 });      // Standard mobile: 2MB
game.ai({ level: 1, ttSizeMB: 0.5 });    // Low-end mobile: 512KB
game.ai({ level: 1, ttSizeMB: 0.25 });   // Ultra-lightweight: 256KB
game.ai({ level: 1, ttSizeMB: 0 });      // Disabled: ~16KB base memory
```

**Environment Detection:**

The engine automatically detects the runtime environment using:
- `process.versions.node` check for Node.js
- Absence of Node.js globals indicates browser environment
- See `src/utils/environment.ts` for implementation

**Key Features:**
- **Size**: Configurable 0-256 MB (0 to disable, 0.25-256 MB range, default: auto-detected - 16 MB in Node.js ~400,000 entries, 1 MB in browser ~25,000 entries)
- **Hash Function**: Zobrist hashing (see below)
- **Replacement Strategy**: Always replace if:
  - Slot is empty
  - Same position (hash collision)
  - Greater search depth
  - Older generation
- **Entry Types**:
  - `EXACT`: Exact score (search completed within alpha-beta window)
  - `LOWER_BOUND`: Fail-high (score >= beta)
  - `UPPER_BOUND`: Fail-low (score <= alpha)

**Usage Pattern:**
```typescript
// Before searching
const ttEntry = transpositionTable.probe(hash, depth, alpha, beta);
if (ttEntry && canUseScore(ttEntry)) {
    return ttEntry.score;  // Cache hit!
}

// After searching
transpositionTable.store(hash, depth, score, type, bestMove);
```

**Impact:**
- 60-80% cache hit rate in typical positions
- Dramatically reduces nodes searched
- Especially effective in endgames with repeated positions

### 2. Zobrist Hashing

**Location:** `src/core/zobrist.ts`

**Purpose:** Fast, incremental position identification for transposition table.

**Algorithm:**
1. Initialize random 64-bit numbers for:
   - Each piece type on each square (12 × 64)
   - Side to move (1)
   - Castling rights (4)
   - En passant file (8)

2. Position hash = XOR of all active keys

**Properties:**
- **Speed**: O(1) for incremental updates (XOR is reversible)
- **Uniqueness**: Collision probability ≈ 1 / 2^64 (negligible)
- **Incrementality**: Add/remove pieces with single XOR operation

**Implementation:**
```typescript
// Initial hash computation
let hash = 0n;
for each piece on board:
    hash ^= pieceKeys[piece][square];
if (whiteToMove):
    hash ^= sideKey;
// ... castling rights, en passant

// Incremental update (move piece)
hash ^= pieceKeys[piece][fromSquare];  // Remove from old square
hash ^= pieceKeys[piece][toSquare];    // Add to new square
```

**Initialization:** Seeded PRNG for deterministic hashing across sessions

### 3. Move Ordering

**Location:** `src/ai/MoveOrdering.ts`

**Purpose:** Order moves to maximize alpha-beta pruning efficiency. Better moves searched first = more cutoffs = less computation.

**Ordering Priority:**

| Priority | Move Type | Score | Explanation |
|----------|-----------|-------|-------------|
| 1 | PV Move | 1,000,000 | Best move from previous iteration/TT |
| 2 | Queen Promotion | 800,000 | Almost always winning |
| 3 | Winning Capture | 900,000+ | MVV-LVA score added |
| 4 | Killer Move | 700,000 | Non-capture that caused cutoff |
| 5 | Equal Capture | 900,000 | Same piece value exchange |
| 6 | Quiet Move | 0 | Normal moves |
| 7 | Losing Capture | -100,000 | Capturing less valuable piece |

**MVV-LVA (Most Valuable Victim - Least Valuable Attacker):**
```typescript
score = victimValue * 10 - attackerValue

// Example:
// Pawn takes Queen: 9*10 - 1 = 89 (excellent)
// Queen takes Pawn: 1*10 - 9 = 1 (poor)
```

**Killer Moves:**
- Store 2 non-capture moves per ply that caused beta cutoff
- Heuristic: moves that were good in sibling nodes often work here
- Storage: 2 moves × 64 plies = 128 moves total

**Impact:**
- 2-3x reduction in nodes searched
- Critical for deep searches (levels 3-4)
- Most effective with PV moves from transposition table

### 4. Iterative Deepening

**Location:** `src/ai/Search.ts` - `findBestMove()` method

**Purpose:** Search progressively deeper depths (1, 2, 3, ..., target) before final search.

**Algorithm:**
```typescript
for depth = 1 to targetDepth - 1:
    search(board, depth)
    // Results stored in transposition table

// Final search with best move ordering
search(board, targetDepth)
```

**Benefits:**
1. **Move Ordering**: Shallow searches find best moves for deeper searches
2. **TT Population**: Fills transposition table with useful positions
3. **Minimal Overhead**: ~5-10% time cost due to exponential search tree
4. **Time Management**: Can stop early if time limit reached (future feature)

**Cost Analysis:**
- Depth 1: ~20 nodes
- Depth 2: ~400 nodes
- Depth 3: ~8,000 nodes
- Depth 4: ~160,000 nodes

Total overhead: (20 + 400 + 8,000) / 160,000 ≈ 5%

**Implementation:**
```typescript
// Only use iterative deepening for depths > 2
if (baseDepth > 2) {
    for (let depth = 1; depth < baseDepth; depth++) {
        searchDepth(board, depth, depth + 1, moves);
    }
}
```

## Position Evaluation

**Location:** `src/ai/Evaluator.ts`

**Purpose:** Assign a numeric score to a chess position from a player's perspective. Positive = good for player, negative = bad.

### Evaluation Components

#### 1. Material Balance

**Values** (in pawns):
- Pawn: 1
- Knight: 3
- Bishop: 3
- Rook: 5
- Queen: 9
- King: 10 (for capture detection)

**Multiplier:** 10 (scores in centipawns for precision)

**Calculation:**
```typescript
let score = 0;
for each piece on board:
    value = PIECE_VALUES[piece] * 10;
    if (piece belongs to player):
        score += value;
    else:
        score -= value;
```

#### 2. Piece-Square Tables

**Purpose:** Encourage pieces to occupy strategic squares.

**Tables:** 8×8 grids with positional bonuses for each piece type

**Example - Pawn Table (white perspective):**
```
  A   B   C   D   E   F   G   H
8 [0.0 0.0 0.0 0.0 0.0 0.0 0.0 0.0]  Promotion rank
7 [5.0 5.0 5.0 5.0 5.0 5.0 5.0 5.0]  Near promotion
6 [1.0 1.0 2.0 3.0 3.0 2.0 1.0 1.0]  Advanced
5 [0.5 0.5 1.0 2.5 2.5 1.0 0.5 0.5]  Center control
4 [0.0 0.0 0.0 2.0 2.0 0.0 0.0 0.0]  Central push
3 [0.5 0.0 1.0 0.0 0.0 1.0 0.0 0.5]  Development
2 [0.5 0.0 0.0-2.0-2.0 0.0 0.0 0.5]  Starting rank
1 [0.0 0.0 0.0 0.0 0.0 0.0 0.0 0.0]  Invalid
```

**Key Principles:**
- **Pawns**: Advance toward promotion, control center
- **Knights**: Avoid edges, prefer center
- **Bishops**: Long diagonals, avoid corners
- **Rooks**: 7th rank, open files
- **Queen**: Active but safe squares
- **King**: Castle position (middlegame), center (endgame)

**Black Pieces:** Tables are vertically flipped for black's perspective

**Multiplier:** 0.5 (half a centipawn per bonus point)

#### 3. Special Positions

**Checkmate:**
```typescript
if (checkmate):
    if (player is mated):
        return SCORE_MIN + depth  // Prefer longer mates (from opponent's view)
    else:
        return SCORE_MAX - depth  // Prefer shorter mates
```

**Stalemate:**
```typescript
if (stalemate):
    return 0  // Draw is neutral
```

### Complete Evaluation Function

```typescript
function evaluate(board, playerColor, depth = 0):
    if (checkmate):
        return mateScore(board, playerColor, depth)
    if (stalemate):
        return 0

    materialScore = evaluateMaterial(board, playerColor)
    positionalScore = evaluatePieceSquareTables(board, playerColor)

    return materialScore + positionalScore
```

## Search Enhancements

### Aspiration Windows (Not Implemented)

**Concept:** Narrow alpha-beta window around expected score
**Benefit:** More cutoffs in stable positions
**Future Enhancement:** Use previous iteration's score ± margin

### Principal Variation Search (Not Implemented)

**Concept:** Search first move with full window, rest with null window
**Benefit:** Faster search if first move is best
**Future Enhancement:** After iterative deepening orders moves

### Null Move Pruning (Not Implemented)

**Concept:** If position is good even after skipping a move, prune
**Benefit:** Aggressive pruning in non-zugzwang positions
**Caution:** Must verify not in zugzwang situations

### Late Move Reductions (Not Implemented)

**Concept:** Search late moves (after ordering) with reduced depth
**Benefit:** Focus search on promising moves
**Future Enhancement:** Reduce depth for moves beyond 4th move

## Data Structures

### InternalBoard

**Location:** `src/types/board.types.ts`

**Structure:**
```typescript
interface InternalBoard {
    // Piece representation
    mailbox: Int8Array;          // 64-element array, piece per square

    // Bitboards for efficient position queries
    whitePieces: Bitboard;       // All white pieces
    blackPieces: Bitboard;       // All black pieces
    allPieces: Bitboard;         // All pieces
    whitePawns: Bitboard;        // White pawns
    // ... one bitboard per piece type per color

    // Game state
    turn: InternalColor;         // WHITE or BLACK
    castlingRights: {
        whiteShort: boolean;
        whiteLong: boolean;
        blackShort: boolean;
        blackLong: boolean;
    };
    enPassantSquare: SquareIndex | null;
    halfMoveClock: number;
    fullMoveNumber: number;

    // Cached information
    zobristHash: bigint;
    isCheck: boolean;
    isCheckmate: boolean;
    isStalemate: boolean;
}
```

**Design Rationale:**
- **Mailbox + Bitboards**: Hybrid approach for flexibility
- **Cached Status**: Avoid repeated check detection
- **Zobrist Hash**: Always up-to-date for TT lookups

### InternalMove

**Location:** `src/types/move.types.ts`

**Structure:**
```typescript
interface InternalMove {
    from: SquareIndex;           // 0-63
    to: SquareIndex;             // 0-63
    piece: Piece;                // Moving piece
    capturedPiece: Piece;        // EMPTY or captured piece
    flags: MoveFlag;             // Bitfield for move type
    promotionPiece?: Piece;      // For pawn promotions
}

enum MoveFlag {
    NONE = 0,
    CAPTURE = 1 << 0,            // 0001
    CASTLING = 1 << 1,           // 0010
    EN_PASSANT = 1 << 2,         // 0100
    PROMOTION = 1 << 3,          // 1000
    PAWN_DOUBLE_PUSH = 1 << 4,   // 10000
}
```

**Benefits:**
- **Compact**: Single integer for move type
- **Fast Queries**: Bitwise operations
- **Complete**: All information for unmake/remake

## Performance Metrics

### AI Level Configuration

**Location:** `src/ai/AIEngine.ts`

```typescript
const LEVEL_CONFIG: Record<AILevel, LevelConfig> = {
    0: { baseDepth: 1, extendedDepth: 2 },  // ~3ms
    1: { baseDepth: 2, extendedDepth: 3 },  // ~50ms
    2: { baseDepth: 3, extendedDepth: 4 },  // ~300ms
    3: { baseDepth: 4, extendedDepth: 5 },  // ~2s
    4: { baseDepth: 5, extendedDepth: 6 },  // ~7s
};
```

### Performance Comparison

| Optimization | Enabled | Test Time | Speedup |
|--------------|---------|-----------|---------|
| Baseline (none) | No | 16.3s | 1.0× |
| + Transposition Table | Yes | 8.5s | 1.9× |
| + Move Ordering | Yes | 6.2s | 2.6× |
| + Iterative Deepening | Yes | 5.6s | 2.9× |
| **All Optimizations** | **Yes** | **5.6s** | **2.9×** |

**Overall Improvement:** 65% faster (2.9× speedup)

### Nodes Searched (Middle Game Position, Depth 4)

| Configuration | Nodes | Time |
|--------------|--------|------|
| No optimizations | ~160,000 | 2.1s |
| With optimizations | ~45,000 | 0.7s |

**Node Reduction:** 72% fewer nodes evaluated

### Cache Statistics

**Typical Values (Depth 4 search with default settings):**
- Total lookups: ~50,000
- Cache hits: ~35,000 (70% hit rate)
- Stored entries: ~12,000 unique positions
- Memory usage: ~480KB (of 16MB allocated in Node.js, or ~480KB of 1MB in browser)

## Future Enhancements

### High Priority

1. **Opening Book**
   - Pre-computed opening moves
   - Format: JSON or binary format
   - Location: `src/ai/OpeningBook.ts`
   - Benefit: Instant move in opening phase

2. **Endgame Tablebases**
   - Perfect play for ≤5 pieces
   - Syzygy format compatibility
   - Location: `src/ai/Tablebase.ts`
   - Benefit: Guaranteed wins/draws in endgames

3. **Parallel Search**
   - Multi-threaded search with Web Workers
   - Lazy SMP (Shared Memory Parallelism)
   - Location: `src/ai/ParallelSearch.ts`
   - Benefit: Utilize multi-core processors

### Medium Priority

4. **Principal Variation Search (PVS)**
   - Search PV with full window, rest with null window
   - Location: `Search.ts` enhancement
   - Benefit: 10-20% speedup

5. **Null Move Pruning**
   - Skip move and verify position still good
   - Zugzwang detection required
   - Location: `Search.ts` enhancement
   - Benefit: 20-30% speedup in middlegame

6. **Late Move Reductions (LMR)**
   - Reduce depth for unlikely moves
   - Re-search if promising
   - Location: `Search.ts` enhancement
   - Benefit: 15-25% deeper search

### Low Priority

7. **Aspiration Windows**
   - Narrow alpha-beta windows
   - Re-search on failure
   - Location: `Search.ts` enhancement
   - Benefit: 5-10% speedup

8. **Singular Extensions**
   - Extend search if one move clearly best
   - Location: `Search.ts` enhancement
   - Benefit: Better tactical depth

## Developer Guide

### Adding a New Optimization

**Step 1: Plan**
- Identify bottleneck (profiling)
- Research technique
- Design API

**Step 2: Implement**
```typescript
// Create new file in src/ai/
export class NewOptimization {
    // Implementation
}

// Integrate in Search.ts
import { NewOptimization } from './NewOptimization';

class Search {
    private newOpt: NewOptimization;

    constructor() {
        this.newOpt = new NewOptimization();
    }

    // Use in search
}
```

**Step 3: Test**
```typescript
// Create test in test/unit/ or test/integration/
describe('NewOptimization', () => {
    it('should improve performance', () => {
        // Test implementation
    });
});
```

**Step 4: Benchmark**
```typescript
// Add to test/performance/search-benchmark.test.ts
it('should show NewOptimization effectiveness', () => {
    // Compare with/without optimization
});
```

**Step 5: Document**
- Add section to this file
- Update README.md if user-facing
- Add inline code comments

### Testing AI Changes

**Unit Tests:**
```bash
npm test -- test/unit/
```

**Integration Tests:**
```bash
npm test -- test/integration/ai.test.ts
```

**Performance Benchmarks:**
```bash
npm test -- test/performance/search-benchmark.test.ts
```

**Manual Testing:**
```typescript
import { Game } from './src';

const game = new Game();
console.time('AI Move');
const move = game.ai({ level: 3 });
console.timeEnd('AI Move');
console.log('Move:', move);
```

### Profiling

**Node.js Built-in Profiler:**
```bash
node --prof test-script.js
node --prof-process isolate-*-v8.log > processed.txt
```

**Chrome DevTools:**
```bash
node --inspect-brk test-script.js
# Open chrome://inspect
```

### Debugging Search

**Enable Debug Logging:**
```typescript
// In Search.ts, add logging
private alphaBeta(...) {
    console.log(`Depth: ${depth}, Alpha: ${alpha}, Beta: ${beta}`);
    // ... rest of function
}
```

**Visualize Search Tree:**
```typescript
// Track nodes visited
private searchTree: any[] = [];

private alphaBeta(...) {
    this.searchTree.push({ depth, alpha, beta, moves });
    // ... search
}

// After search
console.log(JSON.stringify(this.searchTree, null, 2));
```

## Conclusion

This AI implementation represents a modern, efficient chess engine suitable for web applications and Node.js environments. The combination of classical algorithms (minimax, alpha-beta) with contemporary optimizations (transposition table, move ordering, iterative deepening) provides strong play at reasonable computational cost.

**Key Achievements:**
- ✅ 65% performance improvement
- ✅ Competitive play at all difficulty levels
- ✅ Clean, maintainable architecture
- ✅ Comprehensive test coverage
- ✅ Full TypeScript type safety

**For questions or contributions, see the main project repository.**
