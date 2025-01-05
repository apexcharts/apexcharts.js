"use strict";
/**
 * To improve the overall readibility of the logs, we categorize things by "trigger":
 *
 * - [REQUEST] meaning that the current set of actions were triggered by a client request to the server
 * - [WATCHER] meaning the the current set of actions were triggered by handling changes to the workspace files
 *
 * We keep those two "triggers" left aligned at the top level and then indent subsequent logs so that there is a
 * logical hierarchy/grouping.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.serverLogger = void 0;
class ServerLogger {
    log(...s) {
        console.log(this.formatLogMessage(`${s
            .map((val) => {
            if (typeof val === 'string') {
                return val;
            }
            return JSON.stringify(val);
        })
            .join(' ')}`));
    }
    requestLog(...s) {
        this.log(`[REQUEST]: ${s.join(' ')}`);
    }
    watcherLog(...s) {
        this.log(`[WATCHER]: ${s.join(' ')}`);
    }
    formatLogMessage(message) {
        return `[NX Daemon Server] - ${this.getNow()} - ${message}`;
    }
    getNow() {
        return new Date(Date.now()).toISOString();
    }
}
exports.serverLogger = new ServerLogger();
