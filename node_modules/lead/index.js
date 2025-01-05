'use strict';

function hasListeners(stream) {
  return !!(stream.listenerCount('readable') || stream.listenerCount('data'));
}

function sink(stream) {
  var sinkAdded = false;

  function addSink() {
    if (sinkAdded) {
      return;
    }

    if (hasListeners(stream)) {
      return;
    }

    sinkAdded = true;
    stream.resume();
  }

  function removeSink(evt) {
    if (evt !== 'readable' && evt !== 'data') {
      return;
    }

    if (hasListeners(stream)) {
      sinkAdded = false;
    }

    process.nextTick(addSink);
  }

  function markSink() {
    sinkAdded = true;
  }

  stream.on('newListener', removeSink);
  stream.on('removeListener', removeSink);
  stream.on('piping', markSink);

  // Sink the stream to start flowing
  // Do this on nextTick, it will flow at slowest speed of piped streams
  process.nextTick(addSink);

  return stream;
}

module.exports = sink;
