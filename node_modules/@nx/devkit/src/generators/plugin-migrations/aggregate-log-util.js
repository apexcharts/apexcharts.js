"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AggregatedLog = void 0;
const devkit_exports_1 = require("nx/src/devkit-exports");
/**
 * @example
 * // Instantiate a new object
 * const migrationLogs = new AggregatedLog();
 *
 * // Add logs
 * migrationLogs.addLog({executorName: '@nx/vite:build', project: 'app1', log: 'Migrate X manually'});
 *
 * // Flush all logs
 * migrationLogs.flushLogs()
 */
class AggregatedLog {
    constructor() {
        this.logs = new Map();
    }
    addLog({ project, log, executorName }) {
        if (!this.logs.has(executorName)) {
            this.logs.set(executorName, new Map());
        }
        const executorLogs = this.logs.get(executorName);
        if (!executorLogs.has(log)) {
            executorLogs.set(log, { log, projects: new Set([project]) });
        }
        else {
            const logItem = executorLogs.get(log);
            logItem.projects.add(project);
        }
    }
    reset() {
        this.logs.clear();
    }
    flushLogs() {
        if (this.logs.size === 0) {
            return;
        }
        let fullLog = '';
        for (const executorName of this.logs.keys()) {
            fullLog = `${fullLog}${devkit_exports_1.output.bold(`Encountered the following while migrating '${executorName}':\r\n`)}`;
            for (const logItem of this.logs.get(executorName).values()) {
                fullLog = `${fullLog}   • ${logItem.log}\r\n`;
                fullLog = `${fullLog}     ${devkit_exports_1.output.bold(`Affected Projects`)}\r\n`;
                fullLog = `${fullLog}      ${Array.from(logItem.projects.values()).join(`\r\n      `)}`;
                fullLog = `${fullLog}\r\n`;
            }
        }
        devkit_exports_1.logger.warn(fullLog);
        this.reset();
    }
}
exports.AggregatedLog = AggregatedLog;
