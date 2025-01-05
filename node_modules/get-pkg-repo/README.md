# get-pkg-repo

> Get repository SCM platform, domain, user, and project information from package.json file contents.

Extracts information from the `repository` field contained in the content of a `package.json` file using [`@hutson/parse-repository-url`](https://www.npmjs.com/package/@hutson/parse-repository-url) and [`hosted-git-info`](https://www.npmjs.com/package/hosted-git-info).

## Table of Contents
<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
- [API](#api)
  - [pkgData](#pkgdata)
  - [fixTypo](#fixtypo)
- [CLI](#cli)
- [License](#license)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Features

* [x] Return `browse` function that returns URL usable in a browser. (Similar to [`hosted-git-info`](https://github.com/npm/hosted-git-info/blob/5d2cc4a8c93012387a86a0afa1384ccf7ac31084/README.md#methods))
* [x] Return `domain` property containing the fully qualified domain name and port.
* [x] Return `project` property.
* [x] Return `type` property indicating the SCM host, such as `github` or `gitlab`.
* [x] Return `user` property.

> **Note:* Returns `null` for any property where the information could not be extracted from the repository URL.

## Installation

To install the `get-pkg-repo` tool please run the following command:

```bash
yarn [global] add [--dev] get-pkg-repo
```

## Usage

There are two ways to use `get-pkg-repo`, either as a CLI tool, or programmatically.

**Programmatically**

Package data must be passed as an object to `get-pkg-repo` function. If the contents of the `package.json` are a string, please pass it through `JSON.parse` first.

```javascript
const getPkgRepo = require(`get-pkg-repo`);

/* Assume the `package.json` file contains the following:
{
  "repository": {
    "url": `https://github.com/conventional-changelog/get-pkg-repo`
  }
}
*/
fs.readFile(`package.json`, (err, packageData) => {
  if (err) {
    ...
  }

  // {domain: `github.com`, project: `get-pkg-repo`, type: `github`, user: `conventional-changelog`}
  const repository = getPkgRepo(JSON.parse(packageData));

  repository.browse(); // https://github.com/conventional-changelog/get-pkg-repo
});
```

**CLI Tool**

After you've installed `get-pkg-repo`, you can call the tool based on whether you installed it globally or locally:

_Globally_
```bash
get-pkg-repo package.json
```

_Locally_
```bash
$(yarn bin)/get-pkg-repo package.json
```

```bash
$ get-pkg-repo package.json

{
  domain: `github.com`,
  project: `get-pkg-repo`,
  type: `github`,
  user: `conventional-changelog`
}
```

The contents of the `package.json` can also be piped to `get-pkg-repo`:

```
$ cat package.json | get-pkg-repo

{
  domain: `github.com`,
  project: `get-pkg-repo`,
  type: `github`,
  user: `conventional-changelog`
}
```

## Debugging

To assist users of `get-pkg-repo` with debugging the behavior of this module we use the [debug](https://www.npmjs.com/package/debug) utility package to print information about the publish process to the console. To enable debug message printing, the environment variable `DEBUG`, which is the variable used by the `debug` package, must be set to a value configured by the package containing the debug messages to be printed.

To print debug messages on a unix system set the environment variable `DEBUG` with the name of this package prior to executing `get-pkg-repo`:

```bash
DEBUG=get-pkg-repo get-pkg-repo
```

On the Windows command line you may do:

```bash
set DEBUG=get-pkg-repo
get-pkg-repo
```

## Node Support Policy

We only support [Long-Term Support](https://github.com/nodejs/LTS) versions of Node.

We specifically limit our support to LTS versions of Node, not because this package won't work on other versions, but because we have a limited amount of time, and supporting LTS offers the greatest return on that investment.

It's possible this package will work correctly on newer versions of Node. It may even be possible to use this package on older versions of Node, though that's more unlikely as we'll make every effort to take advantage of features available in the oldest LTS version we support.

As each Node LTS version reaches its end-of-life we will remove that version from the `node` `engines` property of our package's `package.json` file. Removing a Node version is considered a breaking change and will entail the publishing of a new major version of this package. We will not accept any requests to support an end-of-life version of Node. Any merge requests or issues supporting an end-of-life version of Node will be closed.

We will accept code that allows this package to run on newer, non-LTS, versions of Node. Furthermore, we will attempt to ensure our own changes work on the latest version of Node. To help in that commitment, our continuous integration setup runs against all LTS versions of Node in addition the most recent Node release; called _current_.

JavaScript package managers should allow you to install this package with any version of Node, with, at most, a warning if your version of Node does not fall within the range specified by our `node` `engines` property. If you encounter issues installing this package, please report the issue to your package manager.

## Contributing

Please read our [contributing](https://github.com/conventional-changelog/get-pkg-repo/blob/master/CONTRIBUTING.md) guide on how you can help improve this project.
