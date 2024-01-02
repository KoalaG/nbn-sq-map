const HtmlWebpackPlugin = require("html-webpack-plugin");
const WorkboxPlugin = require('workbox-webpack-plugin');

const isDevelopment = true;

const CACHE_ID = 'NTMv1';

const workboxPlugin = new WorkboxPlugin.GenerateSW({
    // these options encourage the ServiceWorkers to get in there fast
    // and not allow any straggling "old" SWs to hang around
    clientsClaim: true,
    skipWaiting: true,

    cacheId: CACHE_ID,
    cleanupOutdatedCaches: true,

    inlineWorkboxRuntime: true,
    
    // Define runtime caching rules.
    runtimeCaching: [

        {   // Cache First, 1 Day, NBN Places
            urlPattern: ({ request, url }) => {
                return url.pathname.includes('/nbn-bulk/map')
                    && !request.headers.has('sw-network-first');
            },
            handler: 'CacheFirst',
            options: {
                cacheName: CACHE_ID + '-nbn_places',
                expiration: {
                    maxAgeSeconds: 60 * 60 * 24,
                },
            }
        },

        {   // Network First, 1 Day, NBN Places
            urlPattern: ({ request, url }) => {
                return url.pathname.includes('/nbn-bulk/map')
                    && request.headers.has('sw-network-first');
            },
            handler: 'NetworkFirst',
            options: {
                cacheName: CACHE_ID + '-nbn_places',
                expiration: {
                    maxAgeSeconds: 60 * 60 * 24,
                },
            }
        },

        {
            urlPattern: ({ url }) => url.pathname.includes('/rastertiles/'),
            handler: 'CacheFirst',
            options: {
                cacheName: CACHE_ID + '-rastertiles',
                expiration: {
                    maxAgeSeconds: 60 * 60 * 24 * 30,
                },
            }
        },

        {   // All other URLs
            urlPattern: /.*/,
            handler: 'NetworkFirst',
            options: {
                cacheName: CACHE_ID + '-other',
            },
        }


    ],

});

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

        // workboxPlugin,
     
    ],

    output: {
        filename: isDevelopment ? '[name].dev.js' : '[name].[contenthash].js',
        clean: true,
    },

    devServer: {
        open: false,
        devMiddleware: {
            //writeToDisk: isDevelopment,
            index: 'index.dev.html'
        }
    },

    optimization: {
        splitChunks: {
            chunks: 'all',
        },
    }

}