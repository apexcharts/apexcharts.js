# init-package-json

A node module to get your node module started.

## Usage

```javascript
const init = require('init-package-json')
const path = require('path')

// a path to a promzard module.  In the event that this file is
// not found, one will be provided for you.
const initFile = path.resolve(process.env.HOME, '.npm-init')

// the dir where we're doin stuff.
const dir = process.cwd()

// extra stuff that gets put into the PromZard module's context.
// In npm, this is the resolved config object.  Exposed as 'config'
// Optional.
const configData = { some: 'extra stuff' }

// Any existing stuff from the package.json file is also exposed in the
// PromZard module as the `package` object.  There will also be three
// vars for:
// * `filename` path to the package.json file
// * `basename` the tip of the package dir
// * `dirname` the parent of the package dir

const data = await init(dir, initFile, configData)
// the data's already been written to {dir}/package.json
// now you can do stuff with it
```

See [PromZard](https://github.com/npm/promzard) for details about
what can go in the config file.
