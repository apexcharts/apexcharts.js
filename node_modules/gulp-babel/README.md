> This readme is for gulp-babel v8 + Babel v7
> Check the [7.x branch](https://github.com/babel/gulp-babel/tree/v7-maintenance) for docs with Babel v6 usage

# gulp-babel [![npm](https://img.shields.io/npm/v/gulp-babel.svg?maxAge=2592000)](https://www.npmjs.com/package/gulp-babel) [![Build Status](https://travis-ci.org/babel/gulp-babel.svg?branch=master)](https://travis-ci.org/babel/gulp-babel)

> Use next generation JavaScript, today, with [Babel](https://babeljs.io)

*Issues with the output should be reported on the Babel [issue tracker](https://phabricator.babeljs.io/).*


## Install

Install `gulp-babel` if you want to get the pre-release of the next version of `gulp-babel`.

```
# Babel 7
$ npm install --save-dev gulp-babel @babel/core @babel/preset-env

# Babel 6
$ npm install --save-dev gulp-babel@7 babel-core babel-preset-env
```

## Usage

```js
const gulp = require('gulp');
const babel = require('gulp-babel');

gulp.task('default', () =>
	gulp.src('src/app.js')
		.pipe(babel({
			presets: ['@babel/env']
		}))
		.pipe(gulp.dest('dist'))
);
```


## API

### babel([options])

#### options

See the Babel [options](https://babeljs.io/docs/usage/options/), except for `sourceMap` and `filename` which is handled for you.


## Source Maps

Use [gulp-sourcemaps](https://github.com/floridoo/gulp-sourcemaps) like this:

```js
const gulp = require('gulp');
const sourcemaps = require('gulp-sourcemaps');
const babel = require('gulp-babel');
const concat = require('gulp-concat');

gulp.task('default', () =>
	gulp.src('src/**/*.js')
		.pipe(sourcemaps.init())
		.pipe(babel({
			presets: ['@babel/env']
		}))
		.pipe(concat('all.js'))
		.pipe(sourcemaps.write('.'))
		.pipe(gulp.dest('dist'))
);
```


## Babel Metadata

Files in the stream are annotated with a `babel` property, which contains the metadata from [`babel.transform()`](https://babeljs.io/docs/usage/api/).

#### Example

```js
const gulp = require('gulp');
const babel = require('gulp-babel');
const through = require('through2');

function logBabelMetadata() {
	return through.obj((file, enc, cb) => {
		console.log(file.babel.test); // 'metadata'
		cb(null, file);
	});
}

gulp.task('default', () =>
	gulp.src('src/**/*.js')
		.pipe(babel({
			// plugin that sets some metadata
			plugins: [{
				post(file) {
					file.metadata.test = 'metadata';
				}
			}]
		}))
		.pipe(logBabelMetadata())
)
```


## Runtime

If you're attempting to use features such as generators, you'll need to add `transform-runtime` as a plugin, to include the Babel runtime. Otherwise, you'll receive the error: `regeneratorRuntime is not defined`.

Install the runtime:

```
$ npm install --save-dev @babel/plugin-transform-runtime 
$ npm install --save @babel/runtime 
```

Use it as plugin:

```js
const gulp = require('gulp');
const babel = require('gulp-babel');

gulp.task('default', () =>
	gulp.src('src/app.js')
		.pipe(babel({
			plugins: ['@babel/transform-runtime']
		}))
		.pipe(gulp.dest('dist'))
);
```


## License

MIT © [Sindre Sorhus](http://sindresorhus.com)
