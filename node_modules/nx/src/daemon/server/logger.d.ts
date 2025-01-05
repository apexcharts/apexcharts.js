/**
 * To improve the overall readibility of the logs, we categorize things by "trigger":
 *
 * - [REQUEST] meaning that the current set of actions were triggered by a client request to the server
 * - [WATCHER] meaning the the current set of actions were triggered by handling changes to the workspace files
 *
 * We keep those two "triggers" left aligned at the top level and then indent subsequent logs so that there is a
 * logical hierarchy/grouping.
 */
declare class ServerLogger {
    log(...s: unknown[]): void;
    requestLog(...s: unknown[]): void;
    watcherLog(...s: unknown[]): void;
    private formatLogMessage;
    private getNow;
}
export declare const serverLogger: ServerLogger;
export {};
