# JS-CHESS-ENGINE

![GitHub package.json version](https://img.shields.io/github/package-json/v/josefjadrny/js-chess-engine)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Complete TypeScript chess engine without dependencies for Node.js >=24 and browsers. Includes configurable AI with difficulty levels 0-4.

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

`game.moves(from)` - Get all legal moves for the current player. When a square is specified, **returns object format** `{"E2": ["E3", "E4"]}` (breaking change from v1).

Params:
- `from` string (_optional_) - Square to filter moves from (case-insensitive, e.g., 'E2')

Returns: `MovesMap` - Object mapping from-squares to arrays of to-squares

```typescript
import type { MovesMap } from 'js-chess-engine'

// Get all moves
const allMoves: MovesMap = game.moves()
// {"E2": ["E3", "E4"], "B1": ["A3", "C3"], ...}

// Get moves for specific square (returns object, not array!)
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

`game.aiMove(level)` - Calculate and perform the best move for the current player using AI. **Returns full BoardConfig object** (breaking change from v1).

Params:
- `level` AILevel (_optional_) - AI difficulty level (0-4). See [Computer AI](#computer-ai) section. Default: 2

Returns: `BoardConfig` - Full board configuration after the AI move

```typescript
import type { BoardConfig, AILevel } from 'js-chess-engine'

const level: AILevel = 3
const newConfig: BoardConfig = game.aiMove(level)
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
import { move, moves, status, aiMove, getFen } from 'js-chess-engine'
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

`aiMove(boardConfiguration, level)` - Calculate and return the best move using AI. **Returns full BoardConfig object** (breaking change from v1).

Params:
- `boardConfiguration` BoardConfig | string (_mandatory_) - Board [configuration](#board-configuration)
- `level` AILevel (_optional_) - AI difficulty level (0-4). Default: 2

Returns: `BoardConfig` - Full board configuration after the AI move

```typescript
import { aiMove } from 'js-chess-engine'
import type { BoardConfig, AILevel } from 'js-chess-engine'

const config: BoardConfig = { /* ... */ }
const level: AILevel = 3
const newConfig: BoardConfig = aiMove(config, level)
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

The engine includes a configurable AI based on the Minimax algorithm with alpha-beta pruning. There are five difficulty levels:

| Level | Alias             | Description                          |
| :---: | :---------------- | :----------------------------------- |
|   0   | Well-trained monkey | Very weak play, minimal lookahead  |
|   1   | Beginner          | Suitable for new chess players       |
|   2   | Intermediate      | Balanced difficulty (default)        |
|   3   | Advanced          | Strong play with deeper search       |
|   4   | Experienced       | Maximum difficulty and search depth  |

**Note:** Performance varies based on hardware and position complexity. Higher levels require more computation time.

```typescript
import { Game } from 'js-chess-engine'
import type { AILevel } from 'js-chess-engine'

const game = new Game()

// Different difficulty levels
game.aiMove(0)  // Well-trained monkey
game.aiMove(1)  // Beginner
game.aiMove(2)  // Intermediate (default)
game.aiMove(3)  // Advanced
game.aiMove(4)  // Experienced
```

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

- Calculation and result caching improvements
- FEN validation
- Phase 5: Performance optimizations

## CHANGELOG

Changelog can be found [HERE](CHANGELOG.md).

## In conclusion - why another chess engine?

I am not a chess pro. My father is.

When I was ten, I had an Atari (with Turbo Basic), and I was hoping for a new PC. My father told me: "Make me a computer program which beats me in chess, and I'll buy you a new PC."

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

### 3. `aiMove()` Return Type Changed

**v1 Behavior (Stateless):**

```javascript
aiMove(config, 2)  // Returns move object: {"E2": "E4"}
```

**v2 Behavior (Stateless):**

```typescript
aiMove(config, 2)  // Returns full BoardConfig object
```

### 4. Node.js Version Requirement

- **v1:** Node.js >=20 <21
- **v2:** Node.js >=24

### What Stayed the Same

- ✅ Game class constructor signature
- ✅ Method names (move, moves, aiMove, etc.)
- ✅ AI difficulty levels (0-4)
- ✅ Board formats (JSON and FEN)
- ✅ Chess rules (castling, en passant, promotions)
- ✅ Square notation (case-insensitive: 'E2' or 'e2')
