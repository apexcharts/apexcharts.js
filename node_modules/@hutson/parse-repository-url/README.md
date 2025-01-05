# @hutson/parse-repository-url

> Parse repository URLs to extract, SCM platform, domain, user, and project information.

Occasionally you need to take a Git repository URL, such as `https://gitlab.com/gitlab-org/gitlab-ce` and extract the user/group and project name from the URL for use in other tools and processes.

`@hutson/parse-repository-url` helps to extract that information from many valid Git URLs strings that you might encounter, including for platforms like GitLab, GitHub, and their various use cases, such as hosted, on-premise, and multiple sub-groups.

## Table of Contents
<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->


- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
- [Debugging](#debugging)
- [Node Support Policy](#node-support-policy)
- [Contributing](#contributing)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Features

* [x] Return `browse` function that returns URL usable in a browser. (Similar to [`hosted-git-info`](https://github.com/npm/hosted-git-info/blob/5d2cc4a8c93012387a86a0afa1384ccf7ac31084/README.md#methods))
* [x] Return `domain` property containing the fully qualified domain name and port.
* [x] Return `project` property.
* [x] Return `type` property indicating the SCM host, such as `github` or `gitlab`.
* [x] Return `user` property.

> **Note:* Returns `null` for any property where the information could not be extracted from the repository URL.

## Installation

To install the `@hutson/parse-repository-url` tool for use in your project's publish process please run the following command:

```bash
yarn add [--dev] @hutson/parse-repository-url
```

## Usage

```javascript
const parseRepositoryURL = require(`@hutson/parse-github-repository`);

// {domain: `gitlab.com`, project: `parse-repository-url`, type: `gitlab`, user: `hyper-expanse/open-source`}
parseRepositoryURL(`https://gitlab.com/hyper-expanse/open-source/parse-repository-url`);

// {domain: `git.example.com`, project: `parse-repository-url`, type: null, user: `hyper-expanse/open-source`}
parseRepositoryURL(`https://git.example.com/hyper-expanse/open-source/parse-repository-url`);

// {domain: `gitlab.com`, project: `parse-repository-url`, type: `gitlab`, user: `hyper-expanse/open-source`}
const repository = parseRepositoryURL(`git@gitlab.com/hyper-expanse/open-source/parse-repository-url`);
repository.browse(); // https://gitlab.com/hyper-expanse/open-source/parse-repository-url

// {domain: `github.com`, project: `project`, type: `github`, user: `user`}
parseRepositoryURL(`https://github.com/user/project`);

// {domain: `git.example.com`, project: `project`, type: null, user: `user`}
parseRepositoryURL(`https://git.example.com/user/project`);

// {domain: `github.com`, project: `project`, type: `github`, user: `user`}
parseRepositoryURL(`git@github.com/user/project`);

// {domain: `somewhere`, project: null, type: null, user: null}
parseRepositoryURL(`https://somewhere`);
```

Check out the `index.spec.js` file under the `src/` directory for a full list of URLs that can be parsed for GitLab, GitHub, including hosted, on-premise, and multiple sub-groups.

## Debugging

To assist users of `@hutson/parse-repository-url` with debugging the behavior of this module we use the [debug](https://www.npmjs.com/package/debug) utility package to print information about the publish process to the console. To enable debug message printing, the environment variable `DEBUG`, which is the variable used by the `debug` package, must be set to a value configured by the package containing the debug messages to be printed.

To print debug messages on a unix system set the environment variable `DEBUG` with the name of this package prior to executing `@hutson/parse-repository-url`:

```bash
DEBUG=@hutson/parse-repository-url [CONSUMING TOOL]
```

On the Windows command line you may do:

```bash
set DEBUG=@hutson/parse-repository-url
[CONSUMING TOOL]
```

## Node Support Policy

We only support [Long-Term Support](https://github.com/nodejs/LTS) versions of Node.

We specifically limit our support to LTS versions of Node, not because this package won't work on other versions, but because we have a limited amount of time, and supporting LTS offers the greatest return on that investment.

It's possible this package will work correctly on newer versions of Node. It may even be possible to use this package on older versions of Node, though that's more unlikely as we'll make every effort to take advantage of features available in the oldest LTS version we support.

As each Node LTS version reaches its end-of-life we will remove that version from the `node` `engines` property of our package's `package.json` file. Removing a Node version is considered a breaking change and will entail the publishing of a new major version of this package. We will not accept any requests to support an end-of-life version of Node. Any merge requests or issues supporting an end-of-life version of Node will be closed.

We will accept code that allows this package to run on newer, non-LTS, versions of Node. Furthermore, we will attempt to ensure our own changes work on the latest version of Node. To help in that commitment, our continuous integration setup runs against all LTS versions of Node in addition the most recent Node release; called _current_.

JavaScript package managers should allow you to install this package with any version of Node, with, at most, a warning if your version of Node does not fall within the range specified by our `node` `engines` property. If you encounter issues installing this package, please report the issue to your package manager.

## Contributing

Please read our [contributing guide](https://gitlab.com/hyper-expanse/open-source/parse-repository-url/blob/master/CONTRIBUTING.md) to see how you may contribute to this project.
