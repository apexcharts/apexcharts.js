import * as babel from '@babel/core';
import { createFilter } from '@rollup/pluginutils';
import { addNamed } from '@babel/helper-module-imports';

function _defineProperty(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }

  return obj;
}

function ownKeys(object, enumerableOnly) {
  var keys = Object.keys(object);

  if (Object.getOwnPropertySymbols) {
    var symbols = Object.getOwnPropertySymbols(object);
    if (enumerableOnly) symbols = symbols.filter(function (sym) {
      return Object.getOwnPropertyDescriptor(object, sym).enumerable;
    });
    keys.push.apply(keys, symbols);
  }

  return keys;
}

function _objectSpread2(target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = arguments[i] != null ? arguments[i] : {};

    if (i % 2) {
      ownKeys(Object(source), true).forEach(function (key) {
        _defineProperty(target, key, source[key]);
      });
    } else if (Object.getOwnPropertyDescriptors) {
      Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
    } else {
      ownKeys(Object(source)).forEach(function (key) {
        Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
      });
    }
  }

  return target;
}

function _objectWithoutPropertiesLoose(source, excluded) {
  if (source == null) return {};
  var target = {};
  var sourceKeys = Object.keys(source);
  var key, i;

  for (i = 0; i < sourceKeys.length; i++) {
    key = sourceKeys[i];
    if (excluded.indexOf(key) >= 0) continue;
    target[key] = source[key];
  }

  return target;
}

function _objectWithoutProperties(source, excluded) {
  if (source == null) return {};

  var target = _objectWithoutPropertiesLoose(source, excluded);

  var key, i;

  if (Object.getOwnPropertySymbols) {
    var sourceSymbolKeys = Object.getOwnPropertySymbols(source);

    for (i = 0; i < sourceSymbolKeys.length; i++) {
      key = sourceSymbolKeys[i];
      if (excluded.indexOf(key) >= 0) continue;
      if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue;
      target[key] = source[key];
    }
  }

  return target;
}

const BUNDLED = 'bundled';
const INLINE = 'inline';
const RUNTIME = 'runtime';
const EXTERNAL = 'external'; // NOTE: DO NOT REMOVE the null character `\0` as it may be used by other plugins
// e.g. https://github.com/rollup/rollup-plugin-node-resolve/blob/313a3e32f432f9eb18cc4c231cc7aac6df317a51/src/index.js#L74

const HELPERS = '\0rollupPluginBabelHelpers.js';

function importHelperPlugin({
  types: t
}) {
  return {
    pre(file) {
      const cachedHelpers = {};
      file.set('helperGenerator', name => {
        if (!file.availableHelper(name)) {
          return null;
        }

        if (cachedHelpers[name]) {
          return t.cloneNode(cachedHelpers[name]);
        }

        return cachedHelpers[name] = addNamed(file.path, name, HELPERS);
      });
    }

  };
}

const addBabelPlugin = (options, plugin) => {
  return _objectSpread2(_objectSpread2({}, options), {}, {
    plugins: options.plugins.concat(plugin)
  });
};
const warned = {};
function warnOnce(ctx, msg) {
  if (warned[msg]) return;
  warned[msg] = true;
  ctx.warn(msg);
}
const regExpCharactersRegExp = /[\\^$.*+?()[\]{}|]/g;
const escapeRegExpCharacters = str => str.replace(regExpCharactersRegExp, '\\$&');
function stripQuery(id) {
  // strip query params from import
  const [bareId, query] = id.split('?');
  const suffix = `${query ? `?${query}` : ''}`;
  return {
    bareId,
    query,
    suffix
  };
}

const MODULE_ERROR = 'Rollup requires that your Babel configuration keeps ES6 module syntax intact. ' + 'Unfortunately it looks like your configuration specifies a module transformer ' + 'to replace ES6 modules with another module format. To continue you have to disable it.' + '\n\n' + "Most commonly it's a CommonJS transform added by @babel/preset-env - " + 'in such case you should disable it by adding `modules: false` option to that preset ' + '(described in more detail here - https://github.com/rollup/plugins/tree/master/packages/babel#modules ).';
const UNEXPECTED_ERROR = 'An unexpected situation arose. Please raise an issue at ' + 'https://github.com/rollup/plugins/issues. Thanks!';
const PREFLIGHT_TEST_STRING = '__ROLLUP__PREFLIGHT_CHECK_DO_NOT_TOUCH__';
const PREFLIGHT_INPUT = `export default "${PREFLIGHT_TEST_STRING}";`;

function helpersTestTransform() {
  return {
    visitor: {
      StringLiteral(path, state) {
        if (path.node.value === PREFLIGHT_TEST_STRING) {
          path.replaceWith(state.file.addHelper('inherits'));
        }
      }

    }
  };
}

const mismatchError = (actual, expected, filename) => `You have declared using "${expected}" babelHelpers, but transforming ${filename} resulted in "${actual}". Please check your configuration.`; // Revert to /\/helpers\/(esm\/)?inherits/ when Babel 8 gets released, this was fixed in https://github.com/babel/babel/issues/14185


const inheritsHelperRe = /[\\/]+helpers[\\/]+(esm[\\/]+)?inherits/;
async function preflightCheck(ctx, babelHelpers, transformOptions) {
  const finalOptions = addBabelPlugin(transformOptions, helpersTestTransform);
  const check = (await babel.transformAsync(PREFLIGHT_INPUT, finalOptions)).code; // Babel sometimes splits ExportDefaultDeclaration into 2 statements, so we also check for ExportNamedDeclaration

  if (!/export (d|{)/.test(check)) {
    ctx.error(MODULE_ERROR);
  }

  if (inheritsHelperRe.test(check)) {
    if (babelHelpers === RUNTIME) {
      return;
    }

    ctx.error(mismatchError(RUNTIME, babelHelpers, transformOptions.filename));
  }

  if (check.includes('babelHelpers.inherits')) {
    if (babelHelpers === EXTERNAL) {
      return;
    }

    ctx.error(mismatchError(EXTERNAL, babelHelpers, transformOptions.filename));
  } // test unminifiable string content


  if (check.includes('Super expression must either be null or a function')) {
    if (babelHelpers === INLINE || babelHelpers === BUNDLED) {
      return;
    }

    if (babelHelpers === RUNTIME && !transformOptions.plugins.length) {
      ctx.error(`You must use the \`@babel/plugin-transform-runtime\` plugin when \`babelHelpers\` is "${RUNTIME}".\n`);
    }

    ctx.error(mismatchError(INLINE, babelHelpers, transformOptions.filename));
  }

  ctx.error(UNEXPECTED_ERROR);
}

async function transformCode(inputCode, babelOptions, overrides, customOptions, ctx, finalizeOptions) {
  // loadPartialConfigAsync has become available in @babel/core@7.8.0
  const config = await (babel.loadPartialConfigAsync || babel.loadPartialConfig)(babelOptions); // file is ignored by babel

  if (!config) {
    return null;
  }

  let transformOptions = !overrides.config ? config.options : await overrides.config.call(ctx, config, {
    code: inputCode,
    customOptions
  });

  if (finalizeOptions) {
    transformOptions = await finalizeOptions(transformOptions);
  }

  if (!overrides.result) {
    const {
      code,
      map
    } = await babel.transformAsync(inputCode, transformOptions);
    return {
      code,
      map
    };
  }

  const result = await babel.transformAsync(inputCode, transformOptions);
  const {
    code,
    map
  } = await overrides.result.call(ctx, result, {
    code: inputCode,
    customOptions,
    config,
    transformOptions
  });
  return {
    code,
    map
  };
}

const unpackOptions = (_ref = {}) => {
  let {
    extensions = babel.DEFAULT_EXTENSIONS,
    // rollup uses sourcemap, babel uses sourceMaps
    // just normalize them here so people don't have to worry about it
    sourcemap = true,
    sourcemaps = true,
    sourceMap = true,
    sourceMaps = true
  } = _ref,
      rest = _objectWithoutProperties(_ref, ["extensions", "sourcemap", "sourcemaps", "sourceMap", "sourceMaps"]);

  return _objectSpread2(_objectSpread2({
    extensions,
    plugins: [],
    sourceMaps: sourcemap && sourcemaps && sourceMap && sourceMaps
  }, rest), {}, {
    caller: _objectSpread2({
      name: '@rollup/plugin-babel'
    }, rest.caller)
  });
};

const warnAboutDeprecatedHelpersOption = ({
  deprecatedOption,
  suggestion
}) => {
  // eslint-disable-next-line no-console
  console.warn(`\`${deprecatedOption}\` has been removed in favor a \`babelHelpers\` option. Try changing your configuration to \`${suggestion}\`. ` + `Refer to the documentation to learn more: https://github.com/rollup/plugins/tree/master/packages/babel#babelhelpers`);
};

const unpackInputPluginOptions = (_ref2, rollupVersion) => {
  let {
    skipPreflightCheck = false
  } = _ref2,
      rest = _objectWithoutProperties(_ref2, ["skipPreflightCheck"]);

  if ('runtimeHelpers' in rest) {
    warnAboutDeprecatedHelpersOption({
      deprecatedOption: 'runtimeHelpers',
      suggestion: `babelHelpers: 'runtime'`
    });
  } else if ('externalHelpers' in rest) {
    warnAboutDeprecatedHelpersOption({
      deprecatedOption: 'externalHelpers',
      suggestion: `babelHelpers: 'external'`
    });
  } else if (!rest.babelHelpers) {
    // eslint-disable-next-line no-console
    console.warn("babelHelpers: 'bundled' option was used by default. It is recommended to configure this option explicitly, read more here: " + 'https://github.com/rollup/plugins/tree/master/packages/babel#babelhelpers');
  }

  return unpackOptions(_objectSpread2(_objectSpread2({}, rest), {}, {
    skipPreflightCheck,
    babelHelpers: rest.babelHelpers || BUNDLED,
    caller: _objectSpread2({
      supportsStaticESM: true,
      supportsDynamicImport: true,
      supportsTopLevelAwait: true,
      // todo: remove version checks for 1.20 - 1.25 when we bump peer deps
      supportsExportNamespaceFrom: !rollupVersion.match(/^1\.2[0-5]\./)
    }, rest.caller)
  }));
};

const unpackOutputPluginOptions = (options, {
  format
}) => unpackOptions(_objectSpread2(_objectSpread2({
  configFile: false,
  sourceType: format === 'es' ? 'module' : 'script'
}, options), {}, {
  caller: _objectSpread2({
    supportsStaticESM: format === 'es'
  }, options.caller)
}));

function getOptionsWithOverrides(pluginOptions = {}, overrides = {}) {
  if (!overrides.options) return {
    customOptions: null,
    pluginOptionsWithOverrides: pluginOptions
  };
  const overridden = overrides.options(pluginOptions);

  if (typeof overridden.then === 'function') {
    throw new Error(".options hook can't be asynchronous. It should return `{ customOptions, pluginsOptions }` synchronously.");
  }

  return {
    customOptions: overridden.customOptions || null,
    pluginOptionsWithOverrides: overridden.pluginOptions || pluginOptions
  };
}

const returnObject = () => {
  return {};
};

function createBabelInputPluginFactory(customCallback = returnObject) {
  const overrides = customCallback(babel);
  return pluginOptions => {
    const {
      customOptions,
      pluginOptionsWithOverrides
    } = getOptionsWithOverrides(pluginOptions, overrides);
    let babelHelpers;
    let babelOptions;
    let filter;
    let skipPreflightCheck;
    return {
      name: 'babel',

      options() {
        // todo: remove options hook and hoist declarations when version checks are removed
        let exclude;
        let include;
        let extensions;
        let customFilter;

        var _unpackInputPluginOpt = unpackInputPluginOptions(pluginOptionsWithOverrides, this.meta.rollupVersion);

        ({
          exclude,
          extensions,
          babelHelpers,
          include,
          filter: customFilter,
          skipPreflightCheck
        } = _unpackInputPluginOpt);
        babelOptions = _objectWithoutProperties(_unpackInputPluginOpt, ["exclude", "extensions", "babelHelpers", "include", "filter", "skipPreflightCheck"]);
        const extensionRegExp = new RegExp(`(${extensions.map(escapeRegExpCharacters).join('|')})$`);

        if (customFilter && (include || exclude)) {
          throw new Error('Could not handle include or exclude with custom filter together');
        }

        const userDefinedFilter = typeof customFilter === 'function' ? customFilter : createFilter(include, exclude);

        filter = id => extensionRegExp.test(stripQuery(id).bareId) && userDefinedFilter(id);

        return null;
      },

      resolveId(id) {
        if (id !== HELPERS) {
          return null;
        }

        return id;
      },

      load(id) {
        if (id !== HELPERS) {
          return null;
        }

        return babel.buildExternalHelpers(null, 'module');
      },

      transform(code, filename) {
        if (!filter(filename)) return null;
        if (filename === HELPERS) return null;
        return transformCode(code, _objectSpread2(_objectSpread2({}, babelOptions), {}, {
          filename
        }), overrides, customOptions, this, async transformOptions => {
          if (!skipPreflightCheck) {
            await preflightCheck(this, babelHelpers, transformOptions);
          }

          return babelHelpers === BUNDLED ? addBabelPlugin(transformOptions, importHelperPlugin) : transformOptions;
        });
      }

    };
  };
}

function getRecommendedFormat(rollupFormat) {
  switch (rollupFormat) {
    case 'amd':
      return 'amd';

    case 'iife':
    case 'umd':
      return 'umd';

    case 'system':
      return 'systemjs';

    default:
      return '<module format>';
  }
}

function createBabelOutputPluginFactory(customCallback = returnObject) {
  const overrides = customCallback(babel);
  return pluginOptions => {
    const {
      customOptions,
      pluginOptionsWithOverrides
    } = getOptionsWithOverrides(pluginOptions, overrides);
    return {
      name: 'babel',

      renderStart(outputOptions) {
        const {
          extensions,
          include,
          exclude,
          allowAllFormats
        } = pluginOptionsWithOverrides;

        if (extensions || include || exclude) {
          warnOnce(this, 'The "include", "exclude" and "extensions" options are ignored when transforming the output.');
        }

        if (!allowAllFormats && outputOptions.format !== 'es' && outputOptions.format !== 'cjs') {
          this.error(`Using Babel on the generated chunks is strongly discouraged for formats other than "esm" or "cjs" as it can easily break wrapper code and lead to accidentally created global variables. Instead, you should set "output.format" to "esm" and use Babel to transform to another format, e.g. by adding "presets: [['@babel/env', { modules: '${getRecommendedFormat(outputOptions.format)}' }]]" to your Babel options. If you still want to proceed, add "allowAllFormats: true" to your plugin options.`);
        }
      },

      renderChunk(code, chunk, outputOptions) {
        /* eslint-disable no-unused-vars */
        const _unpackOutputPluginOp = unpackOutputPluginOptions(pluginOptionsWithOverrides, outputOptions),
              babelOptions = _objectWithoutProperties(_unpackOutputPluginOp, ["allowAllFormats", "exclude", "extensions", "externalHelpers", "externalHelpersWhitelist", "include", "runtimeHelpers"]);
        /* eslint-enable no-unused-vars */


        return transformCode(code, babelOptions, overrides, customOptions, this);
      }

    };
  };
} // export this for symmetry with output-related exports


const getBabelInputPlugin = createBabelInputPluginFactory();
const getBabelOutputPlugin = createBabelOutputPluginFactory();

export { getBabelInputPlugin as babel, createBabelInputPluginFactory, createBabelOutputPluginFactory, getBabelInputPlugin as default, getBabelInputPlugin, getBabelOutputPlugin };
