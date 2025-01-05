export declare const isWindows: boolean;
/**
 * For IPC with the daemon server we use unix sockets or windows named pipes, depending on the user's operating system.
 *
 * See https://nodejs.org/dist/latest-v14.x/docs/api/net.html#net_identifying_paths_for_ipc_connections for a full breakdown
 * of OS differences between Unix domain sockets and named pipes.
 */
export declare const getFullOsSocketPath: () => string;
export declare const getForkedProcessOsSocketPath: (id: string) => string;
export declare const getPluginOsSocketPath: (id: string) => string;
export declare function killSocketOrPath(): void;
export declare function serializeResult(error: Error | null, serializedProjectGraph: string | null, serializedSourceMaps: string | null): string | null;
