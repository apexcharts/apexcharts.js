<div align="center">
🎉 announcing <a href="https://github.com/dotenvx/dotenvx">dotenvx</a>. <em><b>better expansion</b>, run anywhere, multi-environment, encrypted envs</em>.
</div>

&nbsp;

<div align="center">

<p>
  <sup>
    <a href="https://github.com/sponsors/motdotla">Dotenv libraries are supported by the community.</a>
  </sup>
</p>
<sup>Special thanks to:</sup>
<br>
<br>
<a href="https://www.warp.dev/?utm_source=github&utm_medium=referral&utm_campaign=dotenv_p_20220831">
  <div>
    <img src="https://res.cloudinary.com/dotenv-org/image/upload/v1661980709/warp_hi8oqj.png" width="230" alt="Warp">
  </div>
  <b>Warp is a blazingly fast, Rust-based terminal reimagined to work like a modern app.</b>
  <div>
    <sup>Get more done in the CLI with real text editing, block-based output, and AI command search.</sup>
  </div>
</a>
<br>
<a href="https://workos.com/?utm_campaign=github_repo&utm_medium=referral&utm_content=dotenv&utm_source=github">
  <div>
    <img src="https://res.cloudinary.com/dotenv-org/image/upload/c_scale,w_400/v1665605496/68747470733a2f2f73696e647265736f726875732e636f6d2f6173736574732f7468616e6b732f776f726b6f732d6c6f676f2d77686974652d62672e737667_zdmsbu.svg" width="270" alt="WorkOS">
  </div>
  <b>Your App, Enterprise Ready.</b>
  <div>
    <sup>Add Single Sign-On, Multi-Factor Auth, and more, in minutes instead of months.</sup>
  </div>
</a>
<hr>
</div>

# dotenv-expand [![NPM version](https://img.shields.io/npm/v/dotenv-expand.svg?style=flat-square)](https://www.npmjs.com/package/dotenv-expand)

<img src="https://raw.githubusercontent.com/motdotla/dotenv-expand/master/dotenv-expand.png" alt="dotenv-expand" align="right" width="200" />

Dotenv-expand adds variable expansion on top of [dotenv](http://github.com/motdotla/dotenv). If you find yourself needing to expand environment variables already existing on your machine, then dotenv-expand is your tool.

[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square)](https://github.com/feross/standard)
[![LICENSE](https://img.shields.io/github/license/motdotla/dotenv-expand.svg)](LICENSE)
[![codecov](https://codecov.io/gh/motdotla/dotenv-expand/graph/badge.svg?token=pawWEyaMfg)](https://codecov.io/gh/motdotla/dotenv-expand)

## Install

```bash
# Install locally (recommended)
npm install dotenv-expand --save
```

Or installing with yarn? `yarn add dotenv-expand`

## Usage

Create a `.env` file in the root of your project:

```dosini
PASSWORD="s1mpl3"
DB_PASS=$PASSWORD
```

As early as possible in your application, import and configure dotenv and then expand dotenv:

```javascript
const dotenv = require('dotenv')
const dotenvExpand = require('dotenv-expand')

dotenvExpand.expand(dotenv.config())

console.log(process.env) // remove this after you've confirmed it is expanding
```

That's it. `process.env` now has the expanded keys and values you defined in your `.env` file.

```
dotenvExpand.expand(dotenv.config())

...

connectdb(process.env.DB_PASS)
```

### Preload

> Note: Consider using [`dotenvx`](https://github.com/dotenvx/dotenvx) instead of preloading. I am now doing (and recommending) so.
> 
> It serves the same purpose (you do not need to require and load dotenv), has built-in expansion support, adds better debugging, and works with ANY language, framework, or platform. – [motdotla](https://github.com/motdotla)

You can use the `--require` (`-r`) [command line option](https://nodejs.org/api/cli.html#cli_r_require_module) to preload dotenv & dotenv-expand. By doing this, you do not need to require and load dotenv or dotenv-expand in your application code. This is the preferred approach when using `import` instead of `require`.

```bash
$ node -r dotenv-expand/config your_script.js
```

The configuration options below are supported as command line arguments in the format `dotenv_config_<option>=value`

```bash
$ node -r dotenv-expand/config your_script.js dotenv_config_path=/custom/path/to/your/env/vars
```

Additionally, you can use environment variables to set configuration options. Command line arguments will precede these.

```bash
$ DOTENV_CONFIG_<OPTION>=value node -r dotenv-expand/config your_script.js
```

```bash
$ DOTENV_CONFIG_ENCODING=latin1 node -r dotenv-expand/config your_script.js dotenv_config_path=/custom/path/to/.env
```

## Examples

See [tests/.env.test](https://github.com/motdotla/dotenv-expand/blob/master/tests/.env.test) for simple and complex examples of variable expansion in your `.env`
file.

## Documentation

`dotenv-expand` exposes one function:

* expand

### Expand

`expand` will expand your environment variables.

```js
const env = {
  parsed: {
    BASIC: 'basic',
    BASIC_EXPAND: '${BASIC}',
    BASIC_EXPAND_SIMPLE: '$BASIC'
  }
}

console.log(dotenvExpand.expand(env))
```

#### Options

##### processEnv

Default: `process.env`

Specify an object to write your secrets to. Defaults to `process.env` environment variables.

```js
const myEnv = {}
const env = {
  processEnv: myEnv,
  parsed: {
    HELLO: 'World'
  }
}
dotenvExpand.expand(env)

console.log(myEnv.HELLO) // World
console.log(process.env.HELLO) // undefined
```

## FAQ

### What rules does the expansion engine follow?

The expansion engine roughly has the following rules:

* `$KEY` will expand any env with the name `KEY`
* `${KEY}` will expand any env with the name `KEY` 
* `\$KEY` will escape the `$KEY` rather than expand
* `${KEY:-default}` will first attempt to expand any env with the name `KEY`. If not one, then it will return `default`
* `${KEY-default}` will first attempt to expand any env with the name `KEY`. If not one, then it will return `default`

You can see a full list of rules [here](https://dotenvx.com/docs/env-file#interpolation).

### How can I avoid expanding pre-existing envs (already in my `process.env`, for example `pas$word`)?

Modify your `dotenv.config` to write to an empty object and pass that to `dotenvExpand.processEnv`.

```js
const dotenv = require('dotenv')
const dotenvExpand = require('dotenv-expand')

const myEnv = dotenv.config({ processEnv: {} }) // prevent writing to `process.env`

dotenvExpand.expand(myEnv)
```

## Contributing Guide

See [CONTRIBUTING.md](CONTRIBUTING.md)

## CHANGELOG

See [CHANGELOG.md](CHANGELOG.md)

## Who's using dotenv-expand?

[These npm modules depend on it.](https://www.npmjs.com/browse/depended/dotenv-expand)
