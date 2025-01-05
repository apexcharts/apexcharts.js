import type { ExecutionContext } from './ExecutionContext.js';
/**
 * @internal
 */
export declare class Binding {
    #private;
    constructor(name: string, fn: (...args: unknown[]) => unknown);
    get name(): string;
    /**
     * @param context - Context to run the binding in; the context should have
     * the binding added to it beforehand.
     * @param id - ID of the call. This should come from the CDP
     * `onBindingCalled` response.
     * @param args - Plain arguments from CDP.
     */
    run(context: ExecutionContext, id: number, args: unknown[], isTrivial: boolean): Promise<void>;
}
//# sourceMappingURL=Binding.d.ts.map