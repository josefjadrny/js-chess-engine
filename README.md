# JS-CHESS-ENGINE
![GitHub package.json version](https://img.shields.io/github/package-json/v/josefjadrny/js-chess-engine)
![Test](https://raw.githubusercontent.com/josefjadrny/js-chess-engine/master/test/badge.svg?sanitize=true)
![CI](https://github.com/josefjadrny/js-chess-engine/actions/workflows/main.yml/badge.svg?branch=master)
[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Simple JavaScript chess engine without dependencies written in NodeJs.
It can be used on both, server or client (web browser) and do not need persistent storage - handy for serverless solutions like AWS Lambda.
This engine also includes configurable basic [AI computer logic](#computer-ai).

## Install
**Install with npm**

```npm i js-chess-engine --save```

**or install with yarn**

```yarn add js-chess-engine```

**Example**

```js
const jsChessEngine = require('js-chess-engine')
const game = new jsChessEngine.Game()
game.printToConsole()
```
more about [importing](#import) this library.
## Examples
**js-chess-engine-app** - React application example with js-chess-engine REST API backend (without persistent storage) - [GitHub](https://github.com/josefjadrny/js-chess-engine-app) or [LIVE DEMO](http://chess.nadsenyvyvojar.cz/)

**More examples**<BR/>
[Simple Fastify server](example/server.mjs) <BR/>
[Console](example/console.mjs) <BR/>
[PC vs PC match](example/aiMatch.mjs) <BR/>

## Documentation
### Import
In this documentation I am using CommonJS require known from Node.js, but there are several ways how to import this library.

**Node.js (ESM)**
```js
import jsChessEngine from 'js-chess-engine'
const game = new jsChessEngine.Game()
```

**Node.js (CommonJS)**
```js
const jsChessEngine = require('js-chess-engine')
const game = new jsChessEngine.Game()
```

**React**
```js
import { Game, move, status, moves, aiMove, getFen } from 'js-chess-engine'
const game = new Game()
```

You can find more about UMD [here](https://github.com/umdjs/umd).

**Basically, you have two options how to use this engine.** <BR/>
- [With in-memory](#option-1---with-in-memory)
- [Without in-memory (on-the-fly)](#option-2---without-in-memory)

<BR/>

### Option 1 - With in-memory
Use the Game class and create a new game.
```js
const jsChessEngine = require('js-chess-engine')
const game = new jsChessEngine.Game()
```

You can control your game with game object.
In this mode, many things on the chessboard are cached (in-memory), so it is faster.
You can still export your game to JSON or FEN and you can use this JSON or FEN to continue your game later.

#### API description

**constructor**

`new Game(configuration)` - Create a new game, init players and in-game situation. 

Params
 - `configuration` Object or String (_optional_) - Is a chess board [configuration](#board-configuration). Default value is a configuration for new game.

**move**

`game.move(from, to)` - Perform a move on a chessboard and recalculates in-game situation. Returns played move `{"H7":"H5"}`

Params
 - `from` String (_mandatory_) - Location on a chessboard where move starts (like A1,B3,...)
 - `to` String (_mandatory_) - Location on a chessboard where move ends (like A1,B3,...)

**moves**

`game.moves(from)` - Return possible moves for playing player.

Params
 - `from` String (_optional_) - Location on a chessboard (like A1,B3,...). When not provided, returns all possible moves.

**setPiece**

`game.setPiece(location, piece)` - New chess piece is added to provided location. Piece on provided location is replaced.

Params
- `location` String (_mandatory_) - Location on a chessboard (like A1,B3,...).
- `piece` String (_mandatory_) - A chess piece you need add (pieces syntax is same as FEN notation).

**removePiece**

`game.removePiece(location)` - Remove piece on provided location.

Params
- `location` String (_mandatory_) - Location on a chessboard (like A1,B3,...).

**aiMove**

`game.aiMove(level)` - Calculates and perform next move by computer player. `game.move(from, to)` is called internally. Returns played move `{"H7":"H5"}`

Params
 - `level` Integer (_optional_) - Computer player skill from 0 to 3. Read more about [computer AI](#computer-ai). Default 2.

**getHistory**

`game.getHistory(reversed)` - Returns all played moves in array with chess board configuration like `[{from:'A2',to:'A3',configuration:{...}},{from:'A7',to:'A6',configuration:{...}}]`.

`configuration` object is a previous chess board [configuration](#board-configuration) (before that move was played) and can be used to start new game with `new Game(configuration)`.

Params
- `reversed` Boolean (_optional_) - When false, last move is the last element in returned array. When true, last move is first. Default false.

**printToConsole**

`game.printToConsole()` - Print a chessboard to console standard output.

**exportJson**

`game.exportJson()` - Return in-game situation represented by JSON [configuration](#board-configuration).

**exportFEN**

`game.exportFEN()` - Return in-game situation represented by [FEN](https://en.wikipedia.org/wiki/Forsyth%E2%80%93Edwards_Notation).

<BR/>

### Option 2 - Without in-memory
It is possible to avoid using a Game object and call stateless functions directly. Every function needs configuration of your chessboard to work properly.
This approach needs little more computing time to create and calculate everything from scratch for every call. 
But this can be handy in stateless environments.

```js
const jsChessEngine = require('js-chess-engine')
const { move, status, moves, aiMove, getFen } = jsChessEngine
```
#### API description

**moves**

`moves(boardConfiguration)` - Returns an Object with possible moves for playing player `{"B1":["A3","C3"],"G1":["F3","H3"]}`.

Params
 - `boardConfiguration` Object or String (_mandatory_) - Is a chess board [configuration](#board-configuration). Default value is a configuration for new game.

**status**

`status(boardConfiguration)` - Return calculated JSON board [configuration](#board-configuration). You can use this function to convert your FEN to JSON.

Params
 - `boardConfiguration` Object or String (_mandatory_) - Is a chess board [configuration](#board-configuration). Default value is a configuration for new game.

**getFEN**

`getFEN(boardConfiguration)` - Return [FEN](https://en.wikipedia.org/wiki/Forsyth%E2%80%93Edwards_Notation) string, representation of your chessboard.

Params
 - `boardConfiguration` Object or String (_mandatory_) - Is a chess board [configuration](#board-configuration). Default value is a configuration for new game.

**move**

`move(boardConfiguration, from, to)` - Perform a move on a chessboard and recalculates in-game situation. New configuration of your chessboard is returned.

Params
 - `boardConfiguration` Object or String (_mandatory_) - Is a chess board [configuration](#board-configuration). Default value is a configuration for new game.
 - `from` String (_mandatory_) - Location on a chessboard where move starts (like A1,B3,...)
 - `to` String (_mandatory_) - Location on a chessboard where move ends (like A1,B3,...)

**aiMove**

`aiMove(boardConfiguration, level)` - Return computed move as an object like `{"H7":"H5"}`. Use `move(yourBoardConfiguration, from, to)` to play this move.

Params
 - `boardConfiguration` Object or String (_mandatory_) - Is a chess board [configuration](#board-configuration). Default value is a configuration for new game.
 - `level` Integer (_optional_) - Computer player skill from 0 to 3. Read more about [computer AI](#computer-ai). Default 2.

<BR/>

### Board Configuration
Board configuration could be described by JSON Object or FEN.

#### JSON
This can be handy for modern application, where is a state represented by an Object (like in React, Redux,...).
You can easily merge returned state with your app state and get a new updated chessboard.


```json
{
    "turn": "black",
    "pieces": {
        "E1": "K",
        "C1": "B",
        "E8": "k"
    },
    "moves": {
      "E8": ["E7", "F8", "F7", "D8", "D7"]
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

**turn** - Player which plays next. Values `white` (default) or `black`.

**isFinished** - `true` when playing player cannot move (checkmate or draw). Default `false`.

**check** - `true` when playing player is in check. Default `false`.

**checkMate** - `true` when playing player has checkmate. Default `false`.

**castling** - Indicators if castling is still possible. `true` means yes. Default `true`.
 - `whiteLong` (_queenside_) - White king moves from E1 to C1.
 - `whiteShort`(_kingside_) - White king moves from E1 to G1.
 - `blackLong` (_queenside_) - Black king moves from E8 to C8.
 - `blackShort` (_kingside_) - Black king moves from E8 to C8.
 
**enPassant** - If a pawn has just made a two-square move, this is the position "behind" the pawn.
This is an indicator for [enPassant](https://en.wikipedia.org/wiki/En_passant) special pawn move. Default `null`.

**halfMove** - This is the number of halfmoves since the last capture or pawn advance. This is used to determine if a draw can be claimed under the fifty-move rule. Default `0`.

**fullMove** - The number of the full move. It starts at 1, and is incremented after Black's move. Default `1`.
 
**moves** - Is added to server response when `moves()` or `move()` was called.
It indicates possible moves for playing player (turn).
```json
{
    "A7": ["A6", "A5"],
    "B7": ["B6", "B5"]
}
```
Means A7 can move to A6 and A5. B7 can move to B6 and B5.

**pieces** - Pieces on your chessboard. Syntax is same as FEN notation.<BR/>
| Piece|White|Black|
| :-: | :-:| :-:|
| Pawn |P|p|
| Knight |N|n|
| Bishop |B|b|
| Rook |R|r|
| Queen |Q|q|
| King |K|k|


#### FEN
You can also use the Forsyth–Edwards Notation ([FEN](https://en.wikipedia.org/wiki/Forsyth%E2%80%93Edwards_Notation)).

```js
const jsChessEngine = require('js-chess-engine')
const { move } = jsChessEngine    
const newFen = move('rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1', 'H7', 'H5')
console.log(newFen)
// rnbqkbnr/ppppppp1/8/7p/4P3/8/PPPP1PPP/RNBQKBNR w KQkq h6 0 2
```

<BR/>

### Computer AI

This engine includes configurable AI computer logic based on Minimax algorithm. There are five possible levels at this time.

|Level|Alias|Moves to the future|HW requirements|Approx. time to move (s)*|
| :-: | :-:| :-:| :-:| :-:|
| 0 |Well-trained monkey| 1-2 | None | <0.01 |
| 1 |Beginner| 2-4 | Very low | <0.1 |
| 2 |Intermediate| 2-4 | Low | 0.7 |
| 3 |Advanced| 3-5 | Medium | 4.6 |
| 4 |Experienced| 4-5 | High | 9.5 |

***Approx. time to move (s)** - This number represent the average amount of seconds needed for one move during a chess game on t3.nano AWS instance.
T3.nano is a low-cost machine with 0.5 GiB RAM and basic CPU performance. Please note, amount of time needed for calculations heavily depends on in-game situation (number of chess pieces still on a chessboard).

<BR/>

## HINTS

- When a pawn reaches an end of a chessboard, he is automatically converted and calculated as a Queen.
If you like, player can pick a new chess piece in your app, and you can send an updated chessboard.
For in-memory approach please check **setPiece** function.
- Castling can be played by a King. You can receive this special move with `moves` call.
When a move is recognized as a castling - played with a king across two chess fields, rook moves automatically with a king.
- Halfmoves are calculated on the server, but the [fifty-move rule](https://en.wikipedia.org/wiki/Fifty-move_rule) is not handled by a server. You can handle this situation in your app if you need to.

<BR/>

## Collaboration

**Collaborators are welcome.** Please do not forget to check ESLint and run tests before submitting a new pull request (`npm run test`). 

If it is possible, also use commit message prefixes like `feat: ` or `fix: ` - changelog is generated from this.

<BR/>

## TODO
- Calculation and result caching
- Forsyth–Edwards Notation (FEN) validation

<BR/>

## CHANGELOG
Changelog can be found [HERE](CHANGELOG.md) .

<BR/>

## In conclusion - why another chess engine?
I am not a chess pro. My father is.
When I was ten, I had an Atari (with Turbo Basic), and I was hoping for new PC.
My father told me, make me a computer program, which beat me in chess, and I buy you a new PC.
Obviously, it was a trap and I failed. It comes to my mind after twenty years, and I would like to finish what I started before.
