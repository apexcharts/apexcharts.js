# npm-install-checks

Check the engines and platform fields in package.json

## API

Both functions will throw an error if the check fails, or return
`undefined` if everything is ok.

Errors have a `required` and `current` fields.

### .checkEngine(pkg, npmVer, nodeVer, force = false)

Check if a package's `engines.node` and `engines.npm` match the running system.

`force` argument will override the node version check, but not the npm
version check, as this typically would indicate that the current version of
npm is unable to install the package properly for some reason.

Error code: 'EBADENGINE'

### .checkPlatform(pkg, force, environment)

Check if a package's `os`, `cpu` and `libc` match the running system.

`force` argument skips all checks.

`environment` overrides the execution environment which comes from `process.platform` `process.arch` and current `libc` environment by default. `environment.os` `environment.cpu` and `environment.libc` are available.

Error code: 'EBADPLATFORM'
