'use strict';
const path = require('path');
const PluginError = require('plugin-error');
const through = require('through2');
const applySourceMap = require('vinyl-sourcemaps-apply');
const replaceExt = require('replace-ext');
const babel = require('@babel/core');

function replaceExtension(fp) {
	return path.extname(fp) ? replaceExt(fp, '.js') : fp;
}

module.exports = function (opts) {
	opts = opts || {};

	return through.obj(function (file, enc, cb) {
		if (file.isNull()) {
			cb(null, file);
			return;
		}

		if (file.isStream()) {
			cb(new PluginError('gulp-babel', 'Streaming not supported'));
			return;
		}

		if (!supportsCallerOption()) {
			cb(new PluginError('gulp-babel', '@babel/core@^7.0.0 is required'));
			return;
		}

		const fileOpts = Object.assign({}, opts, {
			filename: file.path,
			filenameRelative: file.relative,
			sourceMap: Boolean(file.sourceMap),
			sourceFileName: file.relative,
			caller: Object.assign(
				{name: 'babel-gulp'},
				opts.caller
			)
		});

		babel.transformAsync(file.contents.toString(), fileOpts).then(res => {
			if (res) {
				if (file.sourceMap && res.map) {
					res.map.file = replaceExtension(file.relative);
					applySourceMap(file, res.map);
				}

				file.contents = new Buffer(res.code); // eslint-disable-line unicorn/no-new-buffer
				file.path = replaceExtension(file.path);

				file.babel = res.metadata;
			}

			this.push(file);
		}).catch(err => {
			this.emit('error', new PluginError('gulp-babel', err, {
				fileName: file.path,
				showProperties: false
			}));
		}).then(
			() => cb(),
			() => cb()
		);
	});
};

// Note: We can remove this eventually, I'm just adding it so that people have
// a little time to migrate to the newer RCs of @babel/core without getting
// hard-to-diagnose errors about unknown 'caller' options.
let supportsCallerOptionFlag;
function supportsCallerOption() {
	if (supportsCallerOptionFlag === undefined) {
		try {
			// Rather than try to match the Babel version, we just see if it throws
			// when passed a 'caller' flag, and use that to decide if it is supported.
			babel.loadPartialConfig({
				caller: undefined,
				babelrc: false,
				configFile: false
			});
			supportsCallerOptionFlag = true;
		} catch (err) {
			supportsCallerOptionFlag = false;
		}
	}

	return supportsCallerOptionFlag;
}
