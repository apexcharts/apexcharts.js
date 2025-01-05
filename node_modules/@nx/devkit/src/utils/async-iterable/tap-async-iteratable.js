"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tapAsyncIterable = tapAsyncIterable;
const map_async_iteratable_1 = require("./map-async-iteratable");
async function* tapAsyncIterable(data, fn) {
    return yield* (0, map_async_iteratable_1.mapAsyncIterable)(data, (x) => {
        fn(x);
        return x;
    });
}
