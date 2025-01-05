"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serverProcessJsonPath = void 0;
exports.readDaemonProcessJsonCache = readDaemonProcessJsonCache;
exports.deleteDaemonJsonProcessCache = deleteDaemonJsonProcessCache;
exports.writeDaemonJsonProcessCache = writeDaemonJsonProcessCache;
exports.waitForDaemonToExitAndCleanupProcessJson = waitForDaemonToExitAndCleanupProcessJson;
exports.getDaemonProcessIdSync = getDaemonProcessIdSync;
const node_fs_1 = require("node:fs");
const path_1 = require("path");
const tmp_dir_1 = require("./tmp-dir");
const fileutils_1 = require("../utils/fileutils");
exports.serverProcessJsonPath = (0, path_1.join)(tmp_dir_1.DAEMON_DIR_FOR_CURRENT_WORKSPACE, 'server-process.json');
function readDaemonProcessJsonCache() {
    if (!(0, node_fs_1.existsSync)(exports.serverProcessJsonPath)) {
        return null;
    }
    return (0, fileutils_1.readJsonFile)(exports.serverProcessJsonPath);
}
function deleteDaemonJsonProcessCache() {
    try {
        if (getDaemonProcessIdSync() === process.pid) {
            (0, node_fs_1.unlinkSync)(exports.serverProcessJsonPath);
        }
    }
    catch { }
}
async function writeDaemonJsonProcessCache(daemonJson) {
    await (0, fileutils_1.writeJsonFileAsync)(exports.serverProcessJsonPath, daemonJson, {
        appendNewLine: true,
    });
}
async function waitForDaemonToExitAndCleanupProcessJson() {
    const daemonProcessJson = readDaemonProcessJsonCache();
    if (daemonProcessJson && daemonProcessJson.processId) {
        await new Promise((resolve, reject) => {
            let count = 0;
            const interval = setInterval(() => {
                try {
                    // sending a signal 0 to a process checks if the process is running instead of actually killing it
                    process.kill(daemonProcessJson.processId, 0);
                }
                catch (e) {
                    clearInterval(interval);
                    resolve();
                }
                if ((count += 1) > 200) {
                    clearInterval(interval);
                    reject(`Daemon process ${daemonProcessJson.processId} didn't exit after 2 seconds.`);
                }
            }, 10);
        });
        deleteDaemonJsonProcessCache();
    }
}
// Must be sync for the help output use case
function getDaemonProcessIdSync() {
    if (!(0, node_fs_1.existsSync)(exports.serverProcessJsonPath)) {
        return null;
    }
    try {
        const daemonProcessJson = (0, fileutils_1.readJsonFile)(exports.serverProcessJsonPath);
        return daemonProcessJson.processId;
    }
    catch {
        return null;
    }
}
