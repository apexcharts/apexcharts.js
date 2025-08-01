# Contributing

To contribute to `apexcharts.js`, fork the repository and clone it to your machine. [See this GitHub help page for what forking and cloning means](https://help.github.com/articles/fork-a-repo/)

## Setup packages

Install this package's dependencies with `npm`:

```sh
npm install
```

## Build

Run the following to build this library and watch its source files for changes:

```sh
npm run dev
```

You will now have a fully functioning local build of this library ready to be used. **Leave the `start` script running**, and continue with a new Terminal/shell window.

## Work on a fix or feature

To work on a fix or feature and to preview changes in source code, use samples included, or start a new project with modified Apexcharts as a dependency.

### View included samples

There are many samples included which can be used as a quick start when working on contributions. Start an HTTP server to view them.

```bash
cd apexcharts.js
npx browser-sync start --server --files "." --directory --startPath "/samples"
```

#### Test Content Security Policy (CSP) related features

To test Content Security Policy (CSP) related features, you should use a specific configuration file. Run `browser-sync` with the `--config` flag:

```bash
npx browser-sync start --config browser-sync-config.js
```

This command uses the `browser-sync-config.js` file to set up the necessary `Content-Security-Policy` headers. Here is the content of the configuration file:

`browser-sync-config.js`

```js
const TEST_NONCE =
  '47ebaa88ef82ffb86e4ccb0eab1c5ec6bd76767642358e8cf99487673d5904b5'

const cspPolicies = [`style-src 'self' 'nonce-${TEST_NONCE}'`]

module.exports = {
  server: {
    baseDir: '.',
    directory: true,
  },
  files: ['.'],
  startPath: '/samples',
  middleware: [
    function (req, res, next) {
      res.setHeader('Content-Security-Policy', cspPolicies.join('; '))
      next()
    },
  ],
}
```

And start working on a feature or fix. Changes in source code should be immediately visible in the browser due to automatic reload on changes.

### Start a dependent new project

Mark the Apexcharts folder under modifications so that npm can use it in new projects. This step is needed only once ever.

```bash
cd apexcharts.js
npm link
```

Start a build with a slightly different command than mentioned before and leave the terminal running.

```bash
npm run dev:cjs
```

In a new terminal window, create a new project outside of the Apexcharts folder.

```bash
mkdir ~/new-project && cd ~/new-project &&
npm init -y
```

Add the previously marked Apexchart folder under modification as a npm dependency to the new project. This step has to be repeated after every `npm i` run in the new project.

```bash
npm link apexcharts
```

Write a basic Apexchart use scenario.

index.html

```html
<div id="chart"></div>
<script type="module" src="./main.js"></script>
```

main.js

```js
import ApexCharts from 'apexcharts'

const options = {
  chart: { type: 'line' },
  series: [
    {
      name: 'sales',
      data: [30, 40, 45, 50, 49, 60, 70, 91, 125],
    },
  ],
  xaxis: { categories: [1991, 1992, 1993, 1994, 1995, 1996, 1997, 1998, 1999] },
}
const chart = new ApexCharts(document.querySelector('#chart'), options)
chart.render()
```

Finally, run bundler and HTTP server, which will auto-reload on changes in the new project and Apexcharts source code. Leave the terminal open with this command.

```bash
npx parcel serve index.html
```

And visit http://localhost:1234

## Tests

Apexcharts comes with unit tests and integration tests. Integration tests are based on viewing sample projects in a test browser, taking screenshots, and comparing them with previously captured screenshots to detect differences. To run them all, use:

```bash
npm run test
```

If this command ends with an error `Error: Unable to launch browser, error message: Chromium revision is not downloaded.` then calling puppeteer install may solve the problem:

```bash
node node_modules/puppeteer/install.mjs
```

E2e tests will likely fail due to minor differences in OS and the browser version used to take screenshots. To address this, before working on a feature, recapture screenshots using this command:

```bash
npm run e2e:update
```

This way, when later working on a feature or fix, `npm run test` command will detect only screenshots affected by changes done. Please avoid sending locally generated screenshots in PR, by excluding `tests/e2e/snapshots` folder from commit.

## Send your changes back to us! :revolving_hearts:

We'd love for you to contribute your changes back to `apexcharts.js`! To do that, it would be great if you could commit your changes to a separate feature branch and open a Pull Request for those changes.

Point your feature branch to use the `main`
