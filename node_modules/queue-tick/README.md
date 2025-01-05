# queue-tick

Next tick shim that prefers process.nextTick over queueMicrotask for compat

```
npm install queue-tick
```

## Usage

``` js
const queueTick = require('queue-tick')

// in Node it uses process.nextTick, in browsers it uses queueMicrotask
queueTick(() => console.log('laters'))
```

## License

MIT
