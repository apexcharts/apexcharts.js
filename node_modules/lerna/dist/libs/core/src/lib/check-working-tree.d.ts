export declare function checkWorkingTree({ cwd }?: {
    cwd?: string | URL;
}): Promise<void>;
export declare function throwIfReleased({ refCount }: {
    refCount: any;
}): void;
export declare function mkThrowIfUncommitted(options?: {}): (opts: {
    isDirty?: boolean;
}) => Promise<never> | undefined;
export declare const throwIfUncommitted: (opts: {
    isDirty?: boolean;
}) => Promise<never> | undefined;
