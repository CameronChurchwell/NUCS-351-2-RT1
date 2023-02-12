const path = require('path');

module.exports = {
    entry: './ChurchwellCameron_RT1.ts',
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
        filename: 'build.js',
        path: path.resolve(__dirname, 'build'),
    },
};