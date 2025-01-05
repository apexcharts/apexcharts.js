# proggy

Progress bar updates at a distance

A decoupled progress bar connector component that lets you emit events on
the process object to provide progress updates from various parts of a
program.

## USAGE

Somewhere in your program, you have a thing that is performing actions that
take a while.

In there, you will emit `progress` events on the global `process` object
using Proggy.

```js
const proggy = require('proggy')
const doSomething = async (listOfItems) => {
  // This name should be unique within your program.
  // Proggy will do its best to make sure that you don't create the same
  // tracker more than once by throwing if you give it a name it's already
  // seen, but if there are multiple instances of Proggy, it won't be able
  // to guarantee it.
  const tracker = proggy.createTracker('doing something')
  let i = 0
  for (const item of listOfItems) {
    tracker.update(i++, listOfItems.length)
    const result = await doSomething(item)

    // changing the length is allowed!  The progress bar will never go
    // backwards, but it will slow down if the total increases.
    if (result.more)
      listOfItems.push(result.more)
  }
  // can either explicitly end, or let it implicitly end when the value
  // is >= the total.
  tracker.end()
}
```

Proggy is not a UI component.  It is a way to decouple the UI of a progress
bar from the thing that is making the actual progress.

In another part of your program, where you are handling showing stuff to
the user, you can display this information using any of the wonderful
progress bar UI modules available on npm.

```js
const proggy = require('proggy')

// Create a client that can consume the events emitted elsewhere
const client = proggy.createClient()
```

If you set the `normalize: true` flag, then the client will normalize how
far it thinks the progress should have gone, in order to prevent backwards
motion if the length increases along the way.  If using this, then the
`total` value will always be set to 100, and the `increment` value will
always be some number smaller than 100.  Use the `actualValue` and
`actualTotal` fields to identify how many things have actually been done.

For example, using
[`cli-progress`](https://www.npmjs.com/package/cli-progress):

```js
// set up our display thingmajig
const cliProgress = require('cli-progress')
const multibar = new cliProgress.MultiBar({
  clearOnComplete: true,
  hideCursor: true,
  // note that data.actualValue and data.actualTotal will reflect the real
  // done/remaining values.  data.value will always be less than 100, and
  // data.total will always be 100, so we never show reverse motion.
  format: '[{bar}] {percentage}% | {name} {actualValue}/{actualTotal} {duration_formatted}',
  barCompleteChar: '\u2588',
  barIncompleteChar: '\u2591',
}, cliProgress.Presets.shades_grey)

// update it with events from the proggy client
const client = proggy.createClient({
  // don't show reverse progress
  // this is false by default
  normalize: true,
})
const bars = {}
// new bar is created, tell multibar about it
client.on('bar', (key, data) => {
  bars[key] = multibar.create(data.total)
})
// got some progress for a progress bar, tell multibar to show it
client.on('progress', (key, data) => {
  bars[key].update(data.value, data)
  bars[key].setTotal(data.total)
})
// a bar is done, tell multibar to stop updating it
client.on('barDone', (key, data) => {
  bars[key].stop()
})
// all bars done, tell multibar to close entirely
client.on('done', () => {
  multibar.stop()
})
```

## API

### `proggy.createTracker(name, [key], [total])`

Create a new `Tracker`.

`key` will default to `name` if not set.  It must be unique.

### `new proggy.Tracker(name, [key], [total])`

The Tracker class, for emitting progress information.

`total` will default to `100` if not set, but will be updated whenever
progress is tracked.

#### Fields

* `name`, `key` - The name and identifer values set in the constructor
* `done` - `true` if the tracker is completed.
* `total` `value` - The most recent values updated.

#### `tracker.update(value, total, [metadata])`

Update the tracker and emit a `'progress'` event on the `process` object.

#### `tracker.finish([metadata])`

Alias for `tracker.update(tracker.total, tracker.total, metadata)`

### `proggy.createClient(options)`

Create a new `Client`.

### `new proggy.Client({ normalize = false, stopOnDone = false })`

The Client class, for consuming progress information.

Set `normalize: true` in the options object to prevent backward motion and
fix the `total` value at `100`.

Set `stopOnDone: true` in the options object to tell the client to
automatically stop when it emits its `'done'` event.

#### Fields

* `normalize` - whether this Client is in normalizing mode
* `size` - the number of active trackers this Client is aware of

#### Events

* `client.on('bar', (key, data) => {})` - Emitted when a new progress bar
  is encountered.
* `client.on('progress', (key, data) => {})` - Emitted when an update is
  available for a given progress bar.
* `client.on('barDone', (key, data) => {})` - Emitted when a progress bar
  is completed.
* `client.on('done', () => {})` - Emitted when all progress bars are
  completed.

#### `client.start()`

Begin listening for `'progress'` events on the `process` object.

Called implicitly if `client.on('progress', fn)` is called.

#### `client.stop()`

Stop listening for `'progress'` events on the `process` object.

Called implicitly when the `'done'` event is emitted, if
`client.stopOnDone` is true.

#### Progress Data

All client events receive data objects containing the following fields, in
addition to whatever else was sent by the `tracker`.

* `key` - The unique key for this progress bar.
* `name` - The name for this progress bar.
* `value` - The current value of the progress.  If `client.normalize` is
  true, then this will always be a number less than `100`, and never reduce
  from one update to the next.
* `total` - The expected final value of the progress.  If
  `client.normalize` is true, then this number will always be `100`.
* `actualValue` - The value originally sent by the tracker.  If
  `client.normalize` is not true, then this is always equal to `value`.
* `actualTotal` - The total originally sent by the tracker.  If
  `client.normalize` is not true, then this is always equal to `total`.
* `done` - True if the tracker explicitly sent `done: true` in the data, or
  if `value` is greater than or equal to `total`.
* Whatever other fields were set on the `metadata` sent by the tracker.
