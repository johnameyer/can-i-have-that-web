const webpack = require('webpack');
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: './client/src/index.ts',
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: [ '.ts', '.js' ],
    symlinks: false
  },
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist')
  },
  optimization: {
    usedExports: true,
  },
  plugins: [
    // new webpack.DefinePlugin({
    // }),
    new HtmlWebpackPlugin({
      title: 'Can I Have That Online',
      template: './client/index.html',

      baseUrl: process.env.BASE_URL || '/',
      logRocketId: process.env.LOG_ROCKET_ID,
    }),
    new CopyPlugin({
      patterns: [
        { from: './client/static' }
      ],
    }),
  ],
  performance: {
    assetFilter: function(assetFilename) {
      return assetFilename.endsWith('.js');
    }
  }
};