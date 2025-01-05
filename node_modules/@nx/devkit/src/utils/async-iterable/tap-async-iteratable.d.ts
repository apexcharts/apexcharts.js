export declare function tapAsyncIterable<T = any, I = any, O = any>(data: AsyncIterable<T> | AsyncIterableIterator<T>, fn: (input: I) => void): AsyncIterable<T> | AsyncIterableIterator<T>;
