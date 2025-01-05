# @npmcli/package-json

[![npm version](https://img.shields.io/npm/v/@npmcli/package-json)](https://www.npmjs.com/package/@npmcli/package-json)
[![Build Status](https://img.shields.io/github/actions/workflow/status/npm/package-json/ci.yml?branch=main)](https://github.com/npm/package-json)

Programmatic API to update `package.json` files. Updates and saves files the
same way the **npm cli** handles them.

## Install

`npm install @npmcli/package-json`

## Usage:

```js
const PackageJson = require('@npmcli/package-json')
const pkgJson = await PackageJson.load(path)
// $ cat package.json
// {
//   "name": "foo",
//   "version": "1.0.0",
//   "dependencies": {
//     "a": "^1.0.0",
//     "abbrev": "^1.1.1"
//   }
// }

pkgJson.update({
  dependencies: {
    a: '^1.0.0',
    b: '^1.2.3',
  },
  workspaces: [
    './new-workspace',
  ],
})

await pkgJson.save()
// $ cat package.json
// {
//   "name": "foo",
//   "version": "1.0.0",
//   "dependencies": {
//     "a": "^1.0.0",
//     "b": "^1.2.3"
//   },
//   "workspaces": [
//     "./new-workspace"
//   ]
// }
```

There is also a helper function exported for opening a package.json file
with no extra normalization or saving functionality.

```js
const { readPackage } = require('@npmcli/package-json/lib/read-package')
const rawData = await readPackage('./package.json')
// rawData will now have the package.json contents with no changes or normalizations
```

## API:

### `constructor()`

Creates a new empty instance of `PackageJson`.

---

### `async PackageJson.create(path)`

Creates an empty `package.json` at the given path. If one already exists
it will be overwritten.

---

### `async PackageJson.load(path, opts = {})`

Loads a `package.json` at the given path.

- `opts`: `Object` can contain:
  - `create`: `Boolean` if true, a new package.json will be created if one does not already exist. Will not clobber ane existing package.json that can not be parsed.

### Example:

Loads contents of a `package.json` file located at `./`:

```js
const PackageJson = require('@npmcli/package-json')
const pkgJson = new PackageJson()
await pkgJson.load('./')
```

Throws an error in case a `package.json` file is missing or has invalid contents.

---

### **static** `async PackageJson.load(path)`

Convenience static method that returns a new instance and loads the contents of a `package.json` file from that location.

- `path`: `String` that points to the folder from where to read the `package.json` from

### Example:

Loads contents of a `package.json` file located at `./`:

```js
const PackageJson = require('@npmcli/package-json')
const pkgJson = await PackageJson.load('./')
```

---

### `async PackageJson.normalize()`

Intended for normalizing package.json files in a node_modules tree.  Some light normalization is done to ensure that it is ready for use in `@npmcli/arborist`

- `path`: `String` that points to the folder from where to read the `package.json` from
- `opts`: `Object` can contain:
  - `strict`: `Boolean` enables optional strict mode when applying the `normalizeData` step
  - `steps`: `Array` optional normalization steps that will be applied to the `package.json` file, replacing the default steps
  - `root`: `Path` optional git root to provide when applying the `gitHead` step
  - `changes`: `Array` if provided, a message about each change that was made to the packument will be added to this array

---

### **static** `async PackageJson.normalize(path, opts = {})`

Convenience static that calls `load` before calling `normalize`

- `path`: `String` that points to the folder from where to read the `package.json` from
- `opts`: `Object` can contain:
  - `strict`: `Boolean` enables optional strict mode when applying the `normalizeData` step
  - `steps`: `Array` optional normalization steps that will be applied to the `package.json` file, replacing the default steps
  - `root`: `Path` optional git root to provide when applying the `gitHead` step
  - `changes`: `Array` if provided, a message about each change that was made to the packument will be added to this array

---

### `async PackageJson.prepare()`

Like `normalize` but intended for preparing package.json files for publish.

---

### **static** `async PackageJson.prepare(path, opts = {})`

Convenience static that calls `load` before calling `prepare`

- `path`: `String` that points to the folder from where to read the `package.json` from
- `opts`: `Object` can contain:
  - `strict`: `Boolean` enables optional strict mode when applying the `normalizeData` step
  - `steps`: `Array` optional normalization steps that will be applied to the `package.json` file, replacing the default steps
  - `root`: `Path` optional git root to provide when applying the `gitHead` step
  - `changes`: `Array` if provided, a message about each change that was made to the packument will be added to this array

---

### `async PackageJson.fix()`

Like `normalize` but intended for the `npm pkg fix` command.

---

### `PackageJson.update(content)`

Updates the contents of a `package.json` with the `content` provided.

- `content`: `Object` containing the properties to be updated/replaced in the
`package.json` file.

Special properties like `dependencies`, `devDependencies`,
`optionalDependencies`, `peerDependencies` will have special logic to handle
the update of these options, such as sorting and deduplication.

### Example:

Adds a new script named `new-script` to your `package.json` `scripts` property:

```js
const PackageJson = require('@npmcli/package-json')
const pkgJson = await PackageJson.load('./')
pkgJson.update({
  scripts: {
    ...pkgJson.content.scripts,
    'new-script': 'echo "Bom dia!"'
  }
})
```

**NOTE:** When working with dependencies, it's important to provide values for
all known dependency types as the update logic has some interdependence in
between these properties.

### Example:

A safe way to add a `devDependency` AND remove all peer dependencies of an
existing `package.json`:

```js
const PackageJson = require('@npmcli/package-json')
const pkgJson = await PackageJson.load('./')
pkgJson.update({
  dependencies: pkgJson.content.dependencies,
  devDependencies: {
    ...pkgJson.content.devDependencies,
    foo: '^foo@1.0.0',
  },
  peerDependencies: {},
  optionalDependencies: pkgJson.content.optionalDependencies,
})
```

---

### **get** `PackageJson.content`

Getter that retrieves the normalized `Object` read from the loaded
`package.json` file.

### Example:

```js
const PackageJson = require('@npmcli/package-json')
const pkgJson = await PackageJson.load('./')
pkgJson.content
// -> {
//   name: 'foo',
//   version: '1.0.0'
// }
```

---

### `async PackageJson.save()`

Saves the current `content` to the same location used when calling
`load()`.

## LICENSE

[ISC](./LICENSE)
