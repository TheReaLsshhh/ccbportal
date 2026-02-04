const { override, addWebpackPlugin } = require('customize-cra');
const CompressionPlugin = require('compression-webpack-plugin');
const path = require('path');

// Conditional bundle analyzer for development
let BundleAnalyzerPlugin;
if (process.env.NODE_ENV === 'development') {
  try {
    BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
  } catch (e) {
    console.log('webpack-bundle-analyzer not installed, skipping analysis');
  }
}

module.exports = override(
  // Optimize bundle splitting and configuration
  (config) => {
    // Optimize split chunks for better caching
    config.optimization.splitChunks = {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
          priority: 10,
          enforce: true
        },
        common: {
          name: 'common',
          minChunks: 2,
          chunks: 'all',
          priority: 5,
          enforce: true
        }
      }
    };

    // Optimize module resolution for faster imports
    config.resolve.alias = {
      ...config.resolve.alias,
      '@components': path.resolve(__dirname, 'src/components'),
      '@utils': path.resolve(__dirname, 'src/utils'),
      '@services': path.resolve(__dirname, 'src/services'),
      '@images': path.resolve(__dirname, 'public/images')
    };

    // Optimize performance
    config.performance = {
      hints: process.env.NODE_ENV === 'production' ? 'warning' : false,
      maxEntrypointSize: 512000,
      maxAssetSize: 512000
    };

    return config;
  },

  // Add compression for production builds
  process.env.NODE_ENV === 'production' && 
  addWebpackPlugin(
    new CompressionPlugin({
      algorithm: 'gzip',
      test: /\.(js|css|html|svg)$/,
      threshold: 8192,
      minRatio: 0.8
    })
  ),

  // Add bundle analyzer for development (optional)
  BundleAnalyzerPlugin && process.env.NODE_ENV === 'development' && 
  addWebpackPlugin(new BundleAnalyzerPlugin({
    analyzerMode: 'disabled',
    generateStatsFile: true,
    statsOptions: { source: false }
  }))
);
