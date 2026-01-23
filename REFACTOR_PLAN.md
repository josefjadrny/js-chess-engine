# js-chess-engine v2 Refactor Plan

## Overview

Complete rewrite of js-chess-engine in TypeScript with optimized internals while maintaining 100% API compatibility with v1. Focus on performance (2x faster move generation, 40% faster AI) and smarter AI through modern chess engine techniques.

## Goals

1. **Performance**: 2-3x faster move generation, 40-50% faster AI
2. **Smarter AI**: Transposition table, move ordering, better evaluation, deeper search
3. **Type Safety**: Full TypeScript with strict mode
4. **API Compatibility**: All 72 existing tests must pass unchanged
5. **Maintainability**: Clean, modular architecture

## Key Architecture Decisions

### 1. Hybrid Board Representation

**Internal (Performance):**
- **Bitboards** (BigInt 64-bit) for attack detection and piece locations
- **Mailbox** (Int8Array[64]) for O(1) piece lookup by square index
- **Zobrist hashing** for transposition table lookups
- Primitive types only (fast copy/compare)

**External (API Compatibility):**
- Object with string keys: `{E1: 'K', A1: 'R', ...}`
- FEN string support
- Case-insensitive square notation

**Conversion Layer:**
- `APIAdapter` converts between internal (0-63 indices) and external (A1-H8 strings)
- Maintains v1 API surface while using optimized internals

### 2. Performance Optimizations

**V1 Bottlenecks Identified:**
1. Creates 30-40 Board instances per `getMoves()` call
2. 8 separate while-loops in `isPieceUnderAttack()`
3. Array spread operators for concatenation
4. `JSON.parse(JSON.stringify())` for deep cloning everywhere
5. No move caching or transposition table
6. No move ordering in search
7. Basic minimax without proper alpha-beta

**V2 Solutions:**
1. Struct-based board copy (200 bytes) instead of class instantiation
2. Single bitboard AND operation for attack detection
3. Pre-allocated move arrays with pooling
4. Direct memory copy for board state
5. Transposition table (1M entries, ~100MB)
6. MVV-LVA + killer moves + history heuristic
7. Full alpha-beta with quiescence search

### 3. AI Improvements

**Enhanced Search:**
- Proper alpha-beta pruning (vs v1's basic mate pruning)
- Transposition table (50% node reduction expected)
- Move ordering (captures, TT move, killers, history)
- Quiescence search (avoid horizon effect)
- Deeper search: Level 2: 3-4 ply (vs v1: 2-4), Level 3: 4-5 ply (vs v1: 3-4)

**Enhanced Evaluation:**
- Material (existing)
- Piece-square tables (improved)
- **NEW**: Pawn structure (doubled, isolated, passed, chains)
- **NEW**: King safety (pawn shield, attack zones)
- **NEW**: Piece mobility (legal moves per piece)
- **NEW**: Rook bonuses (open files, 7th rank)

## Module Structure

```
src/
├── index.ts                    # Public API (Game class + stateless functions)
├── types/
│   ├── index.ts               # Export all types
│   ├── board.types.ts         # Board configuration, public API types
│   ├── move.types.ts          # Move types (internal & external)
│   └── ai.types.ts            # AI/search types
├── core/
│   ├── Board.ts               # Internal board representation (bitboards + mailbox)
│   ├── MoveGenerator.ts       # Move generation with bitboard operations
│   ├── AttackDetector.ts      # Attack detection using bitboards
│   ├── Position.ts            # Bitboard utilities and operations
│   └── zobrist.ts             # Zobrist hashing for TT
├── ai/
│   ├── AIEngine.ts            # Main AI orchestration
│   ├── Search.ts              # Alpha-beta search implementation
│   ├── Evaluator.ts           # Position evaluation (material, pawn structure, etc.)
│   ├── TranspositionTable.ts  # Hash table for position caching
│   └── MoveOrdering.ts        # MVV-LVA, killers, history
├── utils/
│   ├── fen.ts                 # FEN parsing and generation
│   ├── validation.ts          # Input validation
│   ├── constants.ts           # Game constants
│   └── conversion.ts          # Square/index conversion utilities
└── adapters/
    └── APIAdapter.ts          # Convert between internal/external representations
```

## Implementation Phases

### Phase 1: Core Foundation ✅ COMPLETE

**Goal**: Basic internal representation and utilities

**Tasks:**
- [x] Project structure and TypeScript configuration
- [x] All type definitions (`types/`)
- [x] Square/index conversion (`utils/conversion.ts`)
- [x] Constants (`utils/constants.ts`)
- [x] Internal board structure (`core/Board.ts`)
- [x] Zobrist hashing (`core/zobrist.ts`)
- [x] Unit tests for conversions and board creation

**Deliverable**: ✅ Can create internal board, convert squares, compute hashes

### Phase 2: Move Generation ✅ COMPLETE

**Goal**: Fast, correct move generation

**Tasks:**
- [x] Bitboard operations (`core/Position.ts`)
- [x] Magic bitboard generation for sliding pieces
- [x] Attack detection (`core/AttackDetector.ts`)
- [x] Move generator for all piece types (`core/MoveGenerator.ts`)
- [x] Special moves: castling, en passant, promotion
- [x] Move generation tests (145 tests including edge cases)
- [x] Castling bug fix (piece presence validation)

**Deliverable**: ✅ Correct move generation passing all tests with 100% accuracy

### Phase 3: API Layer ✅ COMPLETE

**Goal**: v1 API compatibility

**Tasks:**
- [x] API adapter (`adapters/APIAdapter.ts`)
  - Square string ↔ index conversion
  - Internal board ↔ public config conversion
  - Internal moves ↔ public move map conversion
- [x] FEN parser (`utils/fen.ts`)
- [x] FEN formatter (`utils/fen.ts`)
- [x] Game class (`index.ts`)
  - Constructor (JSON config, FEN, default)
  - `move(from, to)`
  - `moves(from?)`
  - `setPiece()`, `removePiece()`
  - `getHistory()`
  - `exportJson()`, `exportFEN()`
  - `printToConsole()`
- [x] Stateless functions (`index.ts`)
  - `moves()`, `status()`, `getFen()`, `move()`, `aiMove()` (placeholder)
- [x] FEN tests (10 tests) - all passing
- [x] API tests (22 tests) - all passing

**Deliverable**: ✅ Full API working, 176/177 tests passing (1 Phase 2 stalemate edge case)

### Phase 4: Basic AI

**Goal**: AI at v1 parity

**Tasks:**
- [ ] Basic evaluator (`ai/Evaluator.ts`)
  - Material counting
  - Piece-square tables
- [ ] Simple alpha-beta search (`ai/Search.ts`)
  - Minimax with alpha-beta pruning
  - Depth-limited search
- [ ] AI engine (`ai/AIEngine.ts`)
  - Level → depth mapping
  - Search orchestration
- [ ] `aiMove()` implementation in Game class
- [ ] Port AI tests (5 tests)

**Deliverable**: All 72 tests passing, AI functional

### Phase 5: AI Enhancements

**Goal**: Smarter, faster AI

**Tasks:**
- [ ] Transposition table (`ai/TranspositionTable.ts`)
  - Hash storage with replacement strategy
  - Probe/store with depth/age tracking
- [ ] Move ordering (`ai/MoveOrdering.ts`)
  - MVV-LVA for captures
  - TT move first
  - Killer moves
  - History heuristic
- [ ] Quiescence search in `Search.ts`
  - Capture-only search
  - Static evaluation fallback
- [ ] Enhanced evaluation (`ai/Evaluator.ts`)
  - Pawn structure analysis
  - King safety scoring
  - Piece mobility
  - Rook bonuses
- [ ] AI tests for new features
- [ ] Performance benchmarks vs v1

**Deliverable**: AI 40% faster with smarter play

### Phase 6: Optimization & Polish

**Goal**: Production ready

**Tasks:**
- [ ] Performance profiling
- [ ] Hot path optimizations
- [ ] Memory usage optimization
- [ ] Documentation (JSDoc comments)
- [ ] Update README examples
- [ ] Performance verification
  - Move generation: 2x faster than v1
  - AI search: 40% faster than v1
  - Memory: 10x less than v1
- [ ] Final test suite run
- [ ] Build verification

**Deliverable**: Production-ready v2

## Critical Files

### New Files (Core Implementation)

1. **`src/core/Board.ts`** - Internal board with bitboards + mailbox
   - Represents game state as primitive types
   - BitBoards for each piece type per color
   - Int8Array mailbox for piece lookup
   - Zobrist hash for TT

2. **`src/core/MoveGenerator.ts`** - Optimized move generation
   - Bitboard-based pseudo-legal moves
   - Legal move filtering via attack detection
   - Generator pattern for lazy evaluation
   - Magic bitboards for sliding pieces

3. **`src/core/AttackDetector.ts`** - Fast attack detection
   - Single bitboard operations (no loops)
   - Pre-computed attack tables
   - Check/checkmate detection

4. **`src/ai/Search.ts`** - Alpha-beta with TT
   - Proper alpha-beta pruning
   - Transposition table probing/storing
   - Move ordering integration
   - Quiescence search

5. **`src/ai/Evaluator.ts`** - Enhanced position evaluation
   - Material + piece-square tables
   - Pawn structure (doubled, isolated, passed)
   - King safety (shield, attack zones)
   - Piece mobility

6. **`src/ai/TranspositionTable.ts`** - Position caching
   - Map-based hash table (1M entries)
   - Depth-preferred replacement
   - Exact/lowerbound/upperbound flags

7. **`src/adapters/APIAdapter.ts`** - Internal ↔ External conversion
   - Square string ↔ index (A1 ↔ 0)
   - Board config ↔ internal board
   - Move map ↔ internal moves
   - Case-insensitive handling

8. **`src/index.ts`** - Public Game class API
   - Maintains v1 API exactly
   - Uses internal board underneath
   - Converts via APIAdapter

### Modified/Ported Files

9. **`test/moves.test.ts`** - Port 45 move tests from v1
10. **`test/ai.test.ts`** - Port 5 AI tests from v1
11. **`test/importExport.test.ts`** - Port 10 FEN tests from v1

## Performance Targets

| Metric | v1 Baseline | v2 Target |
|--------|-------------|-----------|
| Move generation (opening) | ~10ms | <5ms (2x faster) |
| AI Level 2 move | ~700ms | <400ms (40% faster) |
| AI Level 3 move | ~4600ms | <2500ms (45% faster) |
| Memory per getMoves() | ~40KB | ~5KB (8x less) |

## Testing Strategy

### Test Categories

1. **Unit Tests** - Internal components
   - Board operations
   - Bitboard utilities
   - Conversion functions
   - Zobrist hashing
   - Move ordering

2. **Integration Tests** - API compatibility (72 tests from v1)
   - Move generation (45 tests)
   - Castling (5 tests)
   - En passant (4 tests)
   - Check/checkmate (19 tests)
   - FEN import/export (10 tests)
   - AI moves (5 tests)
   - History, setPiece, removePiece

3. **Performance Tests** - Benchmarks vs v1
   - Move generation speed
   - AI search speed
   - Memory usage
   - Perft tests (move generation correctness)

4. **Correctness Tests**
   - Perft (performance test) for move accuracy
   - Known positions with expected evaluations
   - Tactical puzzles

### Test Pass Criteria

- ✅ All 72 v1 tests pass unchanged
- ✅ New unit tests pass
- ✅ Move generation 2x faster
- ✅ AI 40% faster
- ✅ Perft tests match known results
- ✅ No regressions in play quality

## Verification Steps

After implementation:

### 1. Functional Verification

```bash
npm run test              # All 72+ tests pass
npm run build             # TypeScript compiles
```

### 2. API Compatibility

```typescript
// Test v1 API patterns
const game = new Game()
game.move('E2', 'E4')
game.aiMove(2)
game.exportFEN()
game.exportJson()
```

### 3. Performance Verification

```bash
npm run test:performance  # Benchmark vs v1
# Verify: move gen >2x faster, AI >40% faster
```

### 4. Integration Test

```typescript
// Play a full game
const game = new Game()
while (!game.exportJson().isFinished) {
  game.aiMove(2)  // White
  if (!game.exportJson().isFinished) {
    game.aiMove(2)  // Black
  }
}
// Should complete without errors
```

### 5. Correctness Verification

```bash
npm run test:perft        # Verify move counts
# Position depth 5: expect 4,865,609 nodes
```

## Risk Mitigation

1. **API Compatibility Risk**
   - Mitigation: Port all v1 tests first, ensure they pass
   - Adapter layer isolates internal changes

2. **Performance Risk**
   - Mitigation: Benchmark each phase, profile hot paths
   - Can fallback to simpler optimizations if bitboards too complex

3. **Correctness Risk**
   - Mitigation: Perft tests, existing test suite, tactical puzzles
   - Incremental implementation with testing at each phase

4. **Complexity Risk**
   - Mitigation: Phased approach, working code at each phase
   - Can ship Phase 4 (v1 parity) if Phase 5 takes too long

## Success Criteria

- ✅ All 72 v1 tests pass
- ✅ Move generation 2x faster
- ✅ AI 40% faster
- ✅ Memory usage significantly reduced
- ✅ TypeScript strict mode with no errors
- ✅ No external dependencies (except dev)
- ✅ Smarter AI (better evaluation)
- ✅ Clean, maintainable code structure

---

**Current Status**: Phase 3 Complete ✅ | [See PHASE3_SUMMARY.md](./PHASE3_SUMMARY.md)
