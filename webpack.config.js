const HtmlWebpackPlugin = require("html-webpack-plugin");
const { GenerateSW } = require('workbox-webpack-plugin');
const WebpackPwaManifest = require('webpack-pwa-manifest');

const isDevelopment = process.env.NODE_ENV === 'development'
    || process.argv.includes('development');

const CACHE_ID = 'NTMv1';

const workboxPlugin = new GenerateSW({
    // these options encourage the ServiceWorkers to get in there fast
    // and not allow any straggling "old" SWs to hang around
    clientsClaim: true,
    skipWaiting: true,

    cacheId: CACHE_ID,
    cleanupOutdatedCaches: true,

    inlineWorkboxRuntime: false,

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

const webpackPwaManifest = new WebpackPwaManifest({
    name: 'NBN SQ Map',
    short_name: 'NSM',
    description: 'National Broadband Network Service Qualification Map',
    background_color: '#ffffff',
    crossorigin: null,
    'start_url': isDevelopment ? './index.dev.html' : './index.html',
    display: 'standalone',

    ios: true,
    publicPath: './',

    icons: [
        {
            src: './src/assets/logo.svg',
            sizes: [ 1000 ],
        },
        {
            src: './src/assets/logo.svg',
            sizes: [ 1000 ],
            ios: 'startup',
        },
        {
            src: './src/assets/logo.svg',
            size: '1000x1000',
            purpose: 'maskable'
        }
    ],

    screenshots: [
        {
            form_factor: 'wide',
            label: 'View nbn locations at street level',
            src: './91a83bbcaa7854cd150e.png',
            size: '1856×878',
        },
        {
            form_factor: 'wide',
            label: 'See technology areas at a city level',
            src: './e01c0d3d072cedcaf4d0.png',
            size: '1855×883',
        },
        {
            form_factor: 'narrow',
            label: 'Take your map with you on the go',
            src: './e9948aecf44289fffa34.png',
            size: '357×770',
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
            },
            {
                test: /\.(png|svg|jpg|jpeg|gif)$/i,
                type: 'asset/resource',                
            },
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
        
        isDevelopment ? undefined : webpackPwaManifest,
        isDevelopment ? undefined : workboxPlugin,
    ].filter(p => p),

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