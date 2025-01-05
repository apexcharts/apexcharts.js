'use strict';

var Transform = require('streamx').Transform;

// Based on help from @mafintosh via https://gist.github.com/mafintosh/92836a8d03df0ef41356e233e0f06382

function toThrough(readable) {
  var highWaterMark = readable._readableState.highWaterMark;

  // Streamx uses 16384 as the default highWaterMark for everything and then
  // divides it by 1024 for objects
  // However, node's objectMode streams the number of objects as highWaterMark, so we need to
  // multiply the objectMode highWaterMark by 1024 to make it streamx compatible
  if (readable._readableState.objectMode) {
    highWaterMark = readable._readableState.highWaterMark * 1024;
  }

  var destroyedByError = false;
  var readableClosed = false;
  var readableEnded = false;

  function flush(cb) {
    var self = this;

    // Afer all writes have drained, we change the `_read` implementation
    self._read = function (cb) {
      readable.resume();
      cb();
    };

    readable.on('data', onData);
    readable.once('error', onError);
    readable.once('end', onEnd);

    function cleanup() {
      readable.off('data', onData);
      readable.off('error', onError);
      readable.off('end', onEnd);
    }

    function onData(data) {
      var drained = self.push(data);
      // When the stream is not drained, we pause it because `_read` will be called later
      if (!drained) {
        readable.pause();
      }
    }

    function onError(err) {
      cleanup();
      cb(err);
    }

    function onEnd() {
      cleanup();
      cb();
    }
  }

  // Handle the case where a user destroyed the returned stream
  function predestroy() {
    // Only call destroy on the readable if this `predestroy` wasn't
    // caused via the readable having an `error` or `close` event
    if (destroyedByError) {
      return;
    }
    if (readableClosed) {
      return;
    }
    readable.destroy(new Error('Wrapper destroyed'));
  }

  var wrapper = new Transform({
    highWaterMark: highWaterMark,
    flush: flush,
    predestroy: predestroy,
  });

  // Forward errors from the underlying stream
  readable.once('error', onError);
  readable.once('end', onEnd);
  readable.once('close', onClose);

  function onError(err) {
    destroyedByError = true;
    wrapper.destroy(err);
  }

  function onEnd() {
    readableEnded = true;
  }

  function onClose() {
    readableClosed = true;
    // Only destroy the wrapper if the readable hasn't ended successfully
    if (!readableEnded) {
      wrapper.destroy();
    }
  }

  var shouldFlow = true;
  wrapper.once('pipe', onPipe);
  wrapper.on('piping', onPiping);
  wrapper.on('newListener', onListener);

  function onPiping() {
    maybeFlow();
    wrapper.off('piping', onPiping);
    wrapper.off('newListener', onListener);
  }

  function onListener(event) {
    // Once we've seen the data or readable event, check if we need to flow
    if (event === 'data' || event === 'readable') {
      onPiping();
    }
  }

  function onPipe() {
    // If the wrapper is piped, disable flow
    shouldFlow = false;
  }

  function maybeFlow() {
    // If we need to flow, end the stream which triggers flush
    if (shouldFlow) {
      wrapper.end();
    }
  }

  return wrapper;
}

module.exports = toThrough;
