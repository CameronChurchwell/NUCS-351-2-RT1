const path = require('path');

module.exports = {
    entry: './ChurchwellCameron_ProjA.ts',
    devtool: 'inline-source-map',
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
            {
                test: /\.glsl$/,
                loader: 'webpack-glsl-loader',
            }
        ],
    },
    resolve: {
        extensions: ['.ts'],
    },
    output: {
        filename: 'ChurchwellCameron_ProjA.js',
        path: path.resolve(__dirname, 'build'),
    },
};