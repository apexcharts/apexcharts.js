"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.openSockets = void 0;
exports.handleResult = handleResult;
exports.startServer = startServer;
const fs_1 = require("fs");
const net_1 = require("net");
const path_1 = require("path");
const perf_hooks_1 = require("perf_hooks");
const file_hasher_1 = require("../../hasher/file-hasher");
const native_1 = require("../../native");
const consume_messages_from_socket_1 = require("../../utils/consume-messages-from-socket");
const fileutils_1 = require("../../utils/fileutils");
const versions_1 = require("../../utils/versions");
const workspace_context_1 = require("../../utils/workspace-context");
const workspace_root_1 = require("../../utils/workspace-root");
const cache_1 = require("../cache");
const socket_utils_1 = require("../socket-utils");
const file_watcher_sockets_1 = require("./file-watching/file-watcher-sockets");
const handle_hash_tasks_1 = require("./handle-hash-tasks");
const handle_outputs_tracking_1 = require("./handle-outputs-tracking");
const handle_process_in_background_1 = require("./handle-process-in-background");
const handle_request_project_graph_1 = require("./handle-request-project-graph");
const handle_request_shutdown_1 = require("./handle-request-shutdown");
const logger_1 = require("./logger");
const outputs_tracking_1 = require("./outputs-tracking");
const project_graph_incremental_recomputation_1 = require("./project-graph-incremental-recomputation");
const shutdown_utils_1 = require("./shutdown-utils");
const watcher_1 = require("./watcher");
const handle_glob_1 = require("./handle-glob");
const glob_1 = require("../message-types/glob");
const get_nx_workspace_files_1 = require("../message-types/get-nx-workspace-files");
const handle_nx_workspace_files_1 = require("./handle-nx-workspace-files");
const get_context_file_data_1 = require("../message-types/get-context-file-data");
const handle_context_file_data_1 = require("./handle-context-file-data");
const get_files_in_directory_1 = require("../message-types/get-files-in-directory");
const handle_get_files_in_directory_1 = require("./handle-get-files-in-directory");
const hash_glob_1 = require("../message-types/hash-glob");
const handle_hash_glob_1 = require("./handle-hash-glob");
const task_history_1 = require("../message-types/task-history");
const handle_task_history_1 = require("./handle-task-history");
const force_shutdown_1 = require("../message-types/force-shutdown");
const handle_force_shutdown_1 = require("./handle-force-shutdown");
const get_sync_generator_changes_1 = require("../message-types/get-sync-generator-changes");
const handle_get_sync_generator_changes_1 = require("./handle-get-sync-generator-changes");
const sync_generators_1 = require("./sync-generators");
const get_registered_sync_generators_1 = require("../message-types/get-registered-sync-generators");
const handle_get_registered_sync_generators_1 = require("./handle-get-registered-sync-generators");
const update_workspace_context_1 = require("../message-types/update-workspace-context");
const handle_update_workspace_context_1 = require("./handle-update-workspace-context");
const flush_sync_generator_changes_to_disk_1 = require("../message-types/flush-sync-generator-changes-to-disk");
const handle_flush_sync_generator_changes_to_disk_1 = require("./handle-flush-sync-generator-changes-to-disk");
let performanceObserver;
let workspaceWatcherError;
let outputsWatcherError;
global.NX_DAEMON = true;
let numberOfOpenConnections = 0;
exports.openSockets = new Set();
const server = (0, net_1.createServer)(async (socket) => {
    numberOfOpenConnections += 1;
    exports.openSockets.add(socket);
    logger_1.serverLogger.log(`Established a connection. Number of open connections: ${numberOfOpenConnections}`);
    (0, shutdown_utils_1.resetInactivityTimeout)(handleInactivityTimeout);
    if (!performanceObserver) {
        performanceObserver = new perf_hooks_1.PerformanceObserver((list) => {
            const entry = list.getEntries()[0];
            logger_1.serverLogger.log(`Time taken for '${entry.name}'`, `${entry.duration}ms`);
        });
        performanceObserver.observe({ entryTypes: ['measure'] });
    }
    socket.on('data', (0, consume_messages_from_socket_1.consumeMessagesFromSocket)(async (message) => {
        await handleMessage(socket, message);
    }));
    socket.on('error', (e) => {
        logger_1.serverLogger.log('Socket error');
        console.error(e);
    });
    socket.on('close', () => {
        numberOfOpenConnections -= 1;
        exports.openSockets.delete(socket);
        logger_1.serverLogger.log(`Closed a connection. Number of open connections: ${numberOfOpenConnections}`);
        (0, file_watcher_sockets_1.removeRegisteredFileWatcherSocket)(socket);
    });
});
registerProcessTerminationListeners();
async function handleMessage(socket, data) {
    if (workspaceWatcherError) {
        await (0, shutdown_utils_1.respondWithErrorAndExit)(socket, `File watcher error in the workspace '${workspace_root_1.workspaceRoot}'.`, workspaceWatcherError);
    }
    const outdated = daemonIsOutdated();
    if (outdated) {
        await (0, shutdown_utils_1.respondWithErrorAndExit)(socket, `Daemon outdated`, new Error(outdated));
    }
    (0, shutdown_utils_1.resetInactivityTimeout)(handleInactivityTimeout);
    const unparsedPayload = data;
    let payload;
    try {
        payload = JSON.parse(unparsedPayload);
    }
    catch (e) {
        await (0, shutdown_utils_1.respondWithErrorAndExit)(socket, `Invalid payload from the client`, new Error(`Unsupported payload sent to daemon server: ${unparsedPayload}`));
    }
    if (payload.type === 'PING') {
        await handleResult(socket, 'PING', () => Promise.resolve({ response: JSON.stringify(true), description: 'ping' }));
    }
    else if (payload.type === 'REQUEST_PROJECT_GRAPH') {
        await handleResult(socket, 'REQUEST_PROJECT_GRAPH', () => (0, handle_request_project_graph_1.handleRequestProjectGraph)());
    }
    else if (payload.type === 'HASH_TASKS') {
        await handleResult(socket, 'HASH_TASKS', () => (0, handle_hash_tasks_1.handleHashTasks)(payload));
    }
    else if (payload.type === 'PROCESS_IN_BACKGROUND') {
        await handleResult(socket, 'PROCESS_IN_BACKGROUND', () => (0, handle_process_in_background_1.handleProcessInBackground)(payload));
    }
    else if (payload.type === 'RECORD_OUTPUTS_HASH') {
        await handleResult(socket, 'RECORD_OUTPUTS_HASH', () => (0, handle_outputs_tracking_1.handleRecordOutputsHash)(payload));
    }
    else if (payload.type === 'OUTPUTS_HASHES_MATCH') {
        await handleResult(socket, 'OUTPUTS_HASHES_MATCH', () => (0, handle_outputs_tracking_1.handleOutputsHashesMatch)(payload));
    }
    else if (payload.type === 'REQUEST_SHUTDOWN') {
        await handleResult(socket, 'REQUEST_SHUTDOWN', () => (0, handle_request_shutdown_1.handleRequestShutdown)(server, numberOfOpenConnections));
    }
    else if (payload.type === 'REGISTER_FILE_WATCHER') {
        file_watcher_sockets_1.registeredFileWatcherSockets.push({ socket, config: payload.config });
    }
    else if ((0, glob_1.isHandleGlobMessage)(payload)) {
        await handleResult(socket, glob_1.GLOB, () => (0, handle_glob_1.handleGlob)(payload.globs, payload.exclude));
    }
    else if ((0, get_nx_workspace_files_1.isHandleNxWorkspaceFilesMessage)(payload)) {
        await handleResult(socket, get_nx_workspace_files_1.GET_NX_WORKSPACE_FILES, () => (0, handle_nx_workspace_files_1.handleNxWorkspaceFiles)(payload.projectRootMap));
    }
    else if ((0, get_files_in_directory_1.isHandleGetFilesInDirectoryMessage)(payload)) {
        await handleResult(socket, get_files_in_directory_1.GET_FILES_IN_DIRECTORY, () => (0, handle_get_files_in_directory_1.handleGetFilesInDirectory)(payload.dir));
    }
    else if ((0, get_context_file_data_1.isHandleContextFileDataMessage)(payload)) {
        await handleResult(socket, get_context_file_data_1.GET_CONTEXT_FILE_DATA, () => (0, handle_context_file_data_1.handleContextFileData)());
    }
    else if ((0, hash_glob_1.isHandleHashGlobMessage)(payload)) {
        await handleResult(socket, hash_glob_1.HASH_GLOB, () => (0, handle_hash_glob_1.handleHashGlob)(payload.globs, payload.exclude));
    }
    else if ((0, task_history_1.isHandleGetFlakyTasksMessage)(payload)) {
        await handleResult(socket, task_history_1.GET_FLAKY_TASKS, () => (0, handle_task_history_1.handleGetFlakyTasks)(payload.hashes));
    }
    else if ((0, task_history_1.isHandleGetEstimatedTaskTimings)(payload)) {
        await handleResult(socket, task_history_1.GET_ESTIMATED_TASK_TIMINGS, () => (0, handle_task_history_1.handleGetEstimatedTaskTimings)(payload.targets));
    }
    else if ((0, task_history_1.isHandleWriteTaskRunsToHistoryMessage)(payload)) {
        await handleResult(socket, task_history_1.RECORD_TASK_RUNS, () => (0, handle_task_history_1.handleRecordTaskRuns)(payload.taskRuns));
    }
    else if ((0, force_shutdown_1.isHandleForceShutdownMessage)(payload)) {
        await handleResult(socket, 'FORCE_SHUTDOWN', () => (0, handle_force_shutdown_1.handleForceShutdown)(server));
    }
    else if ((0, get_sync_generator_changes_1.isHandleGetSyncGeneratorChangesMessage)(payload)) {
        await handleResult(socket, get_sync_generator_changes_1.GET_SYNC_GENERATOR_CHANGES, () => (0, handle_get_sync_generator_changes_1.handleGetSyncGeneratorChanges)(payload.generators));
    }
    else if ((0, flush_sync_generator_changes_to_disk_1.isHandleFlushSyncGeneratorChangesToDiskMessage)(payload)) {
        await handleResult(socket, flush_sync_generator_changes_to_disk_1.FLUSH_SYNC_GENERATOR_CHANGES_TO_DISK, () => (0, handle_flush_sync_generator_changes_to_disk_1.handleFlushSyncGeneratorChangesToDisk)(payload.generators));
    }
    else if ((0, get_registered_sync_generators_1.isHandleGetRegisteredSyncGeneratorsMessage)(payload)) {
        await handleResult(socket, get_registered_sync_generators_1.GET_REGISTERED_SYNC_GENERATORS, () => (0, handle_get_registered_sync_generators_1.handleGetRegisteredSyncGenerators)());
    }
    else if ((0, update_workspace_context_1.isHandleUpdateWorkspaceContextMessage)(payload)) {
        await handleResult(socket, update_workspace_context_1.UPDATE_WORKSPACE_CONTEXT, () => (0, handle_update_workspace_context_1.handleUpdateWorkspaceContext)(payload.createdFiles, payload.updatedFiles, payload.deletedFiles));
    }
    else {
        await (0, shutdown_utils_1.respondWithErrorAndExit)(socket, `Invalid payload from the client`, new Error(`Unsupported payload sent to daemon server: ${unparsedPayload}`));
    }
}
async function handleResult(socket, type, hrFn) {
    const startMark = new Date();
    const hr = await hrFn();
    const doneHandlingMark = new Date();
    if (hr.error) {
        await (0, shutdown_utils_1.respondWithErrorAndExit)(socket, hr.description, hr.error);
    }
    else {
        await (0, shutdown_utils_1.respondToClient)(socket, hr.response, hr.description);
    }
    const endMark = new Date();
    logger_1.serverLogger.log(`Handled ${type}. Handling time: ${doneHandlingMark.getTime() - startMark.getTime()}. Response time: ${endMark.getTime() - doneHandlingMark.getTime()}.`);
}
function handleInactivityTimeout() {
    if (numberOfOpenConnections > 0) {
        logger_1.serverLogger.log(`There are ${numberOfOpenConnections} open connections. Reset inactivity timer.`);
        (0, shutdown_utils_1.resetInactivityTimeout)(handleInactivityTimeout);
    }
    else {
        (0, shutdown_utils_1.handleServerProcessTermination)({
            server,
            reason: `${shutdown_utils_1.SERVER_INACTIVITY_TIMEOUT_MS}ms of inactivity`,
            sockets: exports.openSockets,
        });
    }
}
function registerProcessTerminationListeners() {
    process
        .on('SIGINT', () => (0, shutdown_utils_1.handleServerProcessTermination)({
        server,
        reason: 'received process SIGINT',
        sockets: exports.openSockets,
    }))
        .on('SIGTERM', () => (0, shutdown_utils_1.handleServerProcessTermination)({
        server,
        reason: 'received process SIGTERM',
        sockets: exports.openSockets,
    }))
        .on('SIGHUP', () => (0, shutdown_utils_1.handleServerProcessTermination)({
        server,
        reason: 'received process SIGHUP',
        sockets: exports.openSockets,
    }));
}
let existingLockHash;
function daemonIsOutdated() {
    if (nxVersionChanged()) {
        return 'NX_VERSION_CHANGED';
    }
    else if (lockFileHashChanged()) {
        return 'LOCK_FILES_CHANGED';
    }
    return null;
}
function nxVersionChanged() {
    return versions_1.nxVersion !== getInstalledNxVersion();
}
const nxPackageJsonPath = require.resolve('nx/package.json');
function getInstalledNxVersion() {
    try {
        const { version } = (0, fileutils_1.readJsonFile)(nxPackageJsonPath);
        return version;
    }
    catch (e) {
        // node modules are absent, so we can return null, which would shut down the daemon
        return null;
    }
}
function lockFileHashChanged() {
    const lockHashes = [
        (0, path_1.join)(workspace_root_1.workspaceRoot, 'package-lock.json'),
        (0, path_1.join)(workspace_root_1.workspaceRoot, 'yarn.lock'),
        (0, path_1.join)(workspace_root_1.workspaceRoot, 'pnpm-lock.yaml'),
        (0, path_1.join)(workspace_root_1.workspaceRoot, 'bun.lockb'),
    ]
        .filter((file) => (0, fs_1.existsSync)(file))
        .map((file) => (0, native_1.hashFile)(file));
    const newHash = (0, file_hasher_1.hashArray)(lockHashes);
    if (existingLockHash && newHash != existingLockHash) {
        existingLockHash = newHash;
        return true;
    }
    else {
        existingLockHash = newHash;
        return false;
    }
}
/**
 * When applicable files in the workspaces are changed (created, updated, deleted),
 * we need to recompute the cached serialized project graph so that it is readily
 * available for the next client request to the server.
 */
const handleWorkspaceChanges = async (err, changeEvents) => {
    if (workspaceWatcherError) {
        logger_1.serverLogger.watcherLog('Skipping handleWorkspaceChanges because of a previously recorded watcher error.');
        return;
    }
    try {
        (0, shutdown_utils_1.resetInactivityTimeout)(handleInactivityTimeout);
        const outdatedReason = daemonIsOutdated();
        if (outdatedReason) {
            await (0, shutdown_utils_1.handleServerProcessTermination)({
                server,
                reason: outdatedReason,
                sockets: exports.openSockets,
            });
            return;
        }
        if (err) {
            let error = typeof err === 'string' ? new Error(err) : err;
            logger_1.serverLogger.watcherLog('Unexpected workspace watcher error', error.message);
            console.error(error);
            workspaceWatcherError = error;
            return;
        }
        logger_1.serverLogger.watcherLog((0, watcher_1.convertChangeEventsToLogMessage)(changeEvents));
        const updatedFilesToHash = [];
        const createdFilesToHash = [];
        const deletedFiles = [];
        for (const event of changeEvents) {
            if (event.type === 'delete') {
                deletedFiles.push(event.path);
            }
            else {
                try {
                    const s = (0, fs_1.statSync)((0, path_1.join)(workspace_root_1.workspaceRoot, event.path));
                    if (s.isFile()) {
                        if (event.type === 'update') {
                            updatedFilesToHash.push(event.path);
                        }
                        else {
                            createdFilesToHash.push(event.path);
                        }
                    }
                }
                catch (e) {
                    // this can happen when the update file was deleted right after
                }
            }
        }
        (0, project_graph_incremental_recomputation_1.addUpdatedAndDeletedFiles)(createdFilesToHash, updatedFilesToHash, deletedFiles);
    }
    catch (err) {
        logger_1.serverLogger.watcherLog(`Unexpected workspace error`, err.message);
        console.error(err);
        workspaceWatcherError = err;
    }
};
const handleOutputsChanges = async (err, changeEvents) => {
    try {
        if (err || !changeEvents || !changeEvents.length) {
            let error = typeof err === 'string' ? new Error(err) : err;
            logger_1.serverLogger.watcherLog('Unexpected outputs watcher error', error.message);
            console.error(error);
            outputsWatcherError = error;
            (0, outputs_tracking_1.disableOutputsTracking)();
            return;
        }
        if (outputsWatcherError) {
            return;
        }
        logger_1.serverLogger.watcherLog('Processing file changes in outputs');
        (0, outputs_tracking_1.processFileChangesInOutputs)(changeEvents);
    }
    catch (err) {
        logger_1.serverLogger.watcherLog(`Unexpected outputs watcher error`, err.message);
        console.error(err);
        outputsWatcherError = err;
        (0, outputs_tracking_1.disableOutputsTracking)();
    }
};
async function startServer() {
    (0, workspace_context_1.setupWorkspaceContext)(workspace_root_1.workspaceRoot);
    // Persist metadata about the background process so that it can be cleaned up later if needed
    await (0, cache_1.writeDaemonJsonProcessCache)({
        processId: process.pid,
    });
    // See notes in socket-command-line-utils.ts on OS differences regarding clean up of existings connections.
    if (!socket_utils_1.isWindows) {
        (0, socket_utils_1.killSocketOrPath)();
    }
    return new Promise(async (resolve, reject) => {
        try {
            server.listen((0, socket_utils_1.getFullOsSocketPath)(), async () => {
                try {
                    logger_1.serverLogger.log(`Started listening on: ${(0, socket_utils_1.getFullOsSocketPath)()}`);
                    setInterval(() => {
                        if ((0, cache_1.getDaemonProcessIdSync)() !== process.pid) {
                            return (0, shutdown_utils_1.handleServerProcessTermination)({
                                server,
                                reason: 'this process is no longer the current daemon (native)',
                                sockets: exports.openSockets,
                            });
                        }
                    }).unref();
                    // this triggers the storage of the lock file hash
                    daemonIsOutdated();
                    if (!(0, shutdown_utils_1.getWatcherInstance)()) {
                        (0, shutdown_utils_1.storeWatcherInstance)(await (0, watcher_1.watchWorkspace)(server, handleWorkspaceChanges));
                        logger_1.serverLogger.watcherLog(`Subscribed to changes within: ${workspace_root_1.workspaceRoot} (native)`);
                    }
                    if (!(0, shutdown_utils_1.getOutputWatcherInstance)()) {
                        (0, shutdown_utils_1.storeOutputWatcherInstance)(await (0, watcher_1.watchOutputFiles)(server, handleOutputsChanges));
                    }
                    // listen for project graph recomputation events to collect and schedule sync generators
                    (0, project_graph_incremental_recomputation_1.registerProjectGraphRecomputationListener)(sync_generators_1.collectAndScheduleSyncGenerators);
                    // trigger an initial project graph recomputation
                    (0, project_graph_incremental_recomputation_1.addUpdatedAndDeletedFiles)([], [], []);
                    return resolve(server);
                }
                catch (err) {
                    await handleWorkspaceChanges(err, []);
                }
            });
        }
        catch (err) {
            reject(err);
        }
    });
}
