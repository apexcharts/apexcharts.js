# rollup-plugin-copy-glob

Rollup plugin to easily copy files and folders. Glob supported

## Install

```sh
npm i -D rollup-plugin-copy-glob
```

## Usage

```js
import copy from 'rollup-plugin-copy-glob';

export default {
  input: 'src/index.js',
  output: {
    file: 'dist/bundle.js',
    format: 'iife',
    name: 'app'
  },
  plugins: [
    copy([
      { files: 'src/*.{html,css}', dest: 'dist' },
      { files: 'dev/fonts/*.*', dest: 'dist/fonts' },
      { files: 'dev/images/**/*.*', dest: 'dist/images' }
    ], { verbose: true, watch: true })
  ]
};
```

### Options
  - verbose (default is `false`). Enable/disable logging
  - watch (default is `false`). Enable/disable watching. If disabled then copy only on start
