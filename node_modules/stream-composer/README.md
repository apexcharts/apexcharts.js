# stream-composer

Modern stream composer

```
npm install stream-composer
```

Supports composing and pipelining multiple streams into a single [streamx](https://github.com/mafintosh/streamx) stream.

## Usage

``` js
const Composer = require('stream-composer')

// Make a duplex stream out of a read and write stream
const stream = new Composer()

stream.setReadable(someReadableStream) // set readable side
stream.setWritable(someWritableStream) // set writable side

// reads, read from the readable stream
stream.on('data', function (data) {
  // data is from someReadableStream
})

// writes, write to the writable stream
stream.write(data)
```

## API

#### `stream = new Composer([options])`

Make a new composer. Optionally pass the writable stream and readable stream in the constructor.
Options are forwarded to streamx.

#### `stream.setReadable(readableStream)`

Set the readable stream. If you pass `null` the readable stream will be set to an empty stream for you.

#### `stream.setWritable(writableStream)`

Set the writable stream. If you pass `null` the writable stream will be set to an empty stream for you.

#### `stream.setPipeline(...pipelineStreams)`

Set the stream to a pipeline. Writing to the outer stream writes to the first stream in the pipeline
and reading from the outer stream, reads from the last stream in the pipeline.

#### `stream = Composer.pipeline(...pipelineStreams)`

Helper for making a composer stream and setting the pipeline in one go.

#### `stream = Composer.duplexer(writableStream, readableStream)`

Helper for making a composer stream and setting the writable and readable stream in one go.

## License

MIT
