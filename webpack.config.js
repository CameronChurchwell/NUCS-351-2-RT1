const path = require('path');

module.exports = {
    experiments: {
        asyncWebAssembly: true,
        topLevelAwait: true,
        syncWebAssembly: true,
    },
    entry: './ChurchwellCameron_RT1.ts',
    devtool: 'inline-source-map',
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: 'ts-loader',
                exclude: [
                    /node_modules/,
                ],
            },
            {
                test: /\.glsl$/,
                loader: 'webpack-glsl-loader',
            },
            {
                test: /\.wasm$/,
                type: 'asset/inline',
            }
        ],
    },
    resolve: {
        extensions: ['.ts', '.js', '.wasm'],
    },
    output: {
        filename: 'build.js',
        path: path.resolve(__dirname, 'build'),
        clean: true,
    },
};