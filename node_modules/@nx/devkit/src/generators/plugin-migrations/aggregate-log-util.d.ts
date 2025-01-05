interface AggregateLogOptions {
    project: string;
    log: string;
    executorName: string;
}
interface AggregateLogItem {
    log: string;
    projects: Set<string>;
}
/**
 * @example
 * // Instantiate a new object
 * const migrationLogs = new AggregatedLog();
 *
 * // Add logs
 * migrationLogs.addLog({executorName: '@nx/vite:build', project: 'app1', log: 'Migrate X manually'});
 *
 * // Flush all logs
 * migrationLogs.flushLogs()
 */
export declare class AggregatedLog {
    logs: Map<string, Map<string, AggregateLogItem>>;
    addLog({ project, log, executorName }: AggregateLogOptions): void;
    reset(): void;
    flushLogs(): void;
}
export {};
