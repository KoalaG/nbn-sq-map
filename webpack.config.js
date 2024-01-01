const HtmlWebpackPlugin = require("html-webpack-plugin");
//const WorkboxPlugin = require('workbox-webpack-plugin');

const isDevelopment = true;

module.exports = {

    entry: {
        app: './src/index.ts',
        //'service-worker': './src/service-worker.ts'
    },

    devtool: 'inline-source-map',

    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: '/node_modules/'
            },
            {
                test: /\.css$/i,
                use: ['style-loader', 'css-loader'],
            }
        ]
    },

    resolve: {
        extensions: ['.tsx', '.ts', '.js']
    },

    plugins: [
        new HtmlWebpackPlugin({
            template: "./src/index.html",
            filename: isDevelopment ? "./index.dev.html" : "./index.html"
        }),
        /*new WorkboxPlugin.GenerateSW({
            // these options encourage the ServiceWorkers to get in there fast
            // and not allow any straggling "old" SWs to hang around
            clientsClaim: true,
            skipWaiting: true,
            
        }),*/
     
    ],

    output: {
        filename: isDevelopment ? '[name].dev.js' : '[name].[contenthash].js',
        clean: true,
    },

    devServer: {
        
        devMiddleware: {
            writeToDisk: isDevelopment,
            index: 'index.dev.html'
        }
    },

    optimization: {
        splitChunks: {
            chunks: 'all',
        },
    }

}