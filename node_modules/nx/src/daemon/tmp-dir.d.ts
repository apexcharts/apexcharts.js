export declare const DAEMON_DIR_FOR_CURRENT_WORKSPACE: string;
export declare const DAEMON_OUTPUT_LOG_FILE: string;
export declare const getDaemonSocketDir: () => string;
export declare function writeDaemonLogs(error?: string): string;
export declare function markDaemonAsDisabled(): void;
export declare function isDaemonDisabled(): boolean;
/**
 * We try to create a socket file in a tmp dir, but if it doesn't work because
 * for instance we don't have permissions, we create it in DAEMON_DIR_FOR_CURRENT_WORKSPACE
 */
export declare function getSocketDir(alreadyUnique?: boolean): string;
export declare function removeSocketDir(): void;
