# plugin-enterprise-rest.js

> Octokit plugin for GitHub Enterprise REST APIs

[![@latest](https://img.shields.io/npm/v/@octokit/plugin-enterprise-rest.svg)](https://www.npmjs.com/package/@octokit/plugin-enterprise-rest)
![Build Status](https://github.com/octokit/plugin-enterprise-rest.js/workflows/Test/badge.svg)
[![Greenkeeper badge](https://badges.greenkeeper.io/octokit/plugin-enterprise-rest.js.svg)](https://greenkeeper.io/)

`@octokit/rest` does not include methods for Enterprise Administration as they are not usable against https://api.github.com. This plugin adds these endpoints based on the GitHub Enterprise version you need.

## Usage

```js
const Octokit = require("@octokit/rest").plugin(
  require("@octokit/plugin-enterprise-rest/ghe-2.18")
);
const octokit = new Octokit({
  baseUrl: "https://github.acme-inc.com/api/v3"
});

octokit.enterpriseAdmin.promoteOrdinaryUserToSiteAdministrator({
  username: "octocat"
});
```

There can be differences in REST API between `api.github.com` and the different GitHub Enterprise versions. Some of the endpoint methods from `@octokit/rest` might not work. For these cases you can load the endpoint methods for all scopes for a certain GitHub Enterprise version, not only the `.enterprise` scope. This will override existing endpoint methods.

```js
const Octokit = require("@octokit/rest").plugin(
  require("@octokit/plugin-enterprise-rest/ghe-2.18/all")
);
const octokit = new Octokit({
  baseUrl: "https://github.acme-inc.com/api/v3"
});

octokit.issues.addLabels({
  owner,
  repo,
  number,
  labels: ["foo", "bar"]
});
// now sends `["foo", "bar"]` in the request body, instead of `{"labels": ["foo", "bar"]}`
```

## API docs

See the `README.md` files in the `ghe-*` folders for a list of available endpoint methods for the respective GitHub Enterprise version.

## How it works

The route definitions for the currently supported GitHub Enterprise versions are build automatically from [`@octokit/routes`](https://github.com/octokit/routes). Each time there is a new `@octokit/routes` release, [Greenkeeper](https://greenkeeper.io/) will send a pull request which updates the dependency in `package.json` and `package-lock.json`. That kicks of a build on Travis CI where the `greenkeeper-routes-update` script is run. If there is a change, the script updates the `*.json` definition files in the pull request.

## LICENSE

[MIT](LICENSE)
