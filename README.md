# JS-CHESS-ENGINE
![GitHub package.json version](https://img.shields.io/github/package-json/v/josefjadrny/js-chess-engine)
![Test](https://raw.githubusercontent.com/josefjadrny/js-chess-engine/master/test/badge.svg?sanitize=true)
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
const jsChess = require('js-chess-engine')
const game = new jsChess.Game()
game.printToConsole()
```

## Examples
**js-chess-engine-app** - React application example with js-chess-engine REST API backend (without persistent storage) - [GitHub](https://github.com/josefjadrny/js-chess-engine-app) or [LIVE DEMO](http://chess.nadsenyvyvojar.cz/)

**More examples**<BR/>
[Simple Fastify server](example/server.mjs) <BR/>
[Console](example/console.mjs) <BR/>

## Documentation
In this documentation I am using ECMAScript Modules instead of `require`, but you can use both. Read more about [ESM](https://nodejs.org/api/esm.html).

**Basically, you have two options how to use this engine.** <BR/>
- [With in-memory](#option-1---with-in-memory)
- [Without in-memory (on-the-fly)](#option-2---without-in-memory)

<BR/>

### Option 1 - With in-memory
Import the Game class and create a new game.

```js
import jsChessEngine from 'js-chess-engine'

const game = new jsChessEngine.Game()
```

You can control your game with game object.
In this mode, many things on the chessboard are cached (in-memory), so it is faster.
You can still export your game to JSON and you can use this JSON to continue your game later.

#### API description

**constructor**

`new Game({boardConfiguration} = NEW_GAME_BOARD_CONFIG)` - Create a new game, init players and in-game situation. 

Params
 - `boardConfiguration` Object (_optional_) - Is a chess board [configuration](#board-configuration). Default value is a configuration for new game.

**move**

`game.move(from, to)` - Perform a move on a chessboard and recalculates in-game situation.

Params
 - `from` String (_mandatory_) - Location on a chessboard where move starts (like A1,B3,...)
 - `to` String (_mandatory_) - Location on a chessboard where move ends (like A1,B3,...)

**moves**

`game.moves(from = null)` - Return possible moves for playing player.

Params
 - `from` String (_optional_) - Location on a chessboard (like A1,B3,...). When not provided, returns all possible moves.

**aiMove**

`game.aiMove(level = 2)` - Calculates and perform next move by computer player. `game.move(from, to)` is called internally.

Params
 - `level` Integer (_optional_) - Computer player skill from 0 to 4. Read more about [computer AI](#computer-ai).

**printToConsole**

`game.printToConsole()` - Print a chessboard to console standard output.

**exportJson**

`game.exportJson()` - Return in-game situation represented by JSON [configuration](#board-configuration).

**exportFEN**

`game.exportFEN()` - Return in-game situation represented by [FEN](https://en.wikipedia.org/wiki/Forsyth%E2%80%93Edwards_Notation).

<BR/>

### Option 2 - Without in-memory
Import functions you want to use. Every function need JSON configuration of your chessboard to work properly.
Those functions return new JSON configuration of your board, so this JSON represents state of your game.
Your application should use returned state to generate an updated chessboard.
This approach needs little more computing time on server to create and calculate everything from scratch on every call.

```js
import jsChessEngine from 'js-chess-engine'
const { move, status, moves, aiMove, getFen } = jsChessEngine    
```
#### API description

**moves**

`moves({boardConfiguration})` - Return possible moves for playing player.

Params
 - `boardConfiguration` Object (_optional_) - Is a chess board [configuration](#board-configuration). Default value is a configuration for new game.

**status**

`status({boardConfiguration})` - Return calculated JSON board [configuration](#board-configuration).

Params
 - `boardConfiguration` Object (_optional_) - Is a chess board [configuration](#board-configuration). Default value is a configuration for new game.

**getFEN**

`getFEN({boardConfiguration})` - Return [FEN](https://en.wikipedia.org/wiki/Forsyth%E2%80%93Edwards_Notation) representation of your chessboard.

Params
 - `boardConfiguration` Object (_optional_) - Is a chess board [configuration](#board-configuration). Default value is a configuration for new game.

**move**

`move({boardConfiguration})` - Perform a move on a chessboard and recalculates in-game situation.

Params
 - `boardConfiguration` Object (_optional_) - Is a chess board [configuration](#board-configuration). Default value is a configuration for new game.

**aiMove**

`aiMove({boardConfiguration}, level = 2)` - Return computed move. Use `move({boardConfiguration})` to play this move.

Params
 - `boardConfiguration` Object (_optional_) - Is a chess board [configuration](#board-configuration). Default value is a configuration for new game.
 - `level` Integer (_optional_) - Computer player skill from 0 to 4. Read more about [computer AI](#computer-ai).

<BR/>

### Board Configuration
On-game situation is described by JSON object.
This object is used for creating a game and can be exported, if needed.

*Forsyth–Edwards Notation (FEN) coming soon.*

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
    "move": {
      "from": "E8",
      "to": "E7"
    },
    "isFinished": false,
    "checkMate": false,
    "castling": {
        "whiteLong": true,
        "whiteShort": true,
        "blackLong": true,
        "blackShort": true    
    },
    "enPassant": "E6",
    "counters": {
        "halfMove": 0,
        "fullMove": 1
    }  
}
```

**turn** - Player which plays next. Values `white` (default) or `black`.

**isFinished** - `true` when playing player cannot move (checkmate or draw). Default `false`.

**checkMate** - `true` when playing player has checkmate. Default `false`.

**castling** - Indicators if castling is still possible. `true` means yes. Default `true`.
 - `whiteLong` (_queenside_) - White king moves from E1 to C1.
 - `whiteShort`(_kingside_) - White king moves from E1 to G1.
 - `blackLong` (_queenside_) - Black king moves from E8 to C8.
 - `blackShort` (_kingside_) - Black king moves from E8 to C8.
 
**enPassant** - If a pawn has just made a two-square move, this is the position "behind" the pawn.
This is an indicator for [enPassant](https://en.wikipedia.org/wiki/En_passant) special pawn move. Default `null`.

**counters** - It is recommended to pass this values also if you need to properly handle FEN exports/imports.
 - `halfMove` - This is the number of halfmoves since the last capture or pawn advance. This is used to determine if a draw can be claimed under the fifty-move rule. Default `0`.
 - `fullMove` - The number of the full move. It starts at 1, and is incremented after Black's move. Default `1`.
 
**moves** - Is added to server response when `moves()` or `move()` was called.
It indicates possible moves for playing player (turn).
```json
{
    "A7": ["A6", "A5"],
    "B7": ["B6", "B5"]
}
```
Means A7 can move to A6 and A5. B7 can move to B6 and B5.

**move** - Instructions for a next move. It is recommended to call `moves()` first to retrieve possible moves.
This field is required only for `move()` calls.
```json
{
    "from": "E8",
    "to": "E7"
}
```
Player which is on `turn` is moving from E8 to E7.

**pieces** - Pieces on your chessboard. Syntax is same as FEN notation.<BR/>
| Piece|White|Black|
| :-: | :-:| :-:|
| Pawn |P|p|
| Knight |N|n|
| Bishop |B|b|
| Rook |R|r|
| Queen |Q|q|
| King |K|k|

<BR/>

### Computer AI

This engine includes configurable AI computer logic based on Minimax algorithm. There are four possible levels at this time.
Only level 0-2 are now fully working. This feature is under development.

|Level|Alias|Moves to the future|HW requirements|Approx. time to move (s)*|
| :-: | :-:| :-:| :-:| :-:|
| 0 |Well-trained monkey| 1-2 | None | <0.1 |
| 1 |Beginner| 2-3 | Very low | 0.11 |
| 2 |Advanced| 3-4 | Low | 3.34 |
| 3 |Professional| ? | Average | ? |

***Approx. time to move (s)** - This number represent the average amount of seconds needed for one move during a chess game on t3.nano AWS instance.
T3.nano is a low-cost machine with 0.5 GiB RAM and basic CPU performance. Please note, amount of time needed for calculations heavily depends on in-game situation (number of chess pieces still on a chessboard).

<BR/>

## HINTS

- When a pawn reaches an end of a chessboard, he is automatically convert and calculated as a Queen.
If you like, player can pick a new chess piece in your app, and you can send an updated chessboard.
- Castling can be played by a King. You can receive this special move with `moves` call.
When a move is recognized as a castling - played with a king across two chess fields, rook moves automatically with a king.
- Halfmoves are calculated on the server, but the [fifty-move rule](https://en.wikipedia.org/wiki/Fifty-move_rule) is not handled by a server. You can handle this situation in your app if you need to.

<BR/>

## TODO
- "En passant" a special pawn move
- BitBoard instead of objects
- Calculation and result caching
- Forsyth–Edwards Notation (FEN) game initialization

<BR/>

## CHANGELOG
Changelog can be found [HERE](CHANGELOG.md) .

<BR/>

## In conclusion - why another chees engine?
I am not a chess pro. My father is.
When I was ten, I had an Atari (with Turbo Basic), and I was hoping for new PC.
My father told me, make me a computer program, which beat me in chess, and I buy you a new PC.
Obviously, it was a trap and I failed. It comes to my mind after twenty years, and I would like to finish what I started before.
