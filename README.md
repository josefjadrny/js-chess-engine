# JS-CHESS
Simple JavaScript chess engine without dependencies written in NodeJs.
It can be used on both, server or client (web browser) and do not need persistent storage - handy for serverless solutions like AWS Lambda.

## Example
React application example without persistent storage - [js-chess-app GitHub](https://github.com/josefjadrny/js-chess-app) or [LIVE DEMO](http://chess.nadsenyvyvojar.cz/)

**More examples**<BR/>
[Simple Fastify server](example/server.js) <BR/>
[Console](example/console.js) <BR/>

## Documentation
In this documentation I am using ECMAScript Modules instead of `require`, but you can use both. Read more about [ESM](https://nodejs.org/api/esm.html).

**Basically, you have two options how to use this engine.** <BR/>
- [With in-memory](#option-1---with-in-memory)
- [Without in-memory (on-the-fly)](#option-2---without-in-memory)

### Option 1 - With in-memory
Import the Game class and create a new game.

```js
import { Game } from 'js-chess'

const game = new Game()
```

You can control your game with game object.
In this mode, many things on the chessboard are cached (in-memory), so it is faster.
You can still export your game to JSON and you can use this JSON to continue your game later.

#### API description

##### Constructor
`new Game({boardConfiguration} = NEW_GAME_BOARD_CONFIG)`

Create a new game, init players and in-game situation. 

Params
 - `boardConfiguration` Object (_optional_) - Is a chess board [configuration](#board-configuration). Default value is a configuration for new game.

##### Move
`game.move(from, to)`

Perform a move on a chessboard and recalculates in-game situation.

Params
 - `from` String (_mandatory_) - Location on a chessboard when moves start (like A1,B3,...)
 - `to` String (_mandatory_) - Location on a chessboard when moves end (like A1,B3,...)

##### Moves
`game.moves(from = null)`

Return possible moves for playing player.

Params
 - `from` String (_optional_) - Location on a chessboard (like A1,B3,...). When not provided, returns all possible moves.

`game.printToConsole()`

Print a chessboard to console standard output.

`game.exportJson()`

Return in-game situation represented by JSON [configuration](#board-configuration).

### Option 2 - Without in-memory
Import functions you want to use. Every function need JSON configuration of your chessboard to work properly.
Those functions return new JSON configuration of your board, so this JSON represents state of your game.
Your application should use returned state to generate an updated chessboard.
This approach needs little more computing time on server to create and calculate everything from scratch on every call.

```js
import { chessMoves, chessStatus, chessMove } from 'js-chess'
```
#### API description

`chessMoves({boardConfiguration})`

`chessStatus({boardConfiguration})`

`chessMove({boardConfiguration})`

### Board Configuration
On-game situation is described by JSON object.
This object is used for creating a game and can be exported, if needed.

*Forsyth–Edwards Notation (FEN) coming soon.*

```json
{
    "turn": "white",
    "pieces": {
        "E1": "K",
        "C1": "B",
        "E8": "k"
    },
    "moves": {},
    "isFinished": false,
    "checkMate": false,
    "castling": {
        "whiteLong": true,
        "whiteShort": true,
        "blackLong": true,
        "blackShort": true    
    } 
}
```

**turn** - Player which plays next. Values `white` (default) or `black`.

**isFinished** - `true` when playing player cannot move (checkmate or draw). Default `false`.

**checkMate** - `true` when playing player has checkmate. Default `false`.

**castling** - Indicators if castling is still possible. `true` means yes. Default `true`.
 - `whiteLong` - White king moves from E1 to C1.
 - `whiteShort` - White king moves from E1 to G1.
 - `blackLong` - Black king moves from E8 to C8.
 - `blackShort` - Black king moves from E8 to C8.
 
**moves** - Is added to server response when `moves()` or `move()` was called.
It indicates possible moves for playing player (turn).
```json
{
    "A7": ["A6", "A5"],
    "B7": ["B6", "B5"]
}
```
Means A7 can move to A6 and A5. B7 can move to B6 and B5.

**pieces** - Pieces on your chessboard.<BR/>
| Piece|White|Black|
| :-: | :-:| :-:|
| Pawn |P|p|
| Knight |N|n|
| Bishop |B|b|
| Rook |R|r|
| Queen |Q|q|
| King |K|k|

## TODO
- Computer player logic
- Forsyth–Edwards Notation (FEN) game initialization
- "En passant" special pawn move

## In conclusion - why another chees engine?
I am not a chess pro. My father is.
When I was ten, I had an Atari (with Turbo Basic), and I was hoping for new PC.
My father told me, make me a computer program, which beat me in chess, and I buy you a new PC.
Obviously, it was a trap. It comes to my mind after twenty years, and I would like to finish what I started before.
