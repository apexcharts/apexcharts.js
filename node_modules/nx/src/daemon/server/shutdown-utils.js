"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SERVER_INACTIVITY_TIMEOUT_MS = void 0;
exports.storeWatcherInstance = storeWatcherInstance;
exports.getWatcherInstance = getWatcherInstance;
exports.storeOutputWatcherInstance = storeOutputWatcherInstance;
exports.getOutputWatcherInstance = getOutputWatcherInstance;
exports.handleServerProcessTermination = handleServerProcessTermination;
exports.resetInactivityTimeout = resetInactivityTimeout;
exports.respondToClient = respondToClient;
exports.respondWithErrorAndExit = respondWithErrorAndExit;
const workspace_root_1 = require("../../utils/workspace-root");
const logger_1 = require("./logger");
const socket_utils_1 = require("../socket-utils");
const cache_1 = require("../cache");
const error_types_1 = require("../../project-graph/error-types");
const db_connection_1 = require("../../utils/db-connection");
const get_plugins_1 = require("../../project-graph/plugins/get-plugins");
exports.SERVER_INACTIVITY_TIMEOUT_MS = 10800000; // 10800000 ms = 3 hours
let watcherInstance;
function storeWatcherInstance(instance) {
    watcherInstance = instance;
}
function getWatcherInstance() {
    return watcherInstance;
}
let outputWatcherInstance;
function storeOutputWatcherInstance(instance) {
    outputWatcherInstance = instance;
}
function getOutputWatcherInstance() {
    return outputWatcherInstance;
}
async function handleServerProcessTermination({ server, reason, sockets, }) {
    try {
        await new Promise((res) => {
            server.close(() => {
                res(null);
            });
            for (const socket of sockets) {
                socket.destroy();
            }
        });
        if (watcherInstance) {
            await watcherInstance.stop();
            logger_1.serverLogger.watcherLog(`Stopping the watcher for ${workspace_root_1.workspaceRoot} (sources)`);
        }
        if (outputWatcherInstance) {
            await outputWatcherInstance.stop();
            logger_1.serverLogger.watcherLog(`Stopping the watcher for ${workspace_root_1.workspaceRoot} (outputs)`);
        }
        (0, cache_1.deleteDaemonJsonProcessCache)();
        (0, get_plugins_1.cleanupPlugins)();
        (0, db_connection_1.removeDbConnections)();
        logger_1.serverLogger.log(`Server stopped because: "${reason}"`);
    }
    finally {
        process.exit(0);
    }
}
let serverInactivityTimerId;
function resetInactivityTimeout(cb) {
    if (serverInactivityTimerId) {
        clearTimeout(serverInactivityTimerId);
    }
    serverInactivityTimerId = setTimeout(cb, exports.SERVER_INACTIVITY_TIMEOUT_MS);
}
function respondToClient(socket, response, description) {
    return new Promise(async (res) => {
        if (description) {
            logger_1.serverLogger.requestLog(`Responding to the client.`, description);
        }
        socket.write(`${response}${String.fromCodePoint(4)}`, (err) => {
            if (err) {
                console.error(err);
            }
            logger_1.serverLogger.log(`Done responding to the client`, description);
            res(null);
        });
    });
}
async function respondWithErrorAndExit(socket, description, error) {
    const normalizedError = error instanceof error_types_1.DaemonProjectGraphError
        ? error_types_1.ProjectGraphError.fromDaemonProjectGraphError(error)
        : error;
    // print some extra stuff in the error message
    logger_1.serverLogger.requestLog(`Responding to the client with an error.`, description, normalizedError.message);
    console.error(normalizedError.stack);
    // Respond with the original error
    await respondToClient(socket, (0, socket_utils_1.serializeResult)(error, null, null), null);
}
