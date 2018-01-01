const preactCliTypeScript = require('preact-cli-plugin-typescript');
const CopyWebpackPlugin = require('copy-webpack-plugin')
const UglifyJsPlugin = require('uglifyjs-webpack-plugin')

/**
 * Function that mutates original webpack config.
 * Supports asynchronous changes when promise is returned.
 *
 * @param {object} config original webpack config.
 * @param {object} env options passed to CLI.
 * @param {WebpackConfigHelpers} helpers object with useful helpers when working with config.
 **/
export default function (config, env, helpers) {
  const index = config.plugins.findIndex(plugin => plugin.constructor.name === 'UglifyJsPlugin');
  if (index >= 0) {
      const oldOptions = config.plugins[index].options;
      delete oldOptions.compress.screw_ie8
      config.plugins[index] = new UglifyJsPlugin({
          uglifyOptions: oldOptions
      })
  }

  // const { rule } = helpers.getLoadersByName(config, 'babel-loader')[0];
  // rule.options.plugins.push('transform-regenerator');
  // rule.options.plugins.push(["transform-runtime", {
  //     "helpers": false,
  //     "polyfill": false,
  //     "regenerator": true
  // }]);

  config.plugins.push(
      new CopyWebpackPlugin([
          {
              from: '../node_modules/monaco-editor/min/vs',
              to: 'vs'
          },
          {
            from: '../external/glkote',
            to: 'glkote'
          }
    ]));

    preactCliTypeScript(config)
}
