const path = require('path');

module.exports = {
  entry: './src/app.js',  // Ensure this path is correct
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist')
  },
  mode: 'production',
  module: {
    rules: [
      {
        test: /\.m?js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      }
    ]
  },
  resolve: {
    alias: {
      bcrypt: 'bcryptjs'  // Alias bcrypt to bcryptjs
    }
  },
  devtool: 'source-map'
};