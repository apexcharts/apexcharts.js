"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateDaemonHelpOutput = generateDaemonHelpOutput;
const child_process_1 = require("child_process");
const cache_1 = require("../cache");
const tmp_dir_1 = require("../tmp-dir");
function generateDaemonHelpOutput() {
    /**
     * A workaround for cases such as yargs output where we need to synchronously
     * get the value of this async operation.
     */
    const res = (0, child_process_1.spawnSync)(process.execPath, ['./exec-is-server-available.js'], {
        cwd: __dirname,
        windowsHide: false,
    });
    const isServerAvailable = res?.stdout?.toString().trim().indexOf('true') > -1;
    if (!isServerAvailable) {
        return 'Nx Daemon is not running.';
    }
    const pid = (0, cache_1.getDaemonProcessIdSync)();
    return `Nx Daemon is currently running:
  - Logs: ${tmp_dir_1.DAEMON_OUTPUT_LOG_FILE}${pid
        ? `
  - Process ID: ${pid}`
        : ''}`;
}
