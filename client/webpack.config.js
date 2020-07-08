const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  devtool: "inline-source-map",
  entry: './client/build/index.js',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist')
  },
  optimization: {
    usedExports: true,
  },
  plugins: [new HtmlWebpackPlugin({
    title: 'Can I Have That Online',
    baseUrl: process.env.BASE_URL || '/',
    template: './client/index.html',
    logRocketId: process.env.LOG_ROCKET_ID
  })]
};