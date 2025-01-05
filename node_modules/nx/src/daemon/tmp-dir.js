"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDaemonSocketDir = exports.DAEMON_OUTPUT_LOG_FILE = exports.DAEMON_DIR_FOR_CURRENT_WORKSPACE = void 0;
exports.writeDaemonLogs = writeDaemonLogs;
exports.markDaemonAsDisabled = markDaemonAsDisabled;
exports.isDaemonDisabled = isDaemonDisabled;
exports.getSocketDir = getSocketDir;
exports.removeSocketDir = removeSocketDir;
/**
 * Per workspace (to avoid subtle differences and issues), we want to have a deterministic
 * location within the OS's tmp directory where we write log files for background processes
 * and where we create the actual unix socket/named pipe for the daemon.
 */
const node_fs_1 = require("node:fs");
const path_1 = require("path");
const cache_directory_1 = require("../utils/cache-directory");
const crypto_1 = require("crypto");
const tmp_1 = require("tmp");
const workspace_root_1 = require("../utils/workspace-root");
exports.DAEMON_DIR_FOR_CURRENT_WORKSPACE = (0, path_1.join)(cache_directory_1.workspaceDataDirectory, 'd');
exports.DAEMON_OUTPUT_LOG_FILE = (0, path_1.join)(exports.DAEMON_DIR_FOR_CURRENT_WORKSPACE, 'daemon.log');
const getDaemonSocketDir = () => (0, path_1.join)(getSocketDir(), 
// As per notes above on socket/named pipe length limitations, we keep this intentionally short
'd.sock');
exports.getDaemonSocketDir = getDaemonSocketDir;
function writeDaemonLogs(error) {
    const file = (0, path_1.join)(exports.DAEMON_DIR_FOR_CURRENT_WORKSPACE, 'daemon-error.log');
    (0, node_fs_1.writeFileSync)(file, error);
    return file;
}
function markDaemonAsDisabled() {
    (0, node_fs_1.writeFileSync)((0, path_1.join)(exports.DAEMON_DIR_FOR_CURRENT_WORKSPACE, 'disabled'), 'true');
}
function isDaemonDisabled() {
    try {
        (0, node_fs_1.statSync)((0, path_1.join)(exports.DAEMON_DIR_FOR_CURRENT_WORKSPACE, 'disabled'));
        return true;
    }
    catch (e) {
        return false;
    }
}
function socketDirName() {
    const hasher = (0, crypto_1.createHash)('sha256');
    hasher.update(workspace_root_1.workspaceRoot.toLowerCase());
    const unique = hasher.digest('hex').substring(0, 20);
    return (0, path_1.join)(tmp_1.tmpdir, unique);
}
/**
 * We try to create a socket file in a tmp dir, but if it doesn't work because
 * for instance we don't have permissions, we create it in DAEMON_DIR_FOR_CURRENT_WORKSPACE
 */
function getSocketDir(alreadyUnique = false) {
    try {
        const dir = process.env.NX_SOCKET_DIR ??
            process.env.NX_DAEMON_SOCKET_DIR ??
            (alreadyUnique ? tmp_1.tmpdir : socketDirName());
        (0, node_fs_1.mkdirSync)(dir, { recursive: true });
        return dir;
    }
    catch (e) {
        return exports.DAEMON_DIR_FOR_CURRENT_WORKSPACE;
    }
}
function removeSocketDir() {
    try {
        (0, node_fs_1.rmSync)(getSocketDir(), { recursive: true, force: true });
    }
    catch (e) { }
}
