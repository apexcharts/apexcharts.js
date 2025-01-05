import npmlog, { Logger } from "./npmlog";
export declare function generateProfileOutputPath(outputDirectory?: string): string;
interface ProfilerConfig {
    concurrency: number;
    log?: typeof npmlog;
    outputDirectory?: string;
}
/**
 * A profiler to trace execution times across multiple concurrent calls.
 */
export declare class Profiler {
    events: any[];
    logger: Logger;
    outputPath: string;
    threads: number[];
    constructor({ concurrency, log, outputDirectory }: ProfilerConfig);
    run(fn: () => any, name: any): Promise<any>;
    output(): Promise<void>;
}
export {};
