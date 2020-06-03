# [0.3.0](https://github.com/josefjadrny/js-chess-engine/compare/v0.2.9...v0.3.0) (2020-06-03)


### Features

* FEN can be now used everywhere instead of JSON. move(config) call has been changed to move(config, from, to). ([c306492](https://github.com/josefjadrny/js-chess-engine/commit/c306492ef62050f026197c231fd0f090c16bbe90))



## [0.2.9](https://github.com/josefjadrny/js-chess-engine/compare/v0.2.8...v0.2.9) (2020-06-01)


### Features

* New game could be initialized from FEN ([2b02d34](https://github.com/josefjadrny/js-chess-engine/commit/2b02d34f460478767b6ce85eead39fd4aed4e6cc))



## [0.2.9](https://github.com/josefjadrny/js-chess-engine/compare/v0.2.8...v0.2.9) (2020-06-01)


### Features

* New game could be initialized from FEN ([2b02d34](https://github.com/josefjadrny/js-chess-engine/commit/2b02d34f460478767b6ce85eead39fd4aed4e6cc))



## [0.2.8](https://github.com/josefjadrny/js-chess-engine/compare/v0.2.7...v0.2.8) (2020-05-28)


### Features

* En passant a special pawn move rules added to pawn moves calculations ([b3516c2](https://github.com/josefjadrny/js-chess-engine/commit/b3516c2666a1e28a026511e6ef072987d98d3c43))
* En passant can be played now ([297c54b](https://github.com/josefjadrny/js-chess-engine/commit/297c54ba641045c94f73890d512fc7e7b64198ec))



## [0.2.7](https://github.com/josefjadrny/js-chess-engine/compare/v0.2.6...v0.2.7) (2020-05-27)


### Features

* Add En passant move to FEN export ([0d67c5f](https://github.com/josefjadrny/js-chess-engine/commit/0d67c5f25f0d52f473d7425ff7ba3a43eaa57e5a))
* Add En passant move to JSON import/export. ([0f7a5cd](https://github.com/josefjadrny/js-chess-engine/commit/0f7a5cde548833004d40e5e02dd656b5a72d7997))



## [0.2.6](https://github.com/josefjadrny/js-chess-engine/compare/v0.2.5...v0.2.6) (2020-05-24)



## [0.2.5](https://github.com/josefjadrny/js-chess-engine/compare/v0.2.4...v0.2.5) (2020-05-24)


### Features

* Add FEN export of a chessboard ([b611566](https://github.com/josefjadrny/js-chess-engine/commit/b61156622a3b0af9d237866b40fbbd84a05446e6))



## [0.2.4](https://github.com/josefjadrny/js-chess-engine/compare/v0.2.3...v0.2.4) (2020-05-13)



## [0.2.3](https://github.com/josefjadrny/js-chess-engine/compare/v0.2.2...v0.2.3) (2020-05-13)


### Bug Fixes

* Attacking pieces score decreased about pawn ([7cc4bfa](https://github.com/josefjadrny/js-chess-engine/commit/7cc4bfad6956977dfb9b32d5515ce1c435940774))



## [0.2.2](https://github.com/josefjadrny/js-chess-engine/compare/v0.2.1...v0.2.2) (2020-05-13)


### Bug Fixes

* Ingame pieces score is multiplied to reduce depth influence in score calculation ([2f2eb22](https://github.com/josefjadrny/js-chess-engine/commit/2f2eb2216566cc5cce16d290eca2c83f6525a981))


### Features

* Add attacking pieces to move calculations ([ddf6a06](https://github.com/josefjadrny/js-chess-engine/commit/ddf6a063a54574f83ffedd580812abb607b37faf))



## [0.2.1](https://github.com/josefjadrny/js-chess-engine/compare/v0.2.0...v0.2.1) (2020-05-12)



# [0.2.0](https://github.com/josefjadrny/js-chess-engine/compare/v0.1.33...v0.2.0) (2020-05-12)


### Features

* Minimax algorithm implemented for picking best move. Dept calculation can vary and depends on pieces still in game. ([bec0a9f](https://github.com/josefjadrny/js-chess-engine/commit/bec0a9f62c2ea195c061678c9085146f9bea37c9))



## [0.1.33](https://github.com/josefjadrny/js-chess-engine/compare/v0.1.32...v0.1.33) (2020-05-11)


### Bug Fixes

* Last move score calculated wrongly ([a3cecb4](https://github.com/josefjadrny/js-chess-engine/commit/a3cecb4234df8f2008eb235c0e68c8823af2df52))



## [0.1.32](https://github.com/josefjadrny/js-chess-engine/compare/v0.1.31...v0.1.32) (2020-05-11)


### Bug Fixes

* Board enum rollback ([da6265a](https://github.com/josefjadrny/js-chess-engine/commit/da6265ac3946610f4d948fbf95ff7133be134b65))



## [0.1.31](https://github.com/josefjadrny/js-chess-engine/compare/v0.1.30...v0.1.31) (2020-05-11)


### Features

* Checkmate logic improved - part2 ([5e24a05](https://github.com/josefjadrny/js-chess-engine/commit/5e24a05fef9c8e991f2f6387d47949bb65b62297))



## [0.1.30](https://github.com/josefjadrny/js-chess-engine/compare/v0.1.29...v0.1.30) (2020-05-11)


### Features

* Checkmate logic improved ([bd4066e](https://github.com/josefjadrny/js-chess-engine/commit/bd4066e648d4fa75e4c5b3766ee162ade47453b3))



## [0.1.29](https://github.com/josefjadrny/js-chess-engine/compare/v0.1.28...v0.1.29) (2020-05-10)


### Bug Fixes

* Random decreased, sometimes bad move is picked ([f2071d9](https://github.com/josefjadrny/js-chess-engine/commit/f2071d902a0217598f7bb33d89ba9a8da5623005))



## [0.1.28](https://github.com/josefjadrny/js-chess-engine/compare/v0.1.27...v0.1.28) (2020-05-09)


### Bug Fixes

* Examples fix ([a31fbba](https://github.com/josefjadrny/js-chess-engine/commit/a31fbbafd446fa174624d2c628ca6cc0325346c1))



## [0.1.27](https://github.com/josefjadrny/js-chess-engine/compare/v0.1.26...v0.1.27) (2020-05-08)



## [0.1.26](https://github.com/josefjadrny/js-chess-engine/compare/v0.1.25...v0.1.26) (2020-05-08)



## [0.1.25](https://github.com/josefjadrny/js-chess-engine/compare/v0.1.24...v0.1.25) (2020-05-08)


### Bug Fixes

* White is a default player when none is provided ([7e5701b](https://github.com/josefjadrny/js-chess-engine/commit/7e5701b35acf387f916eb3ff067ce03d526a3563))



## [0.1.24](https://github.com/josefjadrny/js-chess-engine/compare/v0.1.23...v0.1.24) (2020-05-08)



## [0.1.23](https://github.com/josefjadrny/js-chess-engine/compare/v0.1.22...v0.1.23) (2020-05-07)



## [0.1.22](https://github.com/josefjadrny/js-chess-engine/compare/v0.1.21...v0.1.22) (2020-05-07)



## [0.1.21](https://github.com/josefjadrny/js-chess-engine/compare/v0.1.20...v0.1.21) (2020-05-07)



## [0.1.20](https://github.com/josefjadrny/js-chess-engine/compare/v0.1.19...v0.1.20) (2020-05-07)


### Features

* Add randomizer to AI move logic calculation to prevent repeating of moves with same score ([4323e19](https://github.com/josefjadrny/js-chess-engine/commit/4323e193dfaf3141a8b25afd61c9984e5f3138e8))



## [0.1.19](https://github.com/josefjadrny/js-chess-engine/compare/v0.1.18...v0.1.19) (2020-05-07)


### Features

* Add level support to Example server ([77a760d](https://github.com/josefjadrny/js-chess-engine/commit/77a760d02759a46292edd82398a2806297f8d0e7))



## [0.1.18](https://github.com/josefjadrny/js-chess-engine/compare/v0.1.17...v0.1.18) (2020-05-07)


### Features

* AI speed rapidly increased. ([98a0a6e](https://github.com/josefjadrny/js-chess-engine/commit/98a0a6ebbf5f7f155df248befd6eac0e23082559))



## [0.1.17](https://github.com/josefjadrny/js-chess-engine/compare/v0.1.16...v0.1.17) (2020-05-06)


### Features

* Queen replaces a pawn when a pawn reaches an end of a chessboard. ([285e4b9](https://github.com/josefjadrny/js-chess-engine/commit/285e4b93b85730d4a3376e2287f6f5bee5f6a902))



## [0.1.16](https://github.com/josefjadrny/js-chess-engine/compare/v0.1.15...v0.1.16) (2020-05-06)


### Features

* Computer logic improved - need optimalizations ([4263220](https://github.com/josefjadrny/js-chess-engine/commit/426322064c4f87bff46987039296396bf864b970))



## [0.1.15](https://github.com/josefjadrny/js-chess-engine/compare/v0.1.14...v0.1.15) (2020-05-05)


### Features

* Computer AI improved ([33bfb80](https://github.com/josefjadrny/js-chess-engine/commit/33bfb804cc686e0339910189fee81cac6554b79d))



## [0.1.14](https://github.com/josefjadrny/js-chess-engine/compare/v0.1.13...v0.1.14) (2020-05-04)


### Bug Fixes

* Fixed AI move when all moves has same score ([0e77dfa](https://github.com/josefjadrny/js-chess-engine/commit/0e77dfae2c708f7538af765d131ba5da9fcb9d55))



## [0.1.13](https://github.com/josefjadrny/js-chess-engine/compare/v0.1.12...v0.1.13) (2020-05-04)


### Features

* AI logic init - it can calculate one move to the future ([08f646f](https://github.com/josefjadrny/js-chess-engine/commit/08f646f305268d755bbbc90dfbe1c2c0f4222df8))



## [0.1.12](https://github.com/josefjadrny/js-chess-engine/compare/v0.1.11...v0.1.12) (2020-05-03)


### Bug Fixes

* Castlings - constructor name is transpiled during build ([0218f4a](https://github.com/josefjadrny/js-chess-engine/commit/0218f4ab5351115370f139b2b1ebc706aa41dee6))



## [0.1.11](https://github.com/josefjadrny/js-chess-engine/compare/v0.1.10...v0.1.11) (2020-05-03)



## [0.1.10](https://github.com/josefjadrny/js-chess-engine/compare/v0.1.9...v0.1.10) (2020-05-03)


### Features

* Add Initial computer AI logic (level 0 - random moves) ([d7d46b0](https://github.com/josefjadrny/js-chess-engine/commit/d7d46b0ca9e3b9ac83be3c5facc72140b7d65a2c))



## [0.1.9](https://github.com/josefjadrny/js-chess-engine/compare/v0.1.8...v0.1.9) (2020-05-02)



## [0.1.8](https://github.com/josefjadrny/js-chess-engine/compare/v0.1.7...v0.1.8) (2020-05-02)



## [0.1.7](https://github.com/josefjadrny/js-chess-engine/compare/v0.1.6...v0.1.7) (2020-05-02)



## [0.1.6](https://github.com/josefjadrny/js-chess-engine/compare/v0.1.5...v0.1.6) (2020-05-02)


### Bug Fixes

* Typo ([5c525c8](https://github.com/josefjadrny/js-chess-engine/commit/5c525c831ebaca675bbbc3213a669df1de0b83ec))



## [0.1.5](https://github.com/josefjadrny/js-chess-engine/compare/v0.1.4...v0.1.5) (2020-05-02)



## [0.1.4](https://github.com/josefjadrny/js-chess-engine/compare/v0.1.3...v0.1.4) (2020-05-02)



## [0.1.3](https://github.com/josefjadrny/js-chess-engine/compare/v0.1.2...v0.1.3) (2020-05-02)


### Bug Fixes

* Webpack build ([d04a515](https://github.com/josefjadrny/js-chess-engine/commit/d04a5153285df36174b71c429e300612fe2b2a19))



## [0.1.2](https://github.com/josefjadrny/js-chess-engine/compare/v0.1.1...v0.1.2) (2020-05-02)



## [0.1.1](https://github.com/josefjadrny/js-chess-engine/compare/0a7f28466ad3a6f8391c53615bb6e76148737761...v0.1.1) (2020-05-02)


### Bug Fixes

* Castling functions fix for black player ([3f43949](https://github.com/josefjadrny/js-chess-engine/commit/3f43949dd90a3a46ea41faffd5bf9ea3a3419d9c))
* fixed main module ([41af084](https://github.com/josefjadrny/js-chess-engine/commit/41af084c3f0757a280a3fa0bed85560197a638b6))


### Features

* Added castling functions ([c5fedf2](https://github.com/josefjadrny/js-chess-engine/commit/c5fedf264b4e631b5247fb5a2d761f0496efe297))
* Added move() function witch check-mate checking ([09288aa](https://github.com/josefjadrny/js-chess-engine/commit/09288aa30b64471fd59acc91c45a3a4b4b1294fb))
* Added status function for retrieve game status info (checkmate, isFinished) ([52566b9](https://github.com/josefjadrny/js-chess-engine/commit/52566b93c46ac8822934be18d88fc3f546774dc1))
* Castling is now sent and parsed in stateless mode ([d76bc05](https://github.com/josefjadrny/js-chess-engine/commit/d76bc055652ae0fdf2d31a3d68ccfc8b9059723f))
* Initial commit with moves calculation engine ([0a7f284](https://github.com/josefjadrny/js-chess-engine/commit/0a7f28466ad3a6f8391c53615bb6e76148737761))



