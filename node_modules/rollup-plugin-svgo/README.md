[![version](https://img.shields.io/npm/v/rollup-plugin-svgo.svg)]()  [![license](https://img.shields.io/github/license/porsager/rollup-plugin-svgo.svg)]()

# ✂️ `rollup-plugin-svgo`

A rollup plugin to import svg files processed with [svgo](https://github.com/svg/svgo)

> SVG files, especially those exported from various editors, usually contain a lot of redundant and useless information. This can include editor metadata, comments, hidden elements, default or non-optimal values and other stuff that can be safely removed or converted without affecting the SVG rendering result.

## Usage

```bash
npm i -D rollup-plugin-svgo
```

```js
import svgo from 'rollup-plugin-svgo'

export default {
  plugins: [
    svgo(/* options */)
  ]
}
```

### Options

If you want to skip any svgo processing you can pass
```js
{
  raw: true
}
```
in options. This will import the svg content as is.

Other options are passed directly to svgo to toggle various svgo plugins. You can find all plugins here: https://github.com/svg/svgo#what-it-can-do

Svgo options are a bit verbose to write, so see the defaults used below for how to do it:

### Defaults

```js
{
  plugins: [{
    removeViewBox: false
  }, {
    removeDimensions: true
  }]
}
```
