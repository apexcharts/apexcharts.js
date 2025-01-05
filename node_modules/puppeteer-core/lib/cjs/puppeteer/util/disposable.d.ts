/**
 * @license
 * Copyright 2023 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
declare global {
    interface SymbolConstructor {
        /**
         * A method that is used to release resources held by an object. Called by
         * the semantics of the `using` statement.
         */
        readonly dispose: unique symbol;
        /**
         * A method that is used to asynchronously release resources held by an
         * object. Called by the semantics of the `await using` statement.
         */
        readonly asyncDispose: unique symbol;
    }
    interface Disposable {
        [Symbol.dispose](): void;
    }
    interface AsyncDisposable {
        [Symbol.asyncDispose](): PromiseLike<void>;
    }
}
/**
 * @internal
 */
export declare const disposeSymbol: typeof Symbol.dispose;
/**
 * @internal
 */
export declare const asyncDisposeSymbol: typeof Symbol.asyncDispose;
/**
 * @internal
 */
export declare class DisposableStack {
    #private;
    /**
     * Returns a value indicating whether this stack has been disposed.
     */
    get disposed(): boolean;
    /**
     * Disposes each resource in the stack in the reverse order that they were added.
     */
    dispose(): void;
    /**
     * Adds a disposable resource to the stack, returning the resource.
     *
     * @param value - The resource to add. `null` and `undefined` will not be added,
     * but will be returned.
     * @returns The provided `value`.
     */
    use<T extends Disposable | null | undefined>(value: T): T;
    /**
     * Adds a value and associated disposal callback as a resource to the stack.
     *
     * @param value - The value to add.
     * @param onDispose - The callback to use in place of a `[disposeSymbol]()`
     * method. Will be invoked with `value` as the first parameter.
     * @returns The provided `value`.
     */
    adopt<T>(value: T, onDispose: (value: T) => void): T;
    /**
     * Adds a callback to be invoked when the stack is disposed.
     */
    defer(onDispose: () => void): void;
    /**
     * Move all resources out of this stack and into a new `DisposableStack`, and
     * marks this stack as disposed.
     *
     * @example
     *
     * ```ts
     * class C {
     *   #res1: Disposable;
     *   #res2: Disposable;
     *   #disposables: DisposableStack;
     *   constructor() {
     *     // stack will be disposed when exiting constructor for any reason
     *     using stack = new DisposableStack();
     *
     *     // get first resource
     *     this.#res1 = stack.use(getResource1());
     *
     *     // get second resource. If this fails, both `stack` and `#res1` will be disposed.
     *     this.#res2 = stack.use(getResource2());
     *
     *     // all operations succeeded, move resources out of `stack` so that
     *     // they aren't disposed when constructor exits
     *     this.#disposables = stack.move();
     *   }
     *
     *   [disposeSymbol]() {
     *     this.#disposables.dispose();
     *   }
     * }
     * ```
     */
    move(): DisposableStack;
    [disposeSymbol]: () => void;
    readonly [Symbol.toStringTag] = "DisposableStack";
}
/**
 * @internal
 */
export declare class AsyncDisposableStack {
    #private;
    /**
     * Returns a value indicating whether this stack has been disposed.
     */
    get disposed(): boolean;
    /**
     * Disposes each resource in the stack in the reverse order that they were added.
     */
    dispose(): Promise<void>;
    /**
     * Adds a disposable resource to the stack, returning the resource.
     *
     * @param value - The resource to add. `null` and `undefined` will not be added,
     * but will be returned.
     * @returns The provided `value`.
     */
    use<T extends AsyncDisposable | null | undefined>(value: T): T;
    /**
     * Adds a value and associated disposal callback as a resource to the stack.
     *
     * @param value - The value to add.
     * @param onDispose - The callback to use in place of a `[disposeSymbol]()`
     * method. Will be invoked with `value` as the first parameter.
     * @returns The provided `value`.
     */
    adopt<T>(value: T, onDispose: (value: T) => Promise<void>): T;
    /**
     * Adds a callback to be invoked when the stack is disposed.
     */
    defer(onDispose: () => Promise<void>): void;
    /**
     * Move all resources out of this stack and into a new `DisposableStack`, and
     * marks this stack as disposed.
     *
     * @example
     *
     * ```ts
     * class C {
     *   #res1: Disposable;
     *   #res2: Disposable;
     *   #disposables: DisposableStack;
     *   constructor() {
     *     // stack will be disposed when exiting constructor for any reason
     *     using stack = new DisposableStack();
     *
     *     // get first resource
     *     this.#res1 = stack.use(getResource1());
     *
     *     // get second resource. If this fails, both `stack` and `#res1` will be disposed.
     *     this.#res2 = stack.use(getResource2());
     *
     *     // all operations succeeded, move resources out of `stack` so that
     *     // they aren't disposed when constructor exits
     *     this.#disposables = stack.move();
     *   }
     *
     *   [disposeSymbol]() {
     *     this.#disposables.dispose();
     *   }
     * }
     * ```
     */
    move(): AsyncDisposableStack;
    [asyncDisposeSymbol]: () => Promise<void>;
    readonly [Symbol.toStringTag] = "AsyncDisposableStack";
}
//# sourceMappingURL=disposable.d.ts.map