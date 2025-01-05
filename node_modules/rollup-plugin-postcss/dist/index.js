'use strict';

var path = require('path');
var rollupPluginutils = require('rollup-pluginutils');
var Concat = require('concat-with-sourcemaps');
var series = require('promise.series');
var importCwd = require('import-cwd');
var postcss = require('postcss');
var findPostcssConfig = require('postcss-load-config');
var safeIdentifier = require('safe-identifier');
var pify = require('pify');
var resolve = require('resolve');
var PQueue = require('p-queue');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var path__default = /*#__PURE__*/_interopDefaultLegacy(path);
var Concat__default = /*#__PURE__*/_interopDefaultLegacy(Concat);
var series__default = /*#__PURE__*/_interopDefaultLegacy(series);
var importCwd__default = /*#__PURE__*/_interopDefaultLegacy(importCwd);
var postcss__default = /*#__PURE__*/_interopDefaultLegacy(postcss);
var findPostcssConfig__default = /*#__PURE__*/_interopDefaultLegacy(findPostcssConfig);
var pify__default = /*#__PURE__*/_interopDefaultLegacy(pify);
var resolve__default = /*#__PURE__*/_interopDefaultLegacy(resolve);
var PQueue__default = /*#__PURE__*/_interopDefaultLegacy(PQueue);

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {
  try {
    var info = gen[key](arg);
    var value = info.value;
  } catch (error) {
    reject(error);
    return;
  }

  if (info.done) {
    resolve(value);
  } else {
    Promise.resolve(value).then(_next, _throw);
  }
}

function _asyncToGenerator(fn) {
  return function () {
    var self = this,
        args = arguments;
    return new Promise(function (resolve, reject) {
      var gen = fn.apply(self, args);

      function _next(value) {
        asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value);
      }

      function _throw(err) {
        asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err);
      }

      _next(undefined);
    });
  };
}

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

function _unsupportedIterableToArray(o, minLen) {
  if (!o) return;
  if (typeof o === "string") return _arrayLikeToArray(o, minLen);
  var n = Object.prototype.toString.call(o).slice(8, -1);
  if (n === "Object" && o.constructor) n = o.constructor.name;
  if (n === "Map" || n === "Set") return Array.from(o);
  if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen);
}

function _arrayLikeToArray(arr, len) {
  if (len == null || len > arr.length) len = arr.length;

  for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i];

  return arr2;
}

function _createForOfIteratorHelper(o, allowArrayLike) {
  var it;

  if (typeof Symbol === "undefined" || o[Symbol.iterator] == null) {
    if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") {
      if (it) o = it;
      var i = 0;

      var F = function () {};

      return {
        s: F,
        n: function () {
          if (i >= o.length) return {
            done: true
          };
          return {
            done: false,
            value: o[i++]
          };
        },
        e: function (e) {
          throw e;
        },
        f: F
      };
    }

    throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
  }

  var normalCompletion = true,
      didErr = false,
      err;
  return {
    s: function () {
      it = o[Symbol.iterator]();
    },
    n: function () {
      var step = it.next();
      normalCompletion = step.done;
      return step;
    },
    e: function (e) {
      didErr = true;
      err = e;
    },
    f: function () {
      try {
        if (!normalCompletion && it.return != null) it.return();
      } finally {
        if (didErr) throw err;
      }
    }
  };
}

/* eslint import/no-anonymous-default-export: [2, {"allowArrowFunction": true}] */
var normalizePath = (path => path && path.replace(/\\+/g, '/'));

const humanlizePath = filepath => normalizePath(path__default['default'].relative(process.cwd(), filepath));

const styleInjectPath = require.resolve('style-inject/dist/style-inject.es').replace(/[\\/]+/g, '/');

function loadConfig(id, {
  ctx: configOptions,
  path: configPath
}) {
  const handleError = err => {
    if (!err.message.includes('No PostCSS Config found')) {
      throw err;
    } // Return empty options for PostCSS


    return {};
  };

  configPath = configPath ? path__default['default'].resolve(configPath) : path__default['default'].dirname(id);
  const ctx = {
    file: {
      extname: path__default['default'].extname(id),
      dirname: path__default['default'].dirname(id),
      basename: path__default['default'].basename(id)
    },
    options: configOptions || {}
  };
  return findPostcssConfig__default['default'](ctx, configPath).catch(handleError);
}

function escapeClassNameDashes(string) {
  return string.replace(/-+/g, match => {
    return `$${match.replace(/-/g, '_')}$`;
  });
}

function ensureClassName(name) {
  name = escapeClassNameDashes(name);
  return safeIdentifier.identifier(name, false);
}

function ensurePostCSSOption(option) {
  return typeof option === 'string' ? importCwd__default['default'](option) : option;
}

function isModuleFile(file) {
  return /\.module\.[a-z]{2,6}$/.test(file);
}
/* eslint import/no-anonymous-default-export: [2, {"allowObject": true}] */


var postcssLoader = {
  name: 'postcss',
  alwaysProcess: true,

  // `test` option is dynamically set in ./loaders
  // eslint-disable-next-line complexity
  process({
    code,
    map
  }) {
    var _this = this;

    return _asyncToGenerator(function* () {
      const config = _this.options.config ? yield loadConfig(_this.id, _this.options.config) : {};
      const options = _this.options;
      const plugins = [...(options.postcss.plugins || []), ...(config.plugins || [])];
      const shouldExtract = options.extract;
      const shouldInject = options.inject;
      const modulesExported = {};
      const autoModules = options.autoModules !== false && options.onlyModules !== true;
      const isAutoModule = autoModules && isModuleFile(_this.id);
      const supportModules = autoModules ? isAutoModule : options.modules;

      if (supportModules) {
        plugins.unshift(require('postcss-modules')(_objectSpread2(_objectSpread2({
          // In tests
          // Skip hash in names since css content on windows and linux would differ because of `new line` (\r?\n)
          generateScopedName: process.env.ROLLUP_POSTCSS_TEST ? '[name]_[local]' : '[name]_[local]__[hash:base64:5]'
        }, options.modules), {}, {
          getJSON(filepath, json, outpath) {
            modulesExported[filepath] = json;

            if (typeof options.modules === 'object' && typeof options.modules.getJSON === 'function') {
              return options.modules.getJSON(filepath, json, outpath);
            }
          }

        })));
      } // If shouldExtract, minimize is done after all CSS are extracted to a file


      if (!shouldExtract && options.minimize) {
        plugins.push(require('cssnano')(options.minimize));
      }

      const postcssOptions = _objectSpread2(_objectSpread2(_objectSpread2({}, _this.options.postcss), config.options), {}, {
        // Allow overriding `to` for some plugins that are relying on this value
        to: options.to || _this.id,
        // Followings are never modified by user config config
        from: _this.id,
        map: _this.sourceMap ? shouldExtract ? {
          inline: false,
          annotation: false
        } : {
          inline: true,
          annotation: false
        } : false
      });

      delete postcssOptions.plugins;
      postcssOptions.parser = ensurePostCSSOption(postcssOptions.parser);
      postcssOptions.syntax = ensurePostCSSOption(postcssOptions.syntax);
      postcssOptions.stringifier = ensurePostCSSOption(postcssOptions.stringifier);

      if (map && postcssOptions.map) {
        postcssOptions.map.prev = typeof map === 'string' ? JSON.parse(map) : map;
      }

      if (plugins.length === 0) {
        // Prevent from postcss warning:
        // You did not set any plugins, parser, or stringifier. Right now, PostCSS does nothing. Pick plugins for your case on https://www.postcss.parts/ and use them in postcss.config.js
        const noopPlugin = () => {
          return {
            postcssPlugin: 'postcss-noop-plugin',

            Once() {}

          };
        };

        plugins.push(noopPlugin());
      }

      const result = yield postcss__default['default'](plugins).process(code, postcssOptions);

      var _iterator = _createForOfIteratorHelper(result.messages),
          _step;

      try {
        for (_iterator.s(); !(_step = _iterator.n()).done;) {
          const message = _step.value;

          if (message.type === 'dependency') {
            _this.dependencies.add(message.file);
          }
        }
      } catch (err) {
        _iterator.e(err);
      } finally {
        _iterator.f();
      }

      var _iterator2 = _createForOfIteratorHelper(result.warnings()),
          _step2;

      try {
        for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
          const warning = _step2.value;

          if (!warning.message) {
            warning.message = warning.text;
          }

          _this.warn(warning);
        }
      } catch (err) {
        _iterator2.e(err);
      } finally {
        _iterator2.f();
      }

      const outputMap = result.map && JSON.parse(result.map.toString());

      if (outputMap && outputMap.sources) {
        outputMap.sources = outputMap.sources.map(v => normalizePath(v));
      }

      let output = '';
      let extracted;

      if (options.namedExports) {
        const json = modulesExported[_this.id];
        const getClassName = typeof options.namedExports === 'function' ? options.namedExports : ensureClassName; // eslint-disable-next-line guard-for-in

        for (const name in json) {
          const newName = getClassName(name); // Log transformed class names
          // But skip this when namedExports is a function
          // Since a user like you can manually log that if you want

          if (name !== newName && typeof options.namedExports !== 'function') {
            _this.warn(`Exported "${name}" as "${newName}" in ${humanlizePath(_this.id)}`);
          }

          if (!json[newName]) {
            json[newName] = json[name];
          }

          output += `export var ${newName} = ${JSON.stringify(json[name])};\n`;
        }
      }

      const cssVariableName = safeIdentifier.identifier('css', true);

      if (shouldExtract) {
        output += `export default ${JSON.stringify(modulesExported[_this.id])};`;
        extracted = {
          id: _this.id,
          code: result.css,
          map: outputMap
        };
      } else {
        const module = supportModules ? JSON.stringify(modulesExported[_this.id]) : cssVariableName;
        output += `var ${cssVariableName} = ${JSON.stringify(result.css)};\n` + `export default ${module};\n` + `export var stylesheet=${JSON.stringify(result.css)};`;
      }

      if (!shouldExtract && shouldInject) {
        output += typeof options.inject === 'function' ? options.inject(cssVariableName, _this.id) : '\n' + `import styleInject from '${styleInjectPath}';\n` + `styleInject(${cssVariableName}${Object.keys(options.inject).length > 0 ? `,${JSON.stringify(options.inject)}` : ''});`;
      }

      return {
        code: output,
        map: outputMap,
        extracted
      };
    })();
  }

};

function loadModule(moduleId) {
  // Trying to load module normally (relative to plugin directory)
  try {
    return require(moduleId);
  } catch (_unused) {// Ignore error
  } // Then, trying to load it relative to CWD


  return importCwd__default['default'].silent(moduleId);
}

// See: https://github.com/sass/node-sass/issues/857

const threadPoolSize = process.env.UV_THREADPOOL_SIZE || 4;
const workQueue = new PQueue__default['default']({
  concurrency: threadPoolSize - 1
});
const moduleRe = /^~([a-z\d]|@).+/i;

const getUrlOfPartial = url => {
  const parsedUrl = path__default['default'].parse(url);
  return `${parsedUrl.dir}${path__default['default'].sep}_${parsedUrl.base}`;
};

const resolvePromise = pify__default['default'](resolve__default['default']); // List of supported SASS modules in the order of preference

const sassModuleIds = ['sass', 'node-sass'];
/* eslint import/no-anonymous-default-export: [2, {"allowObject": true}] */

var sassLoader = {
  name: 'sass',
  test: /\.(sass|scss)$/,

  process({
    code
  }) {
    return new Promise((resolve, reject) => {
      const sass = loadSassOrThrow();
      const render = pify__default['default'](sass.render.bind(sass));
      const data = this.options.data || '';
      workQueue.add(() => render(_objectSpread2(_objectSpread2({}, this.options), {}, {
        file: this.id,
        data: data + code,
        indentedSyntax: /\.sass$/.test(this.id),
        sourceMap: this.sourceMap,
        importer: [(url, importer, done) => {
          if (!moduleRe.test(url)) return done({
            file: url
          });
          const moduleUrl = url.slice(1);
          const partialUrl = getUrlOfPartial(moduleUrl);
          const options = {
            basedir: path__default['default'].dirname(importer),
            extensions: ['.scss', '.sass', '.css']
          };

          const finishImport = id => {
            done({
              // Do not add `.css` extension in order to inline the file
              file: id.endsWith('.css') ? id.replace(/\.css$/, '') : id
            });
          };

          const next = () => {
            // Catch all resolving errors, return the original file and pass responsibility back to other custom importers
            done({
              file: url
            });
          }; // Give precedence to importing a partial


          resolvePromise(partialUrl, options).then(finishImport).catch(error => {
            if (error.code === 'MODULE_NOT_FOUND' || error.code === 'ENOENT') {
              resolvePromise(moduleUrl, options).then(finishImport).catch(next);
            } else {
              next();
            }
          });
        }].concat(this.options.importer || [])
      })).then(result => {
        var _iterator = _createForOfIteratorHelper(result.stats.includedFiles),
            _step;

        try {
          for (_iterator.s(); !(_step = _iterator.n()).done;) {
            const file = _step.value;
            this.dependencies.add(file);
          }
        } catch (err) {
          _iterator.e(err);
        } finally {
          _iterator.f();
        }

        resolve({
          code: result.css.toString(),
          map: result.map && result.map.toString()
        });
      }).catch(reject));
    });
  }

};

function loadSassOrThrow() {
  // Loading one of the supported modules
  var _iterator2 = _createForOfIteratorHelper(sassModuleIds),
      _step2;

  try {
    for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
      const moduleId = _step2.value;
      const module = loadModule(moduleId);

      if (module) {
        return module;
      }
    } // Throwing exception if module can't be loaded

  } catch (err) {
    _iterator2.e(err);
  } finally {
    _iterator2.f();
  }

  throw new Error('You need to install one of the following packages: ' + sassModuleIds.map(moduleId => `"${moduleId}"`).join(', ') + ' ' + 'in order to process SASS files');
}

/* eslint import/no-anonymous-default-export: [2, {"allowObject": true}] */

var stylusLoader = {
  name: 'stylus',
  test: /\.(styl|stylus)$/,

  process({
    code
  }) {
    var _this = this;

    return _asyncToGenerator(function* () {
      const stylus = loadModule('stylus');

      if (!stylus) {
        throw new Error('You need to install "stylus" packages in order to process Stylus files');
      }

      const style = stylus(code, _objectSpread2(_objectSpread2({}, _this.options), {}, {
        filename: _this.id,
        sourcemap: _this.sourceMap && {}
      }));
      const css = yield pify__default['default'](style.render.bind(style))();
      const deps = style.deps();

      var _iterator = _createForOfIteratorHelper(deps),
          _step;

      try {
        for (_iterator.s(); !(_step = _iterator.n()).done;) {
          const dep = _step.value;

          _this.dependencies.add(dep);
        }
      } catch (err) {
        _iterator.e(err);
      } finally {
        _iterator.f();
      }

      return {
        code: css,
        map: style.sourcemap
      };
    })();
  }

};

/* eslint import/no-anonymous-default-export: [2, {"allowObject": true}] */

var lessLoader = {
  name: 'less',
  test: /\.less$/,

  process({
    code
  }) {
    var _this = this;

    return _asyncToGenerator(function* () {
      const less = loadModule('less');

      if (!less) {
        throw new Error('You need to install "less" packages in order to process Less files');
      }

      let _yield$pify = yield pify__default['default'](less.render.bind(less))(code, _objectSpread2(_objectSpread2({}, _this.options), {}, {
        sourceMap: _this.sourceMap && {},
        filename: _this.id
      })),
          css = _yield$pify.css,
          map = _yield$pify.map,
          imports = _yield$pify.imports;

      var _iterator = _createForOfIteratorHelper(imports),
          _step;

      try {
        for (_iterator.s(); !(_step = _iterator.n()).done;) {
          const dep = _step.value;

          _this.dependencies.add(dep);
        }
      } catch (err) {
        _iterator.e(err);
      } finally {
        _iterator.f();
      }

      if (map) {
        map = JSON.parse(map);
        map.sources = map.sources.map(source => humanlizePath(source));
      }

      return {
        code: css,
        map
      };
    })();
  }

};

const matchFile = (filepath, condition) => {
  if (typeof condition === 'function') {
    return condition(filepath);
  }

  return condition && condition.test(filepath);
};

class Loaders {
  constructor(options = {}) {
    this.use = options.use.map(rule => {
      if (typeof rule === 'string') {
        return [rule];
      }

      if (Array.isArray(rule)) {
        return rule;
      }

      throw new TypeError('The rule in `use` option must be string or Array!');
    });
    this.loaders = [];
    const extensions = options.extensions || ['.css', '.sss', '.pcss'];

    const customPostcssLoader = _objectSpread2(_objectSpread2({}, postcssLoader), {}, {
      test: filepath => extensions.some(ext => path__default['default'].extname(filepath) === ext)
    });

    this.registerLoader(customPostcssLoader);
    this.registerLoader(sassLoader);
    this.registerLoader(stylusLoader);
    this.registerLoader(lessLoader);

    if (options.loaders) {
      options.loaders.forEach(loader => this.registerLoader(loader));
    }
  }

  registerLoader(loader) {
    const existing = this.getLoader(loader.name);

    if (existing) {
      this.removeLoader(loader.name);
    }

    this.loaders.push(loader);
    return this;
  }

  removeLoader(name) {
    this.loaders = this.loaders.filter(loader => loader.name !== name);
    return this;
  }

  isSupported(filepath) {
    return this.loaders.some(loader => {
      return matchFile(filepath, loader.test);
    });
  }
  /**
   * Process the resource with loaders in serial
   * @param {object} resource
   * @param {string} resource.code
   * @param {any} resource.map
   * @param {object} context
   * @param {string} context.id The absolute path to resource
   * @param {boolean | 'inline'} context.sourceMap
   * @param {Set<string>} context.dependencies A set of dependencies to watch
   * @returns {{code: string, map?: any}}
   */


  process({
    code,
    map
  }, context) {
    return series__default['default'](this.use.slice().reverse().map(([name, options]) => {
      const loader = this.getLoader(name);

      const loaderContext = _objectSpread2({
        options: options || {}
      }, context);

      return v => {
        if (loader.alwaysProcess || matchFile(loaderContext.id, loader.test)) {
          return loader.process.call(loaderContext, v);
        } // Otherwise directly return input value


        return v;
      };
    }), {
      code,
      map
    });
  }

  getLoader(name) {
    return this.loaders.find(loader => loader.name === name);
  }

}

/**
 * The options that could be `boolean` or `object`
 * We convert it to an object when it's truthy
 * Otherwise fallback to default value
 */

function inferOption(option, defaultValue) {
  if (option === false) return false;
  if (option && typeof option === 'object') return option;
  return option ? {} : defaultValue;
}
/**
 * Recursively get the correct import order from rollup
 * We only process a file once
 *
 * @param {string} id
 * @param {Function} getModuleInfo
 * @param {Set<string>} seen
 */


function getRecursiveImportOrder(id, getModuleInfo, seen = new Set()) {
  if (seen.has(id)) {
    return [];
  }

  seen.add(id);
  const result = [id];
  getModuleInfo(id).importedIds.forEach(importFile => {
    result.push(...getRecursiveImportOrder(importFile, getModuleInfo, seen));
  });
  return result;
}
/* eslint import/no-anonymous-default-export: [2, {"allowArrowFunction": true}] */


var index = ((options = {}) => {
  const filter = rollupPluginutils.createFilter(options.include, options.exclude);
  const postcssPlugins = Array.isArray(options.plugins) ? options.plugins.filter(Boolean) : options.plugins;
  const sourceMap = options.sourceMap;
  const postcssLoaderOptions = {
    /** Inject CSS as `<style>` to `<head>` */
    inject: typeof options.inject === 'function' ? options.inject : inferOption(options.inject, {}),

    /** Extract CSS */
    extract: typeof options.extract === 'undefined' ? false : options.extract,

    /** CSS modules */
    onlyModules: options.modules === true,
    modules: inferOption(options.modules, false),
    namedExports: options.namedExports,

    /** Automatically CSS modules for .module.xxx files */
    autoModules: options.autoModules,

    /** Options for cssnano */
    minimize: inferOption(options.minimize, false),

    /** Postcss config file */
    config: inferOption(options.config, {}),

    /** PostCSS target filename hint, for plugins that are relying on it */
    to: options.to,

    /** PostCSS options */
    postcss: {
      parser: options.parser,
      plugins: postcssPlugins,
      syntax: options.syntax,
      stringifier: options.stringifier,
      exec: options.exec
    }
  };
  let use = ['sass', 'stylus', 'less'];

  if (Array.isArray(options.use)) {
    use = options.use;
  } else if (options.use !== null && typeof options.use === 'object') {
    use = [['sass', options.use.sass || {}], ['stylus', options.use.stylus || {}], ['less', options.use.less || {}]];
  }

  use.unshift(['postcss', postcssLoaderOptions]);
  const loaders = new Loaders({
    use,
    loaders: options.loaders,
    extensions: options.extensions
  });
  const extracted = new Map();
  return {
    name: 'postcss',

    transform(code, id) {
      var _this = this;

      return _asyncToGenerator(function* () {
        if (!filter(id) || !loaders.isSupported(id)) {
          return null;
        }

        if (typeof options.onImport === 'function') {
          options.onImport(id);
        }

        const loaderContext = {
          id,
          sourceMap,
          dependencies: new Set(),
          warn: _this.warn.bind(_this),
          plugin: _this
        };
        const result = yield loaders.process({
          code,
          map: undefined
        }, loaderContext);

        var _iterator = _createForOfIteratorHelper(loaderContext.dependencies),
            _step;

        try {
          for (_iterator.s(); !(_step = _iterator.n()).done;) {
            const dep = _step.value;

            _this.addWatchFile(dep);
          }
        } catch (err) {
          _iterator.e(err);
        } finally {
          _iterator.f();
        }

        if (postcssLoaderOptions.extract) {
          extracted.set(id, result.extracted);
          return {
            code: result.code,
            map: {
              mappings: ''
            }
          };
        }

        return {
          code: result.code,
          map: result.map || {
            mappings: ''
          }
        };
      })();
    },

    augmentChunkHash() {
      if (extracted.size === 0) return; // eslint-disable-next-line unicorn/no-reduce

      const extractedValue = [...extracted].reduce((object, [key, value]) => _objectSpread2(_objectSpread2({}, object), {}, {
        [key]: value
      }), {});
      return JSON.stringify(extractedValue);
    },

    generateBundle(options_, bundle) {
      var _this2 = this;

      return _asyncToGenerator(function* () {
        if (extracted.size === 0 || !(options_.dir || options_.file)) return; // eslint-disable-next-line no-warning-comments
        // TODO: support `[hash]`

        const dir = options_.dir || path__default['default'].dirname(options_.file);
        const file = options_.file || path__default['default'].join(options_.dir, Object.keys(bundle).find(fileName => bundle[fileName].isEntry));

        const getExtracted = () => {
          let fileName = `${path__default['default'].basename(file, path__default['default'].extname(file))}.css`;

          if (typeof postcssLoaderOptions.extract === 'string') {
            fileName = path__default['default'].isAbsolute(postcssLoaderOptions.extract) ? normalizePath(path__default['default'].relative(dir, postcssLoaderOptions.extract)) : normalizePath(postcssLoaderOptions.extract);
          }

          const concat = new Concat__default['default'](true, fileName, '\n');
          const entries = [...extracted.values()];
          const _bundle$normalizePath = bundle[normalizePath(path__default['default'].relative(dir, file))],
                modules = _bundle$normalizePath.modules,
                facadeModuleId = _bundle$normalizePath.facadeModuleId;

          if (modules) {
            const moduleIds = getRecursiveImportOrder(facadeModuleId, _this2.getModuleInfo);
            entries.sort((a, b) => moduleIds.indexOf(a.id) - moduleIds.indexOf(b.id));
          }

          for (var _i = 0, _entries = entries; _i < _entries.length; _i++) {
            const result = _entries[_i];
            const relative = normalizePath(path__default['default'].relative(dir, result.id));
            const map = result.map || null;

            if (map) {
              map.file = fileName;
            }

            concat.add(relative, result.code, map);
          }

          let code = concat.content;

          if (sourceMap === 'inline') {
            code += `\n/*# sourceMappingURL=data:application/json;base64,${Buffer.from(concat.sourceMap, 'utf8').toString('base64')}*/`;
          } else if (sourceMap === true) {
            code += `\n/*# sourceMappingURL=${path__default['default'].basename(fileName)}.map */`;
          }

          return {
            code,
            map: sourceMap === true && concat.sourceMap,
            codeFileName: fileName,
            mapFileName: fileName + '.map'
          };
        };

        if (options.onExtract) {
          const shouldExtract = yield options.onExtract(getExtracted);

          if (shouldExtract === false) {
            return;
          }
        }

        let _getExtracted = getExtracted(),
            code = _getExtracted.code,
            codeFileName = _getExtracted.codeFileName,
            map = _getExtracted.map,
            mapFileName = _getExtracted.mapFileName; // Perform cssnano on the extracted file


        if (postcssLoaderOptions.minimize) {
          const cssOptions = {};
          cssOptions.from = codeFileName;

          if (sourceMap === 'inline') {
            cssOptions.map = {
              inline: true
            };
          } else if (sourceMap === true && map) {
            cssOptions.map = {
              prev: map
            };
            cssOptions.to = codeFileName;
          }

          const result = yield require('cssnano')(postcssLoaderOptions.minimize).process(code, cssOptions);
          code = result.css;

          if (sourceMap === true && result.map && result.map.toString) {
            map = result.map.toString();
          }
        }

        _this2.emitFile({
          fileName: codeFileName,
          type: 'asset',
          source: code
        });

        if (map) {
          _this2.emitFile({
            fileName: mapFileName,
            type: 'asset',
            source: map
          });
        }
      })();
    }

  };
});

module.exports = index;
