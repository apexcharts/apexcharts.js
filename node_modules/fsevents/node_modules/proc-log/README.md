# proc-log

Emits events on the process object which a listener can consume and print to the terminal or log file.

This is used by various modules within the npm CLI stack in order to send log events that can be consumed by a listener on the process object.

Currently emits `log`, `output`, `input`, and `time` events.

## API

```js
const { log, output, input, time } = require('proc-log')
```

#### output
* `output.standard(...args)` calls `process.emit('output', 'standard', ...args)`
  
  This is for general standard output.  Consumers will typically show this on stdout (after optionally formatting or filtering it).

* `output.error(...args)` calls `process.emit('output', 'error', ...args)`
  
  This is for general error output.  Consumers will typically show this on stderr (after optionally formatting or filtering it).

* `output.buffer(...args)` calls `process.emit('output', 'buffer', ...args)`
  
  This is for buffered output.  Consumers will typically buffer this until they are ready to display.

* `output.flush(...args)` calls `process.emit('output', 'flush', ...args)`
  
  This is to indicate that the output buffer should be flushed.

* `output.LEVELS` an array of strings of all output method names

#### log
* `log.error(...args)` calls `process.emit('log', 'error', ...args)`
  
  The highest log level.  For printing extremely serious errors that indicate something went wrong.

* `log.warn(...args)` calls `process.emit('log', 'warn', ...args)`
  
  A fairly high log level.  Things that the user needs to be aware of, but which won't necessarily cause improper functioning of the system.

* `log.notice(...args)` calls `process.emit('log', 'notice', ...args)`
  
  Notices which are important, but not necessarily dangerous or a cause for excess concern.

* `log.info(...args)` calls `process.emit('log', 'info', ...args)`
  
  Informative messages that may benefit the user, but aren't particularly important.

* `log.verbose(...args)` calls `process.emit('log', 'verbose', ...args)`
  
  Noisy output that is more detail that most users will care about.

* `log.silly(...args)` calls `process.emit('log', 'silly', ...args)`
  
  Extremely noisy excessive logging messages that are typically only useful for debugging.

* `log.http(...args)` calls `process.emit('log', 'http', ...args)`
  
  Information about HTTP requests made and/or completed.

* `log.timing(...args)` calls `process.emit('log', 'timing', ...args)`
  
  Timing information.

* `log.pause()` calls `process.emit('log', 'pause')`
  
  Used to tell the consumer to stop printing messages.

* `log.resume()` calls `process.emit('log', 'resume')`
  
  Used to tell the consumer that it is ok to print messages again.

* `log.LEVELS` an array of strings of all log method names

#### input

* `input.start(fn?)` calls `process.emit('input', 'start')`

  Used to tell the consumer that the terminal is going to begin reading user input. Returns a function that will call `input.end()` for convenience.
  
  This also takes an optional callback which will run `input.end()` on its completion. If the callback returns a `Promise` then `input.end()` will be run during `finally()`.

* `input.end()` calls `process.emit('input', 'end')`

  Used to tell the consumer that the terminal has stopped reading user input.

* `input.read(...args): Promise` calls `process.emit('input', 'read', resolve, reject, ...args)`

  Used to tell the consumer that the terminal is reading user input and returns a `Promise` that the producer can `await` until the consumer has finished its async action.
  
  This emits `resolve` and `reject` functions (in addition to all passed in arguments) which the consumer must use to resolve the returned `Promise`.

#### time

* `time.start(timerName, fn?)` calls `process.emit('time', 'start', 'timerName')`

  Used to start a timer with the specified name. Returns a function that will call `time.end()` for convenience.
  
  This also takes an optional callback which will run `time.end()` on its completion. If the callback returns a `Promise` then `time.end()` will be run during `finally()`.

* `time.end(timerName)` calls `process.emit('time', 'end', timeName)`

  Used to tell the consumer to stop a timer with the specified name.

## Examples

### log

Every `log` method calls `process.emit('log', level, ...otherArgs)` internally.  So in order to consume those events you need to do `process.on('log', fn)`.

#### Colorize based on level

Here's an example of how to consume `proc-log` log events and colorize them based on level:

```js
const chalk = require('chalk')

process.on('log', (level, ...args) => {
  if (level === 'error') {
    console.log(chalk.red(level), ...args)
  } else {
    console.log(chalk.blue(level), ...args)
  }
})
```

#### Pause and resume

`log.pause` and `log.resume` are included so you have the ability to tell your consumer that you want to pause or resume your display of logs. In the npm CLI we use this to buffer all logs on init until we know the correct loglevel to display.  But we also setup a second handler that writes everything to a file even if paused.

```js
let paused = true
const buffer = []

// this handler will buffer and replay logs only after `procLog.resume()` is called
process.on('log', (level, ...args) => {
  if (level === 'resume') {
    buffer.forEach((item) => console.log(...item))
    paused = false
    return
  } 

  if (paused) {
    buffer.push([level, ...args])
  } else {
    console.log(level, ...args)
  }
})

// this handler will write everything to a file
process.on('log', (...args) => {
  fs.appendFileSync('debug.log', args.join(' '))
})
```

### input

### `start` and `end`

**producer.js**
```js
const { output, input } = require('proc-log')
const { readFromUserInput } = require('./my-read')

// Using callback passed to `start`
try {
  const res = await input.start(
    readFromUserInput({ prompt: 'OK?', default: 'y' })
  )
  output.standard(`User said ${res}`)
} catch (err) {
  output.error(`User cancelled: ${err}`)
}

// Manually calling `start` and `end`
try {
  input.start()
  const res = await readFromUserInput({ prompt: 'OK?', default: 'y' })
  output.standard(`User said ${res}`)
} catch (err) {
  output.error(`User cancelled: ${err}`)
} finally {
  input.end()
}
```

**consumer.js**
```js
const { read } = require('read')

process.on('input', (level) => {
  if (level === 'start') {
    // Hide UI to make room for user input being read
  } else if (level === 'end') {
    // Restore UI now that reading is ended
  }
})
```

### Using `read` to call `read()`

**producer.js**
```js
const { output, input } = require('proc-log')

try {
  const res = await input.read({ prompt: 'OK?', default: 'y' })
  output.standard(`User said ${res}`)
} catch (err) {
  output.error(`User cancelled: ${err}`)
}
```

**consumer.js**
```js
const { read } = require('read')

process.on('input', (level, ...args) => {
  if (level === 'read') {
    const [res, rej, opts] = args
    read(opts).then(res).catch(rej)
  }
})
```