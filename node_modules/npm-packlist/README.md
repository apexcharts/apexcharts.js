# npm-packlist

Get a list of the files to add from a folder into an npm package.

These can be handed to [tar](http://npm.im/tar) like so to make an npm
package tarball:

```js
const Arborist = require('@npmcli/arborist')
const packlist = require('npm-packlist')
const tar = require('tar')
const packageDir = '/path/to/package'
const packageTarball = '/path/to/package.tgz'

const arborist = new Arborist({ path: packageDir })
arborist.loadActual().then((tree) => {
  packlist(tree)
    .then(files => tar.create({
      prefix: 'package/',
      cwd: packageDir,
      file: packageTarball,
      gzip: true
    }, files))
    .then(_ => {
      // tarball has been created, continue with your day
    })
  })
```

This uses the following rules:

1. If a `package.json` file is found, and it has a `files` list,
   then ignore everything that isn't in `files`.  Always include the root
   readme, license, licence and copying files, if they exist, as well
   as the package.json file itself. Non-root readme, license, licence and
   copying files are included by default, but can be excluded using the 
   `files` list e.g. `"!readme"`.
2. If there's no `package.json` file (or it has no `files` list), and
   there is a `.npmignore` file, then ignore all the files in the
   `.npmignore` file.
3. If there's no `package.json` with a `files` list, and there's no
   `.npmignore` file, but there is a `.gitignore` file, then ignore
   all the files in the `.gitignore` file.
4. Everything in the root `node_modules` is ignored, unless it's a
   bundled dependency.  If it IS a bundled dependency, and it's a
   symbolic link, then the target of the link is included, not the
   symlink itself.
4. Unless they're explicitly included (by being in a `files` list, or
   a `!negated` rule in a relevant `.npmignore` or `.gitignore`),
   always ignore certain common cruft files:

    1. .npmignore and .gitignore files (their effect is in the package
       already, there's no need to include them in the package)
    2. editor junk like `.*.swp`, `._*` and `.*.orig` files
    3. `.npmrc` files (these may contain private configs)
    4. The `node_modules/.bin` folder
    5. Waf and gyp cruft like `/build/config.gypi` and `.lock-wscript`
    6. Darwin's `.DS_Store` files because wtf are those even
    7. `npm-debug.log` files at the root of a project

    You can explicitly re-include any of these with a `files` list in
    `package.json` or a negated ignore file rule.

Only the `package.json` file in the very root of the project is ever
inspected for a `files` list.  Below the top level of the root package,
`package.json` is treated as just another file, and no package-specific
semantics are applied.

### Interaction between `package.json` and `.npmignore` rules

In previous versions of this library, the `files` list in `package.json`
was used as an initial filter to drive further tree walking. That is no
longer the case as of version 6.0.0.

If you have a `package.json` file with a `files` array within, any top
level `.npmignore` and `.gitignore` files *will be ignored*.

If a _directory_ is listed in `files`, then any rules in nested `.npmignore` files within that directory will be honored.

For example, with this package.json:

```json
{
  "files": [ "dir" ]
}
```

a `.npmignore` file at `dir/.npmignore` (and any subsequent
sub-directories) will be honored.  However, a `.npmignore` at the root
level will be skipped.

Additionally, with this package.json:

```
{
  "files": ["dir/subdir"]
}
```

a `.npmignore` file at `dir/.npmignore` will be honored, as well as `dir/subdir/.npmignore`.

Any specific file matched by an exact filename in the package.json `files` list will be included, and cannot be excluded, by any `.npmignore` files.

## API

Same API as [ignore-walk](http://npm.im/ignore-walk), except providing a `tree` is required and there are hard-coded file list and rule sets.

The `Walker` class requires an [arborist](https://github.com/npm/cli/tree/latest/workspaces/arborist) tree, and if any bundled dependencies are found will include them as well as their own dependencies in the resulting file set.
