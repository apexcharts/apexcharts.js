export declare function combineAsyncIterables<T = any>(..._iterators: {
    0: AsyncIterable<T>;
} & AsyncIterable<T>[]): AsyncGenerator<T>;
