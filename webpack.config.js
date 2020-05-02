
module.exports = {
    mode: 'production',
    entry: './lib/js-chess-engine.mjs',
    output: {
        library: 'js-chess-engine',
        libraryTarget: 'umd',
        filename: 'js-chess-engine.js'
    }
}
