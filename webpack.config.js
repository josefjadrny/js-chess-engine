
module.exports = {
    mode: 'production',
    entry: './lib/js-chess-engine.mjs',
    output: {
        library: 'js-chess-engine',
        libraryTarget: 'umd',
        globalObject: 'this',
        umdNamedDefine: true,
        filename: 'js-chess-engine.js',
    },
}
