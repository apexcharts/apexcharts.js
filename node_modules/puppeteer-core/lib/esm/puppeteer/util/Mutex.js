/**
 * @license
 * Copyright 2024 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
import { Deferred } from './Deferred.js';
import { disposeSymbol } from './disposable.js';
/**
 * @internal
 */
export class Mutex {
    static Guard = class Guard {
        #mutex;
        constructor(mutex) {
            this.#mutex = mutex;
        }
        [disposeSymbol]() {
            return this.#mutex.release();
        }
    };
    #locked = false;
    #acquirers = [];
    // This is FIFO.
    async acquire() {
        if (!this.#locked) {
            this.#locked = true;
            return new Mutex.Guard(this);
        }
        const deferred = Deferred.create();
        this.#acquirers.push(deferred.resolve.bind(deferred));
        await deferred.valueOrThrow();
        return new Mutex.Guard(this);
    }
    release() {
        const resolve = this.#acquirers.shift();
        if (!resolve) {
            this.#locked = false;
            return;
        }
        resolve();
    }
}
//# sourceMappingURL=Mutex.js.map