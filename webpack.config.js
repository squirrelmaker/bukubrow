'use strict';

// Dependencies
const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const TsConfigPathsPlugin = require('tsconfig-paths-webpack-plugin');

module.exports = (env) => {
	// Only utilise some features in certain environments
	const devMode = env && env.DEV_MODE;
	const serverMode = env && env.SERVER_MODE;

	// Don't use an eval() source map, it will breach default
	// content_security_policy. Whilst that key could be changed in the manifest
	// it's better to just use these slightly slower non-eval sourcemaps
	const devtool = devMode ? 'cheap-module-source-map' : false;

	const plugins = [
		new CopyWebpackPlugin([
			{ from: './src/assets/', to: 'assets/' },
			{ from: './src/manifest.json' },
		]),
		new HtmlWebpackPlugin({
			filename: 'content/content.build.html',
			template: './src/templates/app.html',
			chunks: [
				serverMode ? 'webextensionEnv' : undefined,
				'content',
			],
			// Ensure the webextensionEnv mock is placed in DOM ahead of other scripts
			chunksSortMode: (a, _b) => a.name === 'webextensionEnv' ? 1 : -1,
		}),
		new HtmlWebpackPlugin({
			filename: 'options/options.build.html',
			template: './src/templates/app.html',
			chunks: ['options'],
		}),
	];

	if (serverMode) plugins.push(new HtmlWebpackPlugin({
		filename: 'index.html',
		template: './src/templates/simulator.html',
		chunks: [],
	}));

	const cfg = {
		mode: devMode ? 'development' : 'production',
		devtool,
		devServer: {
			contentBase: './dist/',
		},
		stats: 'minimal',
		plugins,
		context: __dirname,
		target: 'web',
		resolve: {
			extensions: ['.ts', '.tsx', '.js'],
			plugins: [new TsConfigPathsPlugin()],
		},
		entry: {
			content: './src/apps/content',
			options: './src/apps/options',
			backend: './src/apps/backend',
			...(serverMode ? { webextensionEnv: './src/webextension-env.ts' } : {}),
		},
		output: {
			filename: '[name]/[name].build.js',
			path: `${__dirname}/dist/`,
		},
		module: {
			rules: [
				{
					enforce: 'pre',
					test: /\.tsx?$/,
					loader: 'eslint-loader',
					exclude: /node_modules/,
				},
				{
					test: /\.tsx?$/,
					loader: 'ts-loader',
					exclude: /node_modules/,
				},
			],
		},
	};

	return cfg;
};
