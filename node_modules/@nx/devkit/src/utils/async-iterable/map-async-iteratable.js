"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mapAsyncIterable = mapAsyncIterable;
async function* mapAsyncIterable(data, transform) {
    async function* f() {
        const generator = data[Symbol.asyncIterator] || data[Symbol.iterator];
        const iterator = generator.call(data);
        let index = 0;
        let item = await iterator.next();
        while (!item.done) {
            yield await transform(await item.value, index, data);
            index++;
            item = await iterator.next();
        }
    }
    return yield* f();
}
