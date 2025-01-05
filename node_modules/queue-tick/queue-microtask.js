module.exports = typeof queueMicrotask === 'function' ? queueMicrotask : (fn) => Promise.resolve().then(fn)
