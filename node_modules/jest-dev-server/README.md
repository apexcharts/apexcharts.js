# jest-dev-server

[![npm version](https://img.shields.io/npm/v/jest-dev-server.svg)](https://www.npmjs.com/package/jest-dev-server)
[![npm dm](https://img.shields.io/npm/dm/jest-dev-server.svg)](https://www.npmjs.com/package/jest-dev-server)
[![npm dt](https://img.shields.io/npm/dt/jest-dev-server.svg)](https://www.npmjs.com/package/jest-dev-server)

Starts a server before your Jest tests and tears it down after.

## Why

`jest-puppeteer` works great for running tests in Jest using Puppeteer.
It's also useful for starting a local development server during the tests without letting Jest hang.
This package extracts just the local development server spawning without any ties to Puppeteer.

## Install

```bash
npm install --save-dev jest-dev-server
```

## Usage

`jest-dev-server` exports `setup` and `teardown` functions.

```js
// global-setup.js
const { setup: setupDevServer } = require("jest-dev-server");

module.exports = async function globalSetup() {
  globalThis.servers = await setupDevServer({
    command: `node config/start.js --port=3000`,
    launchTimeout: 50000,
    port: 3000,
  });
  // Your global setup
};
```

```js
// global-teardown.js
const { teardown: teardownDevServer } = require("jest-dev-server");

module.exports = async function globalTeardown() {
  await teardownDevServer(globalThis.servers);
  // Your global teardown
};
```

### Specify several servers

You can specify several servers using an array of configs:

```js
// global-setup.js
const { setup: setupDevServer } = require("jest-dev-server");

module.exports = async function globalSetup() {
  globalThis.servers = await setupDevServer([
    {
      command: "node server.js",
      port: 4444,
    },
    {
      command: "node server2.js",
      port: 4445,
    },
  ]);
  // Your global setup
};
```

## Options

### `command`

Type: `string`, required.

Command to execute to start the port.
Directly passed to [`spawnd`](https://www.npmjs.com/package/spawnd).

```js
const options = {
  command: "npm run start",
};
```

### `debug`

Type: `boolean`, default to `false`.

Log server output, useful if server is crashing at start.

```js
const options = {
  command: "npm run start",
  debug: true,
};
```

### `launchTimeout`

Type: `number`, default to `5000`.

How many milliseconds to wait for the spawned server to be available before giving up.
Defaults to [`wait-port`](https://www.npmjs.com/package/wait-port)'s default.

```js
const options = {
  command: "npm run start",
  launchTimeout: 30000,
};
```

---

Following options are linked to [`spawnd`](https://www.npmjs.com/package/spawnd).

### `host`

Type: `string`, if not specified it will used Node.js default port.

Host to wait for activity on before considering the server running.
Must be used in conjunction with `port`.

```js
const options = {
  command: "npm run start --port 3000",
  host: "customhost.com",
  port: 3000,
};
```

### `path`

Type: `string`, default to `null`.

Path to resource to wait for activity on before considering the server running.
Must be used in conjunction with `host` and `port`.

```js
const options = {
  command: "npm run start --port 3000",
  host: "customhost.com",
  port: 3000,
  path: "thing",
};
```

### `protocol`

Type: `string`, (`https`, `http`, `tcp`, `socket`) default to `tcp`.

To wait for an HTTP or TCP endpoint before considering the server running, include `http` or `tcp` as a protocol.
Must be used in conjunction with `port`.

```js
const options = {
  command: "npm run start --port 3000",
  protocol: "http",
  port: 3000,
};
```

### `port`

Type: `number`, default to `null`.

Port to wait for activity on before considering the server running.
If not provided, the server is assumed to immediately be running.

```js
const options = {
  command: "npm run start --port 3000",
  port: 3000,
};
```

### `usedPortAction`

Type: `string` (`ask`, `error`, `ignore`, `kill`) default to `ask`.

It defines the action to take if port is already used:

- `ask`: a prompt is shown to decide if you want to kill the process or not
- `error`: an errow is thrown
- `ignore`: your test are executed, we assume that the server is already started
- `kill`: the process is automatically killed without a prompt

```js
const options = {
  command: "npm run start --port 3000",
  port: 3000,
  usedPortAction: "kill",
};
```

### `waitOnScheme`

`jest-dev-server` use the [`wait-on`](https://www.npmjs.com/package/wait-on) npm package to wait for resources to become available before calling callback.

Type: `object`, default to `{}`.

- `delay`: optional initial delay in ms, default 0
- `interval`: optional poll resource interval in ms, default 250ms
- `log`: optional flag which outputs to stdout, remaining resources waited on and when complete or errored
- `reverse`: optional flag to reverse operation so checks are for resources being NOT available, default false
- `timeout`: optional timeout in ms, default Infinity. Aborts with error
- `tcpTimeout`: optional tcp timeout in ms, default 300ms
- `verbose`: optional flag which outputs debug output, default false
- `window`: optional stabilization time in ms, default 750ms. Waits this amount of time for file sizes to stabilize or other resource availability to remain unchanged

**Note:** http(s) specific options, see https://github.com/request/request#readme for specific details

```js
const options = {
  command: "npm run start --port 3000",
  port: 3000,
  usedPortAction: "kill",
  waitOnScheme: {
    delay: 1000,
  },
};
```

## Troubleshooting

- If using `port` makes the terminal to ask for root password although the port is valid and accessible then use `usePortAction: 'ignore'`.
