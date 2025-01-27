const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const argv = require('yargs').argv;
const paths = require('./build/paths');


// Set isProduction based on environment or argv.

let isProduction = process.env.NODE_ENV === 'production';
if (argv.production) {
    isProduction = true;
}

/**
 * Webpack configuration
 * Run using "webpack" or "npm run build"
 */
module.exports = {
    // Entry points locations.
    entry: {
        'admin_overrides': `${__dirname}/${paths.scssSrcDir}/admin/admin_overrides.scss`,
    },

    // (Output) bundle locations.
    output: {
        path: __dirname + '/' + paths.jsDir,
        filename: '[name].js', // file
        chunkFilename: '[name].bundle.js',
        publicPath: '/static/bundles/',
    },

    // Plugins
    plugins: [
        new MiniCssExtractPlugin(),
    ],

    // Modules
    module: {
        rules: [
            // .scss
            {
                test: /\.(sa|sc|c)ss$/,
                use: [
                    // Writes css files.
                    MiniCssExtractPlugin.loader,

                    // Loads CSS files.
                    {
                        loader: 'css-loader',
                        options: {
                            url: false
                        },
                    },

                    // Compiles .scss to .css.
                    {
                        loader: 'sass-loader',
                        options: {
                            sassOptions: {
                                comments: false,
                                style: 'compressed'
                            },
                            sourceMap: argv.sourcemap
                        },
                    },
                ],
            },
        ]
    },

    // Use --production to optimize output.
    mode: isProduction ? 'production' : 'development',

    // Use --sourcemap to generate sourcemap.
    devtool: argv.sourcemap ? 'sourcemap' : false,
};
