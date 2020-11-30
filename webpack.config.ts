import webpack from 'webpack';
import { resolve, join } from 'path';
import ForkTsCheckerWebpackPlugin from 'fork-ts-checker-webpack-plugin';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import CopyPlugin from 'copy-webpack-plugin';
import { DefinePlugin } from 'webpack';
import { version } from './package.json';
import gitHash from './scripts/hash';

const buildDate = Date.now();

export default {
    target: 'web',
    entry: {
        app: join(__dirname, './src', 'index.tsx'),
    },
    output: {
        path: resolve(__dirname, './dist'),
        filename: '[name].js',
    },
    // node: {
    //     __dirname: false,
    // },
    // Enable sourcemaps for debugging webpack's output.
    devtool: 'source-map',
    mode: 'development',
    plugins: [
        new DefinePlugin({
            'ENV.NODE_ENV': JSON.stringify('development'),
            'ENV.VERSION': JSON.stringify(version),
            'ENV.HASH': JSON.stringify(gitHash),
            'ENV.BUILD_DATE': JSON.stringify(buildDate),
        }),
        new HtmlWebpackPlugin({
            template: join(__dirname, 'static', 'index.html'),
        }),
    ],
    resolve: {
        // Add '.ts' and '.tsx' as resolvable extensions.
        extensions: ['.ts', '.tsx', '.js', '.json', '.css'],
        alias: {
            $src: resolve(__dirname, 'src/'),
        },
    },
    // resolveLoader: {
    //     alias: {
    //         'data-cy-loader': join(__dirname, 'scripts/data-cy-loader.js'),
    //     },
    // },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: [
                    {
                        loader: 'ts-loader',
                        options: {
                            // disable type checker - we will use it in fork plugin
                            transpileOnly: true,
                        },
                    },
                    // {
                    //     loader: 'data-cy-loader',
                    // },
                ],
            },
            // All output '.js' files will have any sourcemaps re-processed by 'source-map-loader'.
            { enforce: 'pre', test: /\.js$/, loader: 'source-map-loader' },
            // css loader
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader'],
            },
            // file loader, for loading files referenced inside css files
            {
                test: /\.(woff(2)?|ttf|eot|svg)(\?v=\d+\.\d+\.\d+)?$/,
                use: [
                    {
                        loader: 'file-loader',
                        options: {
                            name: '[name].[ext]',
                            outputPath: 'fonts/',
                        },
                    },
                ],
            },
            // images embbeded into css
            {
                test: /\.(png|jpg|gif)$/i,
                use: [
                    {
                        loader: 'url-loader',
                        options: {
                            limit: 8192,
                        },
                    },
                ],
            },
        ],
    },

    // When importing a module whose path matches one of the following, just
    // assume a corresponding global variable exists and use that instead.
    // This is important because it allows us to avoid bundling all of our
    // dependencies, which allows browsers to cache those libraries between builds.
    // externals: {
    //     "react": "React",
    //     "react-dom": "ReactDOM"
    // }
};
