"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runTasksInSerial = runTasksInSerial;
/**
 * Run tasks in serial
 *
 * @param tasks The tasks to run in serial.
 */
function runTasksInSerial(...tasks) {
    return async () => {
        for (const task of tasks) {
            await task();
        }
    };
}
