import { disposeSymbol } from './disposable.js';
/**
 * @internal
 */
export declare class Mutex {
    #private;
    static Guard: {
        new (mutex: Mutex): {
            "__#55092@#mutex": Mutex;
            [Symbol.dispose](): void;
        };
    };
    acquire(): Promise<InstanceType<typeof Mutex.Guard>>;
    release(): void;
}
//# sourceMappingURL=Mutex.d.ts.map