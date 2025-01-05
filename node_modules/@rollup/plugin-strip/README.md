# @rollup/plugin-strip

Remove `debugger` statements and functions like `assert.equal` and `console.log` from your code.

## Installation

```bash
npm install --save-dev @rollup/plugin-strip
```

## Usage

```js
// rollup.config.js
import strip from '@rollup/plugin-strip';

export default {
  input: 'src/index.js',
  output: [
    {
      format: 'cjs',
      file: 'dist/my-lib.js'
    }
  ],
  plugins: [
    strip({
      // set this to `false` if you don't want to
      // remove debugger statements
      debugger: true,

      // defaults to `[ 'console.*', 'assert.*' ]`
      functions: ['console.log', 'assert.*', 'debug', 'alert'],

      // remove one or more labeled blocks by name
      // defaults to `[]`
      labels: ['unittest'],

      // set this to `false` if you're not using sourcemaps –
      // defaults to `true`
      sourceMap: true
    })
  ]
};
```

## License

MIT
