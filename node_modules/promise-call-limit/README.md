# promise-call-limit

Call an array of promise-returning functions, restricting concurrency to a
specified limit.

## USAGE

```js
import { callLimit } from 'promise-call-limit'
// or: const { callLimit } = require('promise-call-limit')

const things = getLongListOfThingsToFrobulate()

// frobulate no more than 4 things in parallel
callLimit(
  things.map(thing => () => frobulateThing(thing)),
  {
    limit: 4,
  },
).then(results => console.log('frobulated 4 at a time', results))
```

## API

### callLimit(queue Array<() => Promise>, opts<Object>)

opts can contain:

- limit: specified concurrency limit. Defaults to the number of
  CPUs on the system minus one. Presumably the main thread is taking
  up a CPU as well, so let's not be greedy. In the case where there
  is only one cpu the limit will default to 1.
- rejectLate: if true, then any rejection will not prevent the rest of
  the queue from running. Any subsequent rejections will be ignored,
  and the first rejection will be what the function finally rejects
  with.

Note that the array should be a list of Promise-_returning_ functions, not
Promises themselves. If you have a bunch of Promises already, you're best
off just calling `Promise.all()`.

The functions in the queue are called without any arguments.
