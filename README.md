# JS-CHESS-ENGINE

![GitHub package.json version](https://img.shields.io/github/package-json/v/josefjadrny/js-chess-engine)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Complete TypeScript chess engine without dependencies for Node.js >=24 and browsers. Includes configurable AI with difficulty levels 1-5.

**⚠️ Upgrading from v1?** See [Breaking Changes](#breaking-changes-from-v1) section at the end of this document

## Install

**Install with npm**

```bash
npm i js-chess-engine --save
```

**or install with yarn**

```bash
yarn add js-chess-engine
```

**Node.js Requirement:** Node.js >=24 is required for v2.

## Import

### TypeScript / ESM

```typescript
// Import Game class and stateless functions
import { Game, moves, status, move, aiMove, getFen } from 'js-chess-engine'

// Import types for TypeScript
import type { BoardConfig, PieceSymbol, MovesMap, AILevel } from 'js-chess-engine'

const game = new Game()
```

### CommonJS (Node.js)

```javascript
const { Game, moves, status, move, aiMove, getFen } = require('js-chess-engine')

const game = new Game()
```

### React / Modern JavaScript

```typescript
import { Game } from 'js-chess-engine'
import type { BoardConfig, MovesMap } from 'js-chess-engine'

const game = new Game()
const allMoves: MovesMap = game.moves()
```

## Examples

**js-chess-engine-app** - React application example with js-chess-engine REST API backend (without persistent storage) - [GitHub](https://github.com/josefjadrny/js-chess-engine-app) or [LIVE DEMO](http://chess.josefjadrny.info/)

**Note:** Additional examples for v2 (server, console, AI match) will be added in a future release.

## Documentation

You have two options for using this engine:

- [Option 1 - With in-memory (Game class)](#option-1---with-in-memory)
- [Option 2 - Without in-memory (Stateless functions)](#option-2---without-in-memory)

### Option 1 - With in-memory

Use the Game class to create and manage a chess game. In this mode, the game state is cached in memory for better performance.

```typescript
import { Game } from 'js-chess-engine'
import type { BoardConfig, MovesMap } from 'js-chess-engine'

const game = new Game()
```

You can export your game to JSON or FEN at any time and use these formats to restore your game later.

#### API Description

**constructor**

`new Game(configuration)` - Create a new game with optional initial configuration.

Params:
- `configuration` BoardConfig | string (_optional_) - Chess board [configuration](#board-configuration) (JSON object or FEN string). Default is standard starting position.

```typescript
import { Game } from 'js-chess-engine'
import type { BoardConfig } from 'js-chess-engine'

// New game with starting position
const game1 = new Game()

// From FEN string
const game2 = new Game('rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1')

// From BoardConfig object
const config: BoardConfig = { /* ... */ }
const game3 = new Game(config)
```

**move**

`game.move(from, to)` - Perform a move on the chessboard and recalculate game state. **Returns full BoardConfig object** (breaking change from v1).

Params:
- `from` string (_mandatory_) - Starting square (case-insensitive, e.g., 'E2' or 'e2')
- `to` string (_mandatory_) - Destination square (case-insensitive, e.g., 'E4' or 'e4')

Returns: `BoardConfig` - Full board configuration after the move

```typescript
import type { BoardConfig } from 'js-chess-engine'

const newConfig: BoardConfig = game.move('E2', 'E4')
console.log(newConfig.pieces)  // {"E4": "P", "E1": "K", ...}
```

**moves**

`game.moves(from?)` - Get all legal moves for the current player. Optionally filter by a specific square.

Params:
- `from` string (_optional_) - Square to filter moves from (case-insensitive, e.g., 'E2'). If omitted, returns moves for all pieces.

Returns: `MovesMap` - Object mapping from-squares to arrays of to-squares

```typescript
import type { MovesMap } from 'js-chess-engine'

// Get all moves (no parameter)
const allMoves: MovesMap = game.moves()
// {"E2": ["E3", "E4"], "B1": ["A3", "C3"], ...}

// Get moves for specific square
const pawnMoves: MovesMap = game.moves('E2')
// {"E2": ["E3", "E4"]}
```

**setPiece**

`game.setPiece(location, piece)` - Add or replace a chess piece at the specified location.

Params:
- `location` string (_mandatory_) - Square location (case-insensitive, e.g., 'E2')
- `piece` PieceSymbol (_mandatory_) - Piece symbol using FEN notation (K, Q, R, B, N, P for white; k, q, r, b, n, p for black)

```typescript
import type { PieceSymbol } from 'js-chess-engine'

const piece: PieceSymbol = 'Q'
game.setPiece('E5', piece)
```

**removePiece**

`game.removePiece(location)` - Remove a piece from the specified location.

Params:
- `location` string (_mandatory_) - Square location (case-insensitive, e.g., 'E2')

```typescript
game.removePiece('E5')
```

**aiMove**

`game.aiMove(level)` - Calculate and perform the best move for the current player using AI. **Returns only the move** (v1 API compatible).

Params:
- `level` AILevel (_optional_) - AI difficulty level (1-5). See [Computer AI](#computer-ai) section. Default: 3

Returns: `HistoryEntry` - The played move (e.g., `{"E2": "E4"}`)

```typescript
import type { HistoryEntry, AILevel } from 'js-chess-engine'

const level: AILevel = 4
const move: HistoryEntry = game.aiMove(level)
console.log(move) // {"E2": "E4"}

// To get board state after move, use exportJson()
const board = game.exportJson()
```

**ai**

`game.ai(options?)` - Calculate the best move using AI. **Returns both the move and board state**.

Params:
- `options` object (_optional_) - Configuration options:
  - `level` number (_optional_) - AI difficulty level (1-5). See [Computer AI](#computer-ai) section. Default: `3`
  - `play` boolean (_optional_) - Whether to apply the move to the game. Default: `true`. If `false`, returns the move without modifying the game state, and `board` will contain the current state (before the move).
  - `ttSizeMB` number (_optional_) - Transposition table size in MB (0 to disable, 0.25-256). Default: **auto-scaled by AI level**. See [Auto-Scaling Transposition Table](#transposition-table) for details.

Returns: `{ move: HistoryEntry, board: BoardConfig }` - Object containing the move and board state (current state if `play=false`, updated state if `play=true`)

```typescript
import type { HistoryEntry, BoardConfig } from 'js-chess-engine'

// Play the move (default behavior)
const result1 = game.ai({ level: 4 })
console.log(result1.move)       // {"E2": "E4"}
console.log(result1.board.turn) // "black" (updated after move)

// Analysis mode: get move without applying it
const result2 = game.ai({ level: 4, play: false })
console.log(result2.move)       // {"E2": "E4"}
console.log(result2.board.turn) // "white" (current state, before move)

// Use default level 3
const result3 = game.ai()
console.log(result3.move) // AI move with level 3

// TT size auto-scales by level (see Auto-Scaling Transposition Table section)
const result4 = game.ai({ level: 5 })
console.log(result4.move) // Level 5: 64 MB Node.js / 32 MB browser (auto)

// Override TT size manually if needed
const result5 = game.ai({ level: 3, ttSizeMB: 128 })
console.log(result5.move) // Force 128MB cache

// Ultra-lightweight mode for low-end devices
const result6 = game.ai({ level: 2, ttSizeMB: 0.5 })
console.log(result6.move) // Force 512KB cache
```

**getHistory**

`game.getHistory()` - Get all played moves with board states.

Returns: Array of objects containing move and resulting board configuration

```typescript
const history = game.getHistory()
// [
//   { move: {"E2": "E4"}, pieces: {...}, turn: "black", ... },
//   { move: {"E7": "E5"}, pieces: {...}, turn: "white", ... }
// ]
```

**printToConsole**

`game.printToConsole()` - Print an ASCII representation of the chessboard to console.

```typescript
game.printToConsole()
//   +---+---+---+---+---+---+---+---+
// 8 | r | n | b | q | k | b | n | r |
//   +---+---+---+---+---+---+---+---+
// 7 | p | p | p | p | p | p | p | p |
//   +---+---+---+---+---+---+---+---+
// ...
```

**exportJson**

`game.exportJson()` - Export current game state as a JSON BoardConfig object.

Returns: `BoardConfig` - Full board configuration

```typescript
import type { BoardConfig } from 'js-chess-engine'

const config: BoardConfig = game.exportJson()
```

**exportFEN**

`game.exportFEN()` - Export current game state as a FEN string.

Returns: string - [FEN notation](https://en.wikipedia.org/wiki/Forsyth%E2%80%93Edwards_Notation)

```typescript
const fen: string = game.exportFEN()
// "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1"
```

### Option 2 - Without in-memory

Call stateless functions directly without creating a Game object. This is ideal for serverless environments or when you want to manage state externally.

```typescript
import { move, moves, status, aiMove, ai, getFen } from 'js-chess-engine'
import type { BoardConfig, MovesMap } from 'js-chess-engine'
```

These functions require a board configuration for each call (either a BoardConfig object or FEN string).

#### API Description

**moves**

`moves(boardConfiguration)` - Get all legal moves for the current player.

Params:
- `boardConfiguration` BoardConfig | string (_mandatory_) - Board [configuration](#board-configuration) (JSON object or FEN string)

Returns: `MovesMap` - Object mapping from-squares to arrays of to-squares

```typescript
import { moves } from 'js-chess-engine'
import type { MovesMap, BoardConfig } from 'js-chess-engine'

// From BoardConfig object
const config: BoardConfig = { /* ... */ }
const allMoves: MovesMap = moves(config)
// {"E2": ["E3", "E4"], "B1": ["A3", "C3"], ...}

// From FEN string
const fenMoves: MovesMap = moves('rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1')
```

**status**

`status(boardConfiguration)` - Get calculated board configuration with current game status. Useful for converting FEN to JSON.

Params:
- `boardConfiguration` BoardConfig | string (_mandatory_) - Board [configuration](#board-configuration)

Returns: `BoardConfig` - Full board configuration with status

```typescript
import { status } from 'js-chess-engine'
import type { BoardConfig } from 'js-chess-engine'

// Convert FEN to JSON
const config: BoardConfig = status('rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1')
console.log(config.turn)      // "black"
console.log(config.check)     // false
console.log(config.checkMate) // false
```

**getFen**

`getFen(boardConfiguration)` - Convert board configuration to FEN string.

Params:
- `boardConfiguration` BoardConfig | string (_mandatory_) - Board [configuration](#board-configuration)

Returns: string - [FEN notation](https://en.wikipedia.org/wiki/Forsyth%E2%80%93Edwards_Notation)

```typescript
import { getFen } from 'js-chess-engine'
import type { BoardConfig } from 'js-chess-engine'

const config: BoardConfig = { /* ... */ }
const fen: string = getFen(config)
```

**move**

`move(boardConfiguration, from, to)` - Perform a move and get the new board state. **Returns full BoardConfig object** (breaking change from v1).

Params:
- `boardConfiguration` BoardConfig | string (_mandatory_) - Board [configuration](#board-configuration)
- `from` string (_mandatory_) - Starting square (case-insensitive)
- `to` string (_mandatory_) - Destination square (case-insensitive)

Returns: `BoardConfig` - Full board configuration after the move

```typescript
import { move } from 'js-chess-engine'
import type { BoardConfig } from 'js-chess-engine'

// Move from FEN string
const config1: BoardConfig = move('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', 'E2', 'E4')

// Move on existing config
const config2: BoardConfig = move(config1, 'E7', 'E5')
```

**aiMove**

`aiMove(boardConfiguration, level)` - Calculate and return the best move using AI. **Returns only the move** (v1 API compatible).

Params:
- `boardConfiguration` BoardConfig | string (_mandatory_) - Board [configuration](#board-configuration)
- `level` AILevel (_optional_) - AI difficulty level (1-5). Default: 3

Returns: `HistoryEntry` - The played move (e.g., `{"E2": "E4"}`)

```typescript
import { aiMove } from 'js-chess-engine'
import type { HistoryEntry, AILevel } from 'js-chess-engine'

const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
const level: AILevel = 4
const move: HistoryEntry = aiMove(fen, level)
console.log(move) // {"E2": "E4"}
```

**ai**

`ai(boardConfiguration, options?)` - Calculate the best move using AI. **Returns both the move and board state**.

Params:
- `boardConfiguration` BoardConfig | string (_mandatory_) - Board [configuration](#board-configuration)
- `options` object (_optional_) - Configuration options:
  - `level` number (_optional_) - AI difficulty level (1-5). Default: `3`
  - `play` boolean (_optional_) - Whether to apply the move to the board. Default: `true`. If `false`, returns the move without modifying the board state, and `board` will contain the current state (before the move).
  - `ttSizeMB` number (_optional_) - Transposition table size in MB (0 to disable, 0.25-256). Default: **auto-scaled by AI level**. See [Auto-Scaling Transposition Table](#transposition-table) for details.

Returns: `{ move: HistoryEntry, board: BoardConfig }` - Object containing the move and board state (current state if `play=false`, updated state if `play=true`)

```typescript
import { ai } from 'js-chess-engine'
import type { HistoryEntry, BoardConfig } from 'js-chess-engine'

const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'

// Play the move (default behavior)
const result1 = ai(fen, { level: 4 })
console.log(result1.move)       // {"E2": "E4"}
console.log(result1.board.turn) // "black" (updated after move)

// Analysis mode: get move without applying it
const result2 = ai(fen, { level: 4, play: false })
console.log(result2.move)       // {"E2": "E4"}
console.log(result2.board.turn) // "white" (current state, before move)

// Use default level 3
const result3 = ai(fen)
console.log(result3.move) // AI move with level 3

// TT size auto-scales by level (see Auto-Scaling Transposition Table section)
const result4 = ai(fen, { level: 5 })
console.log(result4.move) // Level 5: 64 MB Node.js / 32 MB browser (auto)

// Override TT size manually if needed
const result5 = ai(fen, { level: 3, ttSizeMB: 128 })
console.log(result5.move) // Force 128MB cache

// Ultra-lightweight mode for low-end devices
const result6 = ai(fen, { level: 2, ttSizeMB: 0.5 })
console.log(result6.move) // Force 512KB cache
```

### Board Configuration

Board configuration can be represented as either a JSON object (BoardConfig) or a FEN string.

#### JSON Format

The JSON format is convenient for modern applications where state is represented as objects (React, Redux, etc.).

```typescript
import type { BoardConfig } from 'js-chess-engine'

const config: BoardConfig = {
  "turn": "black",
  "pieces": {
    "E1": "K",
    "C1": "B",
    "E8": "k"
  },
  "isFinished": false,
  "check": false,
  "checkMate": false,
  "castling": {
    "whiteLong": true,
    "whiteShort": true,
    "blackLong": true,
    "blackShort": true
  },
  "enPassant": "E6",
  "halfMove": 0,
  "fullMove": 1
}
```

**turn** - Player to move next. Values: `"white"` (default) or `"black"`

**isFinished** - `true` when the game is over (checkmate or stalemate). Default: `false`

**check** - `true` when the current player is in check. Default: `false`

**checkMate** - `true` when the current player is checkmated. Default: `false`

**castling** - Castling availability for each side. `true` means castling is still possible. Default: all `true`
- `whiteLong` (queenside) - White king moves from E1 to C1
- `whiteShort` (kingside) - White king moves from E1 to G1
- `blackLong` (queenside) - Black king moves from E8 to C8
- `blackShort` (kingside) - Black king moves from E8 to G8

**enPassant** - If a pawn just made a two-square move, this is the square "behind" the pawn for [en passant](https://en.wikipedia.org/wiki/En_passant) capture. Default: `null`

**halfMove** - Number of halfmoves since the last capture or pawn advance. Used for the [fifty-move rule](https://en.wikipedia.org/wiki/Fifty-move_rule). Default: `0`

**fullMove** - Full move number. Starts at 1 and increments after Black's move. Default: `1`

**pieces** - Pieces on the board using FEN notation:

| Piece  | White | Black |
| :----: | :---: | :---: |
| Pawn   |   P   |   p   |
| Knight |   N   |   n   |
| Bishop |   B   |   b   |
| Rook   |   R   |   r   |
| Queen  |   Q   |   q   |
| King   |   K   |   k   |

#### FEN Format

You can also use [Forsyth–Edwards Notation (FEN)](https://en.wikipedia.org/wiki/Forsyth%E2%80%93Edwards_Notation):

```typescript
import { move } from 'js-chess-engine'

const fen = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1'
const newConfig = move(fen, 'H7', 'H5')
console.log(newConfig)
// BoardConfig object with updated position
```

### Computer AI

The engine includes a sophisticated AI based on the Minimax algorithm with alpha-beta pruning, enhanced with advanced performance optimizations. There are five difficulty levels:

| Level | Alias             | Description                          | Search Depth |
| :---: | :---------------- | :----------------------------------- | :----------: |
|   1   | Beginner          | Very weak play, minimal lookahead    | 1-2 ply      |
|   2   | Easy              | Suitable for new chess players       | 2-3 ply      |
|   3   | Intermediate      | Balanced difficulty (default)        | 3-5 ply      |
|   4   | Advanced          | Strong play with deeper search       | 3-6 ply      |
|   5   | Expert            | Very strong play, deep search        | 4-6 ply (max) |

**Performance:** Response time increases with level (deeper search + larger transposition table). Exact timings vary a lot by CPU, position complexity, and cache size, so the repo includes a benchmark script—run `npm run benchmark` to measure performance on your machine.

```typescript
import { Game } from 'js-chess-engine'
import type { AILevel } from 'js-chess-engine'

const game = new Game()

// Different difficulty levels
game.aiMove(1)  // Beginner
game.aiMove(2)  // Easy
game.aiMove(3)  // Intermediate (default)
game.aiMove(4)  // Advanced
game.aiMove(5)  // Expert
```

**Implementation Highlights:**
- Alpha-beta pruning with transposition table (auto-scales by AI level for optimal memory usage)
- Advanced move ordering (PV moves, MVV-LVA captures, killer moves)
- Iterative deepening for optimal move ordering
- Position evaluation with material balance and piece-square tables
- 65% performance improvement over baseline implementation
- Smart environment detection and level-based memory scaling for optimal performance across platforms

#### Auto-Scaling Transposition Table (Smart Memory Management) {#transposition-table}

The engine automatically adjusts cache size based on AI level and environment:

| AI Level | Node.js Cache | Browser Cache | Use Case                     |
| :------: | :-----------: | :-----------: | :--------------------------- |
|    1     |     1 MB      |    0.5 MB     | Lightweight, fast responses  |
|    2     |     2 MB      |     1 MB      | Mobile-friendly performance  |
|    3     |     8 MB      |     4 MB      | Balanced (default)           |
|    4     |    16 MB      |     8 MB      | Strong tactical play         |
|    5     |    32 MB      |    16 MB      | Very strong play             |

Lower levels use less memory for faster responses, higher levels use more for better move quality. Browser cache sizes are appropriate for modern devices (2024+). Override with `ttSizeMB` option if needed.

📚 **[Complete AI Implementation Guide →](docs/AI_IMPLEMENTATION.md)**

For comprehensive technical documentation including algorithms, data structures, optimization techniques, and developer guides, see the AI implementation documentation.

## Hints

- **Pawn Promotion:** When a pawn reaches the opposite end of the board, it is automatically promoted to a Queen. If you want the player to choose the promotion piece in your application, use the `setPiece()` method to replace the queen with the desired piece.

- **Castling:** Castling moves are included in the moves returned by `moves()`. When a king moves two squares (castling), the rook automatically moves as well.

- **Fifty-Move Rule:** The `halfMove` counter is calculated automatically, but the [fifty-move rule](https://en.wikipedia.org/wiki/Fifty-move_rule) is not enforced by the engine. You can implement this rule in your application if needed.

## TypeScript Support

Version 2.0 is written entirely in TypeScript and exports all necessary types:

```typescript
import { Game } from 'js-chess-engine'
import type {
  // Board types
  BoardConfig,
  PieceSymbol,
  Square,
  Color,
  MovesMap,
  CastlingRights,
  HistoryEntry,

  // AI types
  AILevel,

  // Piece types
  PieceType
} from 'js-chess-engine'
```

See `/src/types/board.types.ts` and `/src/types/ai.types.ts` for complete type definitions.

## Collaboration

**Collaborators are welcome.** Please ensure your code passes TypeScript type checking and all tests before submitting a pull request:

```bash
npm run typecheck  # TypeScript type checking
npm run test       # Run test suite
```

If possible, use commit message prefixes like `feat:` or `fix:` - the changelog is generated from these.

## TODO

- FEN validation
- Additional endgame tablebase support

## CHANGELOG

Changelog can be found [HERE](CHANGELOG.md).

## In conclusion - why another chess engine?

I am not a chess pro. My father is.

When I was ten, I had an Atari (with Turbo Basic), and I was hoping for a new PC. My father told me: "Make me a computer program which beats me in chess, and I'll buy you a new PC."

![Me (and my brother) as kids debugging our way into a chess engine on pentium 1](assets/atari-kid.webp)

Obviously, it was a trap and I failed. Twenty years later, it came back to my mind, and I decided to finish what I started. This is version 2.0 - a complete TypeScript rewrite with improved performance and architecture.

## Breaking Changes from v1

Version 2.0 is a complete TypeScript rewrite with significant API changes. While method names remain the same, **several return types have changed**:

### 1. `moves(square)` Return Type Changed

**v1 Behavior:**

```javascript
const game = new Game()
game.moves('E2')  // Returns array: ["E3", "E4"]
```

**v2 Behavior:**

```typescript
const game = new Game()
game.moves('E2')  // Returns object: {"E2": ["E3", "E4"]}
```

### 2. `move()` Return Type Changed

**v1 Behavior:**

```javascript
game.move('E2', 'E4')  // Returns move object: {"E2": "E4"}
```

**v2 Behavior:**

```typescript
game.move('E2', 'E4')  // Returns full BoardConfig object
```

### 3. `aiMove()` API - Now v1 Compatible ✅

The `aiMove()` function has been **restored to v1 API compatibility**.

**v1 Behavior:**

```javascript
aiMove(config, 2)  // Returns move object: {"E2": "E4"}
```

**v2 Behavior (Current):**

```typescript
aiMove(config, 3)  // Returns move object: {"E2": "E4"} ✅ v1 compatible
```

**New `ai()` function** - For users who need both move and board state:

```typescript
ai(config, 3)  // Returns: { move: {"E2": "E4"}, board: {...} }
```

### 4. AI Difficulty Levels Changed

- **v1:** Levels 0-4 (0=easiest, 4=hardest)
- **v2:** Levels 1-5 (1=easiest, 5=hardest)

**Migration:**
- Level 0 → Level 1 (Beginner)
- Level 1 → Level 2 (Easy)
- Level 2 → Level 3 (Intermediate, default)
- Level 3 → Level 4 (Advanced)
- Level 4 → Level 5 (Expert)

The default level has changed from `2` to `3` to maintain similar difficulty in the middle range.

### 5. Node.js Version Requirement

- **v1:** Node.js >=20 <21
- **v2:** Node.js >=24

### What Stayed the Same

- ✅ Game class constructor signature
- ✅ Method names (move, moves, aiMove, etc.)
- ✅ Board formats (JSON and FEN)
- ✅ Chess rules (castling, en passant, promotions)
- ✅ Square notation (case-insensitive: 'E2' or 'e2')
