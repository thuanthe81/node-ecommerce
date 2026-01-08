/**
 * Minimal Webpack Configuration for Ultra-Low CPU Usage
 * Use this configuration when system resources are extremely limited
 */

const path = require('path');

module.exports = {
  mode: 'production',

  // Disable all optimizations that consume CPU
  optimization: {
    minimize: false, // Disable minification to save CPU
    splitChunks: false, // Disable code splitting
    runtimeChunk: false,
    removeAvailableModules: false,
    removeEmptyChunks: false,
    mergeDuplicateChunks: false,
    flagIncludedChunks: false,
    occurrenceOrder: false,
    providedExports: false,
    usedExports: false,
    concatenateModules: false,
    sideEffects: false,
  },

  // Minimal performance settings
  performance: {
    hints: false, // Disable performance hints
  },

  // Disable source maps completely
  devtool: false,

  // Minimal stats output
  stats: 'errors-only',

  // Reduce parallelism to absolute minimum
  parallelism: 1,

  // Minimal cache configuration
  cache: {
    type: 'memory',
    maxGenerations: 1,
    maxAge: 30000, // 30 seconds
  },

  // Disable file system watching
  watchOptions: {
    ignored: /node_modules/,
    aggregateTimeout: 1000,
    poll: false,
  },

  // Minimal resolve configuration
  resolve: {
    symlinks: false,
    cacheWithContext: false,
    unsafeCache: false,
  },

  // Disable module concatenation
  module: {
    unsafeCache: false,
  },

  // Minimal plugins array
  plugins: [],

  // Node configuration for minimal polyfills
  node: false,

  // Disable experiments
  experiments: {},
};