"use strict";
/**
 * @license
 * Copyright 2023 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AsyncDisposableStack = exports.DisposableStack = exports.asyncDisposeSymbol = exports.disposeSymbol = void 0;
Symbol.dispose ??= Symbol('dispose');
Symbol.asyncDispose ??= Symbol('asyncDispose');
/**
 * @internal
 */
exports.disposeSymbol = Symbol.dispose;
/**
 * @internal
 */
exports.asyncDisposeSymbol = Symbol.asyncDispose;
/**
 * @internal
 */
class DisposableStack {
    #disposed = false;
    #stack = [];
    /**
     * Returns a value indicating whether this stack has been disposed.
     */
    get disposed() {
        return this.#disposed;
    }
    /**
     * Disposes each resource in the stack in the reverse order that they were added.
     */
    dispose() {
        if (this.#disposed) {
            return;
        }
        this.#disposed = true;
        for (const resource of this.#stack.reverse()) {
            resource[exports.disposeSymbol]();
        }
    }
    /**
     * Adds a disposable resource to the stack, returning the resource.
     *
     * @param value - The resource to add. `null` and `undefined` will not be added,
     * but will be returned.
     * @returns The provided `value`.
     */
    use(value) {
        if (value) {
            this.#stack.push(value);
        }
        return value;
    }
    /**
     * Adds a value and associated disposal callback as a resource to the stack.
     *
     * @param value - The value to add.
     * @param onDispose - The callback to use in place of a `[disposeSymbol]()`
     * method. Will be invoked with `value` as the first parameter.
     * @returns The provided `value`.
     */
    adopt(value, onDispose) {
        this.#stack.push({
            [exports.disposeSymbol]() {
                onDispose(value);
            },
        });
        return value;
    }
    /**
     * Adds a callback to be invoked when the stack is disposed.
     */
    defer(onDispose) {
        this.#stack.push({
            [exports.disposeSymbol]() {
                onDispose();
            },
        });
    }
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
    move() {
        if (this.#disposed) {
            throw new ReferenceError('a disposed stack can not use anything new'); // step 3
        }
        const stack = new DisposableStack(); // step 4-5
        stack.#stack = this.#stack;
        this.#disposed = true;
        return stack;
    }
    [exports.disposeSymbol] = this.dispose;
    [Symbol.toStringTag] = 'DisposableStack';
}
exports.DisposableStack = DisposableStack;
/**
 * @internal
 */
class AsyncDisposableStack {
    #disposed = false;
    #stack = [];
    /**
     * Returns a value indicating whether this stack has been disposed.
     */
    get disposed() {
        return this.#disposed;
    }
    /**
     * Disposes each resource in the stack in the reverse order that they were added.
     */
    async dispose() {
        if (this.#disposed) {
            return;
        }
        this.#disposed = true;
        for (const resource of this.#stack.reverse()) {
            await resource[exports.asyncDisposeSymbol]();
        }
    }
    /**
     * Adds a disposable resource to the stack, returning the resource.
     *
     * @param value - The resource to add. `null` and `undefined` will not be added,
     * but will be returned.
     * @returns The provided `value`.
     */
    use(value) {
        if (value) {
            this.#stack.push(value);
        }
        return value;
    }
    /**
     * Adds a value and associated disposal callback as a resource to the stack.
     *
     * @param value - The value to add.
     * @param onDispose - The callback to use in place of a `[disposeSymbol]()`
     * method. Will be invoked with `value` as the first parameter.
     * @returns The provided `value`.
     */
    adopt(value, onDispose) {
        this.#stack.push({
            [exports.asyncDisposeSymbol]() {
                return onDispose(value);
            },
        });
        return value;
    }
    /**
     * Adds a callback to be invoked when the stack is disposed.
     */
    defer(onDispose) {
        this.#stack.push({
            [exports.asyncDisposeSymbol]() {
                return onDispose();
            },
        });
    }
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
    move() {
        if (this.#disposed) {
            throw new ReferenceError('a disposed stack can not use anything new'); // step 3
        }
        const stack = new AsyncDisposableStack(); // step 4-5
        stack.#stack = this.#stack;
        this.#disposed = true;
        return stack;
    }
    [exports.asyncDisposeSymbol] = this.dispose;
    [Symbol.toStringTag] = 'AsyncDisposableStack';
}
exports.AsyncDisposableStack = AsyncDisposableStack;
//# sourceMappingURL=disposable.js.map