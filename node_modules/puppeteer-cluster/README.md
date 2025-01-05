# Puppeteer Cluster

[![Build Status](https://github.com/thomasdondorf/puppeteer-cluster/actions/workflows/actions.yml/badge.svg)](https://github.com/thomasdondorf/puppeteer-cluster/actions/workflows/actions.yml)
[![npm](https://img.shields.io/npm/v/puppeteer-cluster)](https://www.npmjs.com/package/puppeteer-cluster)
[![npm download count](https://img.shields.io/npm/dm/puppeteer-cluster)](https://www.npmjs.com/package/puppeteer-cluster)
[![Coverage Status](https://coveralls.io/repos/github/thomasdondorf/puppeteer-cluster/badge.svg?branch=master)](https://coveralls.io/github/thomasdondorf/puppeteer-cluster?branch=master)
[![Known Vulnerabilities](https://snyk.io/test/github/thomasdondorf/puppeteer-cluster/badge.svg)](https://snyk.io/test/github/thomasdondorf/puppeteer-cluster)
[![MIT License](https://img.shields.io/npm/l/puppeteer-cluster.svg)](#license)

Create a cluster of puppeteer workers. This library spawns a pool of Chromium instances via [Puppeteer] and helps to keep track of jobs and errors. This is helpful if you want to crawl multiple pages or run tests in parallel. Puppeteer Cluster takes care of reusing Chromium and restarting the browser in case of errors.

- [Installation](#installation)
- [Usage](#usage)
- [Examples](#examples)
- [Concurrency implementations](#concurrency-implementations)
- [Typings for input/output (via TypeScript Generics)](#typings-for-inputoutput-via-typescript-generics)
- [Debugging](#debugging)
- [API](#api)
- [License](#license)

###### What does this library do?

* Handling of crawling errors
* Auto restarts the browser in case of a crash
* Can automatically retry if a job fails
* Different concurrency models to choose from (pages, contexts, browsers)
* Simple to use, small boilerplate
* Progress view and monitoring statistics (see below)

<p align="center">
  <img src="https://i.imgur.com/koGNkBN.gif" height="250">
</p>

## Installation

Install using your favorite package manager:

```sh
npm install --save puppeteer # in case you don't already have it installed 
npm install --save puppeteer-cluster
```

Alternatively, use `yarn`:
```sh
yarn add puppeteer puppeteer-cluster
```

## Usage

The following is a typical example of using puppeteer-cluster. A cluster is created with 2 concurrent workers. Then a task is defined which includes going to the URL and taking a screenshot. We then queue two jobs and wait for the cluster to finish.

```js
const { Cluster } = require('puppeteer-cluster');

(async () => {
  const cluster = await Cluster.launch({
    concurrency: Cluster.CONCURRENCY_CONTEXT,
    maxConcurrency: 2,
  });

  await cluster.task(async ({ page, data: url }) => {
    await page.goto(url);
    const screen = await page.screenshot();
    // Store screenshot, do something else
  });

  cluster.queue('http://www.google.com/');
  cluster.queue('http://www.wikipedia.org/');
  // many more pages

  await cluster.idle();
  await cluster.close();
})();
```

## Examples
* [Simple example](examples/minimal.js)
* [Wait for a task to be executed](examples/execute.js)
* [Minimal screenshot server with express](examples/express-screenshot.js)
* [Deep crawling the Google search results](examples/deep-google-crawler.js)
* [Crawling the Alexa Top 1 Million](examples/alexa-1m.js)
* [Queuing functions (simple)](examples/function-queuing-simple.js)
* [Queuing functions (complex)](examples/function-queuing-complex.js)
* [Error handling](examples/error-handling.js)
* [Using a different puppeteer library (like puppeteer-core or puppeteer-firefox)](examples/different-puppeteer-library.js)
* [Provide types for input/output with TypeScript generics](examples/typings.ts)

## Concurrency implementations

There are different concurrency models, which define how isolated each job is run. You can set it in the `options` when calling [Cluster.launch](#Clusterlaunchoptions). The default option is `Cluster.CONCURRENCY_CONTEXT`, but it is recommended to always specify which one you want to use.

| Concurrency | Description | Shared data |
| --- | --- | --- |
| `CONCURRENCY_PAGE` | One [Page] for each URL | Shares everything (cookies, localStorage, etc.) between jobs. |
| `CONCURRENCY_CONTEXT` | Incognito page (see [BrowserContext](https://github.com/puppeteer/puppeteer/blob/main/docs/api/puppeteer.browser.createbrowsercontext.md#browsercreatebrowsercontext-method)) for each URL  | No shared data. |
| `CONCURRENCY_BROWSER` | One browser (using an incognito page) per URL. If one browser instance crashes for any reason, this will not affect other jobs. | No shared data.  |
| Custom concurrency (**experimental**) | You can create your own concurrency implementation. Copy one of the files of the `concurrency/built-in` directory and implement `ConcurrencyImplementation`. Then provide the class to the option `concurrency`. **This part of the library is currently experimental and might break in the future, even in a minor version upgrade while the version has not reached 1.0.** | Depends on your implementation |

## Typings for input/output (via TypeScript Generics)

To allow proper type checks with TypeScript you can provide generics. In case no types are provided, `any` is assumed for input and output. See the following minimal example or check out the more complex [typings example](examples/typings.ts) for more information.

```ts
  const cluster: Cluster<string, number> = await Cluster.launch(/* ... */);

  await cluster.task(async ({ page, data }) => {
    // TypeScript knows that data is a string and expects this function to return a number
    return 123;
  });

  // Typescript expects a string as argument ...
  cluster.queue('http://...');

  // ... and will return a number when execute is called.
  const result = await cluster.execute('https://www.google.com');
```


## Debugging

Try to checkout the [puppeteer debugging tips](https://github.com/GoogleChrome/puppeteer#debugging-tips) first. Your problem might not be related to `puppeteer-cluster`, but `puppteer` itself. Additionally, you can enable verbose logging to see which data is consumed by which worker and some other cluster information. Set the DEBUG environment variable to `puppeteer-cluster:*`. See an example below or checkout the [debug docs](https://github.com/visionmedia/debug#windows-command-prompt-notes) for more information.

```bash
# Linux
DEBUG='puppeteer-cluster:*' node examples/minimal
# Windows Powershell
$env:DEBUG='puppeteer-cluster:*';node examples/minimal
```

## API

- [class: Cluster](#class-cluster)
  * [Cluster.launch(options)](#clusterlaunchoptions)
  * [cluster.task(taskFunction)](#clustertasktaskfunction)
  * [cluster.queue([data] [, taskFunction])](#clusterqueuedata--taskfunction)
  * [cluster.execute([data] [, taskFunction])](#clusterexecutedata--taskfunction)
  * [cluster.idle()](#clusteridle)
  * [cluster.close()](#clusterclose)

### class: Cluster

Cluster module provides a method to launch a cluster of Chromium instances.

#### event: 'taskerror'
- <[Error]>
- <[string]|[Object]>
- <[boolean]>

Emitted when a queued task ends in an error for some reason. Reasons might be a network error, your code throwing an error, timeout hit, etc. The first argument will the error itself. The second argument is the URL or data of the job (as given to [Cluster.queue]). If retryLimit is set to a value greater than `0`, the cluster will automatically requeue the job and retry it again later. The third argument is a boolean which indicates whether this task will be retried.
In case the task was queued via [Cluster.execute] there will be no event fired.

```js
  cluster.on('taskerror', (err, data, willRetry) => {
      if (willRetry) {
        console.warn(`Encountered an error while crawling ${data}. ${err.message}\nThis job will be retried`);
      } else {
        console.error(`Failed to crawl ${data}: ${err.message}`);
      }
  });
```

#### event: 'queue'
- <\?[Object]>
- <\?[function]>

Emitted when a task is queued via [Cluster.queue] or [Cluster.execute]. The first argument is the object containing the data (if any data is provided). The second argument is the queued function (if any). In case only a function is provided via [Cluster.queue] or [Cluster.execute], the first argument will be undefined. If only data is provided, the second argument will be undefined.

#### Cluster.launch(options)
- `options` <[Object]> Set of configurable options for the cluster. Can have the following fields:
  - `concurrency` <*Cluster.CONCURRENCY_PAGE*|*Cluster.CONCURRENCY_CONTEXT*|*Cluster.CONCURRENCY_BROWSER*|ConcurrencyImplementation> The chosen concurrency model. See [Concurreny models](#concurreny-models) for more information. Defaults to `Cluster.CONCURRENCY_CONTEXT`. Alternatively you can provide a class implementing `ConcurrencyImplementation`.
  - `maxConcurrency` <[number]> Maximal number of parallel workers. Defaults to `1`.
  - `puppeteerOptions` <[Object]> Object passed to [puppeteer.launch]. See puppeteer documentation for more information. Defaults to `{}`.
  - `perBrowserOptions` <[Array]<[Object]>> Object passed to [puppeteer.launch] for each individual browser. If set, `puppeteerOptions` will be ignored. Defaults to `undefined` (meaning that `puppeteerOptions` will be used).
  - `retryLimit` <[number]> How often do you want to retry a job before marking it as failed. Ignored by tasks queued via [Cluster.execute]. Defaults to `0`.
  - `retryDelay` <[number]> How much time should pass at minimum between the job execution and its retry. Ignored by tasks queued via [Cluster.execute]. Defaults to `0`.
  - `sameDomainDelay` <[number]> How much time should pass at minimum between two requests to the same domain. If you use this field, the queued `data` must be your URL or `data` must be an object containing a field called `url`.
  - `skipDuplicateUrls` <[boolean]> If set to `true`, will skip URLs which were already crawled by the cluster. Defaults to `false`. If you use this field, the queued `data` must be your URL or `data` must be an object containing a field called `url`.
  - `timeout` <[number]> Specify a timeout for all tasks. Defaults to `30000` (30 seconds).
  - `monitor` <[boolean]> If set to `true`, will provide a small command line output to provide information about the crawling process. Defaults to `false`.
  - `workerCreationDelay` <[number]> Time between creation of two workers. Set this to a value like `100` (0.1 seconds) in case you want some time to pass before another worker is created. You can use this to prevent a network peak right at the start. Defaults to `0` (no delay).
  - `puppeteer` <[Object]> In case you want to use a different puppeteer library (like [puppeteer-core](https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md#puppeteer-vs-puppeteer-core) or [puppeteer-extra](https://github.com/berstend/puppeteer-extra)), pass the object here. If not set, will default to using puppeteer. When using `puppeteer-core`, make sure to also provide `puppeteerOptions.executablePath`.
- returns: <[Promise]<[Cluster]>>

The method launches a cluster instance.

#### cluster.task(taskFunction)
- `taskFunction` <[function]([string]|[Object], [Page], [Object])> Sets the function, which will be called for each job. The function will be called with an object having the following fields:
  - `page` <[Page]> The page given by puppeteer, which provides methods to interact with a single tab in Chromium.
  - `data` <any> The data of the job you provided to [Cluster.queue].
  - `worker` <[Object]> An object containing information about the worker executing the current job.
    - `id` <[number]> ID of the worker. Worker IDs start at 0.
- returns: <[Promise]>

Specifies a task for the cluster. A task is called for each job you queue via [Cluster.queue]. Alternatively you can directly queue the function that you want to be executed. See [Cluster.queue] for an example.

#### cluster.queue([data] [, taskFunction])
- `data` <any> Data to be queued. This might be your URL (a string) or a more complex object containing data. The data given will be provided to your task function(s). See [examples] for a more complex usage of this argument.
- `taskFunction` <[function]> Function like the one given to [Cluster.task]. If a function is provided, this function will be called (only for this job) instead of the function provided to [Cluster.task]. The function will be called with an object having the following fields:
  - `page` <[Page]> The page given by puppeteer, which provides methods to interact with a single tab in Chromium.
  - `data` <any> The data of the job you provided as first argument to [Cluster.queue]. This might be `undefined` in case you only specified a function.
  - `worker` <[Object]> An object containing information about the worker executing the current job.
    - `id` <[number]> ID of the worker. Worker IDs start at 0.
- returns: <[Promise]>

Puts a URL or data into the queue. Alternatively (or even additionally) you can queue functions. See the examples about function queuing for more information: ([Simple function queuing](examples/function-queuing-simple.js), [complex function queuing](examples/function-queuing-complex.js)).

Be aware that this function only returns a Promise for backward compatibility reasons. This function does not run asynchronously and will immediately return.

#### cluster.execute([data] [, taskFunction])
- `data` <any> Data to be queued. This might be your URL (a string) or a more complex object containing data. The data given will be provided to your task function(s). See [examples] for a more complex usage of this argument.
- `taskFunction` <[function]> Function like the one given to [Cluster.task]. If a function is provided, this function will be called (only for this job) instead of the function provided to [Cluster.task]. The function will be called with an object having the following fields:
  - `page` <[Page]> The page given by puppeteer, which provides methods to interact with a single tab in Chromium.
  - `data` <any> The data of the job you provided as first argument to [Cluster.queue]. This might be `undefined` in case you only specified a function.
  - `worker` <[Object]> An object containing information about the worker executing the current job.
    - `id` <[number]> ID of the worker. Worker IDs start at 0.
- returns: <[Promise]>

Works like [Cluster.queue], but this function returns a Promise which will be resolved after the task is executed. That means, that the job is still queued, but the script will wait for it to be finished. In case an error happens during the execution, this function will reject the Promise with the thrown error. There will be no "taskerror" event fired. In addition, tasks queued via execute will ignore "retryLimit" and "retryDelay". For an example see the [Execute example](examples/execute.js).

#### cluster.idle()
- returns: <[Promise]>

Promise is resolved when the queue becomes empty.

#### cluster.close()
- returns: <[Promise]>

Closes the cluster and all opened Chromium instances including all open pages (if any were opened). It is recommended to run [Cluster.idle](#clusteridle) before calling this function. The [Cluster] object itself is considered to be disposed and cannot be used anymore.

## License

[MIT license](./LICENSE).



[Cluster.queue]: #clusterqueuedata--taskfunction "Cluster.queue"
[Cluster.execute]: #clusterexecutedata--taskfunction "Cluster.execute"
[Cluster.task]: #clustertasktaskfunction "Cluster.task"
[Cluster]: #class-cluster "Cluster"

[Puppeteer]: https://github.com/GoogleChrome/puppeteer "Puppeteer"
[Page]: https://github.com/GoogleChrome/puppeteer/blob/v1.5.0/docs/api.md#class-page "Page"
[puppeteer.launch]: https://github.com/GoogleChrome/puppeteer/blob/v1.5.0/docs/api.md#puppeteerlaunchoptions "puppeteer.launch"

[function]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function "Function"
[string]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#String_type "String"
[number]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#Number_type "Number"
[Promise]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise "Promise"
[boolean]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#Boolean_type "Boolean"
[Object]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object "Object"
[Error]: https://nodejs.org/api/errors.html#errors_class_error "Error"
[Array]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array "Array"
