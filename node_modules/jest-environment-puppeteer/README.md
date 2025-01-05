# jest-environment-puppeteer

[![npm version](https://img.shields.io/npm/v/jest-environment-puppeteer.svg)](https://www.npmjs.com/package/jest-environment-puppeteer)
[![npm dm](https://img.shields.io/npm/dm/jest-environment-puppeteer.svg)](https://www.npmjs.com/package/jest-environment-puppeteer)
[![npm dt](https://img.shields.io/npm/dt/jest-environment-puppeteer.svg)](https://www.npmjs.com/package/jest-environment-puppeteer)

Run your tests using Jest & Puppeteer 🎪✨

```
npm install jest-environment-puppeteer puppeteer
```

## Usage

Update your Jest configuration:

```json
{
  "globalSetup": "jest-environment-puppeteer/setup",
  "globalTeardown": "jest-environment-puppeteer/teardown",
  "testEnvironment": "jest-environment-puppeteer"
}
```

Use Puppeteer in your tests:

```js
describe("Google", () => {
  beforeAll(async () => {
    await page.goto("https://google.com");
  });

  it('should display "google" text on page', async () => {
    const text = await page.evaluate(() => document.body.textContent);
    expect(text).toContain("google");
  });
});
```

## API

### `global.browser`

Give access to the [Puppeteer Browser](https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md#class-browser).

```js
it("should open a new page", async () => {
  const page = await browser.newPage();
  await page.goto("https://google.com");
});
```

### `global.page`

Give access to a [Puppeteer Page](https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md#class-page) opened at start (you will use it most of time).

```js
it("should fill an input", async () => {
  await page.type("#myinput", "Hello");
});
```

### `global.context`

Give access to a [browser context](https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md#class-browsercontext) that is instantiated when the browser is launched. You can control whether each test has its own isolated browser context using the `browserContext` option in config.

### `global.jestPuppeteer.debug()`

Put test in debug mode.

- Jest is suspended (no timeout)
- A `debugger` instruction to Chromium, if Puppeteer has been launched with `{ devtools: true }` it will stop

```js
it("should put test in debug mode", async () => {
  await jestPuppeteer.debug();
});
```

### `global.jestPuppeteer.resetPage()`

Reset global.page

```js
beforeEach(async () => {
  await jestPuppeteer.resetPage();
});
```

### `global.jestPuppeteer.resetBrowser()`

Reset global.browser, global.context, and global.page

```js
beforeEach(async () => {
  await jestPuppeteer.resetBrowser();
});
```

### Config

Jest Puppeteer uses [cosmiconfig](https://github.com/davidtheclark/cosmiconfig) for configuration file support. This means you can configure Jest Puppeteer via (in order of precedence):

- A `"jest-puppeteer"` key in your `package.json` file.
- A `.jest-puppeteerrc` file written in JSON or YAML.
- A `.jest-puppeteerrc.json`, `.jest-puppeteerrc.yml`, `.jest-puppeteerrc.yaml`, or `.jest-puppeteerrc.json5` file.
- A `.jest-puppeteerrc.js`, `.jest-puppeteerrc.cjs`, `jest-puppeteer.config.js`, or `jest-puppeteer.config.cjs` file that exports an object using `module.exports`.
- A `.jest-puppeteerrc.toml` file.

By default it looks for config at the root of the project. You can define a custom path using `JEST_PUPPETEER_CONFIG` environment variable.

It should export a config object or a Promise that returns a config object.

```ts
interface JestPuppeteerConfig {
  /**
   * Puppeteer connect options.
   * @see https://pptr.dev/api/puppeteer.connectoptions
   */
  connect?: ConnectOptions;
  /**
   * Puppeteer launch options.
   * @see https://pptr.dev/api/puppeteer.launchoptions
   */
  launch?: PuppeteerLaunchOptions;
  /**
   * Server config for `jest-dev-server`.
   * @see https://www.npmjs.com/package/jest-dev-server
   */
  server?: JestDevServerConfig | JestDevServerConfig[];
  /**
   * Allow to run one browser per worker.
   * @default false
   */
  browserPerWorker?: boolean;
  /**
   * Browser context to use.
   * @default "default"
   */
  browserContext?: "default" | "incognito";
  /**
   * Exit on page error.
   * @default true
   */
  exitOnPageError?: boolean;
  /**
   * Use `runBeforeUnload` in `page.close`.
   * @see https://pptr.dev/api/puppeteer.page.close
   * @default false
   */
  runBeforeUnloadOnClose?: boolean;
}
```

#### Sync config

```js
// jest-puppeteer.config.cjs

/** @type {import('jest-environment-puppeteer').JestPuppeteerConfig} */
module.exports = {
  launch: {
    dumpio: true,
    headless: process.env.HEADLESS !== "false",
  },
  server: {
    command: "node server.js",
    port: 4444,
    launchTimeout: 10000,
    debug: true,
  },
};
```

#### Async config

This example uses an already running instance of Chrome by passing the active web socket endpoint to `connect`. This is useful, for example, when you want to connect to Chrome running in the cloud.

```js
// jest-puppeteer.config.cjs
const dockerHost = "http://localhost:9222";

async function getConfig() {
  const data = await fetch(`${dockerHost}/json/version`).json();
  const browserWSEndpoint = data.webSocketDebuggerUrl;
  /** @type {import('jest-environment-puppeteer').JestPuppeteerConfig} */
  return {
    connect: {
      browserWSEndpoint,
    },
    server: {
      command: "node server.js",
      port: 3000,
      launchTimeout: 10000,
      debug: true,
    },
  };
}

module.exports = getConfig();
```

## Create custom environment

It is possible to create a custom environment from the Jest Puppeteer's one. It is not different from creating a custom environment from "jest-environment-node". See [Jest `testEnvironment` documentation](https://jestjs.io/docs/configuration#testenvironment-string) to learn more about it.

```js
// my-custom-environment
const JestPuppeteerEnvironment =
  require("jest-environment-puppeteer").TestEnvironment;

class CustomEnvironment extends JestPuppeteerEnvironment {
  // Implement your own environment
}
```

## Inspiration

Thanks to Fumihiro Xue for his great [Jest example](https://github.com/xfumihiro/jest-puppeteer-example).
