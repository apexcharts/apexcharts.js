"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.combineAsyncIterables = combineAsyncIterables;
async function* combineAsyncIterables(..._iterators) {
    // Convert iterables into iterators with next, return, throws methods.
    // If it's already an iterator, keep it.
    const iterators = _iterators.map((it) => {
        if (typeof it['next'] === 'function') {
            return it;
        }
        else {
            return (async function* wrapped() {
                for await (const val of it) {
                    yield val;
                }
            })();
        }
    });
    let [options] = iterators;
    if (typeof options.next === 'function') {
        options = Object.create(null);
    }
    else {
        iterators.shift();
    }
    const getNextAsyncIteratorValue = getNextAsyncIteratorFactory(options);
    const asyncIteratorsValues = new Map(iterators.map((it, idx) => [idx, getNextAsyncIteratorValue(it, idx)]));
    try {
        do {
            const { iterator, index } = await Promise.race(asyncIteratorsValues.values());
            if (iterator.done) {
                asyncIteratorsValues.delete(index);
            }
            else {
                yield iterator.value;
                asyncIteratorsValues.set(index, getNextAsyncIteratorValue(iterators[index], index));
            }
        } while (asyncIteratorsValues.size > 0);
    }
    finally {
        for (const [index, iterator] of asyncIteratorsValues.entries())
            if (iterator?.['return'] !== null)
                iterator['return']?.();
    }
}
function getNextAsyncIteratorFactory(options) {
    return async (asyncIterator, index) => {
        try {
            const iterator = await asyncIterator.next();
            return { index, iterator };
        }
        catch (err) {
            if (options.errorCallback) {
                options.errorCallback(err, index);
            }
            return Promise.reject(err);
        }
    };
}
