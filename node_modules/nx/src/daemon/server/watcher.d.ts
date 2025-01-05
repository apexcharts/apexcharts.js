import { Server } from 'net';
import type { WatchEvent } from '../../native';
export type FileWatcherCallback = (err: Error | string | null, changeEvents: WatchEvent[] | null) => Promise<void>;
export declare function watchWorkspace(server: Server, cb: FileWatcherCallback): Promise<import("../../native").Watcher>;
export declare function watchOutputFiles(server: Server, cb: FileWatcherCallback): Promise<import("../../native").Watcher>;
/**
 * NOTE: An event type of "create" will also apply to the case where the user has restored
 * an original version of a file after modifying/deleting it by using git, so we adjust
 * our log language accordingly.
 */
export declare function convertChangeEventsToLogMessage(changeEvents: WatchEvent[]): string;
