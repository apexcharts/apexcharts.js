interface QueueOptions {
    delayUntil?: number;
}
export default class Queue<T> {
    private list;
    private delayedItems;
    size(): number;
    push(item: T, options?: QueueOptions): void;
    shift(): T | undefined;
}
export {};
