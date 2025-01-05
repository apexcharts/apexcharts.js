# @sigstore/tuf &middot; [![npm version](https://img.shields.io/npm/v/@sigstore/tuf.svg?style=flat)](https://www.npmjs.com/package/@sigstore/tuf) [![CI Status](https://github.com/sigstore/sigstore-js/workflows/CI/badge.svg)](https://github.com/sigstore/sigstore-js/actions/workflows/ci.yml) [![Smoke Test Status](https://github.com/sigstore/sigstore-js/workflows/smoke-test/badge.svg)](https://github.com/sigstore/sigstore-js/actions/workflows/smoke-test.yml)

A JavaScript library for securely retrieving targets from the Sigstore [TUF][1]
repository.

## Features

- Embeds the trutsted root metadata file necessary to bootstrap interaction
  with the Sigstore TUF repository.
- Automatically initializes the local TUF cache for storing metadata and
  target files.

## Prerequisites

- Node.js version >= 16.14.0

## Installation

```
npm install @sigstore/tuf
```

## Usage

```javascript
const { initTUF } = require('@sigstore/tuf');
```

```javascript
import { initTUF } from '@sigstore/tuf';
```

### initTUF([options])

Returns a TUF client which can be used to retrieve any target from the Sigstore
TUF repository. The local TUF cache will be initialized and the TUF metadata
files downloaded from the [remote repository][2] as part of the initialization
process.

- `options` `<Object>`
  - `mirrorURL` `<string>`: Base URL for the Sigstore TUF repository. Defaults to `'https://tuf-repo-cdn.sigstore.dev'`
  - `cachePath` `<string>`: Absolute path to the directory to be used for caching downloaded TUF metadata and targets. Defaults to a directory named "sigstore-js" within the platform-specific application data directory.
  - `rootPath` `<string>`: Path to the initial trust root for the TUF repository. Defaults to the [embedded root](./store/public-good-instance-root.json).
  - `forceInit` `boolean`: Force re-initialization of the TUF cache even if it already exists. Defaults to `false`.
  - `forceCache` `boolean`: Prevents any downloads from the remote TUF repository as long as all cached metadata files are un-expired. Defaults to `false`.
  - `force` `boolean`: Same as `forceInit` (deprecated).

The `TUF` client object returned from `initTUF` has a single `getTarget`
function which takes the name of a target in the Sigstore TUF repository
and returns the content of that target.

### getTrustedRoot([options])

Retrieves the most recent version of the "trusted_root.json" target from the
Sigstore TUF repository. The format of "trusted_root.json" file is described
by the [TrustedRoot][3] protobuf and contains the complete set of trusted
verification materials for the Sigstore public-good instance.

- `options` `<Object>`
  - `mirrorURL` `<string>`: Base URL for the Sigstore TUF repository. Defaults to `'https://tuf-repo-cdn.sigstore.dev'`
  - `cachePath` `<string>`: Absolute path to the directory to be used for caching downloaded TUF metadata and targets. Defaults to a directory named "sigstore-js" within the platform-specific application data directory.
  - `rootPath` `<string>`: Path to the initial trust root for the TUF repository. Defaults to the [embedded root](./store/public-good-instance-root.json).
  - `forceInit` `boolean`: Force re-initialization of the TUF cache even if it already exists. Defaults to `false`.
  - `forceCache` `boolean`: Prevents any downloads from the remote TUF repository as long as all cached metadata files are un-expired. Defaults to `false`.
  - `force` `boolean`: Same as `forceInit` (deprecated).

[1]: https://theupdateframework.io/
[2]: https://sigstore-tuf-root.storage.googleapis.com/
[3]: https://github.com/sigstore/protobuf-specs/blob/main/protos/sigstore_trustroot.proto
