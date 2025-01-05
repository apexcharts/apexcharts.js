"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LegacyTaskHistoryLifeCycle = void 0;
const serialize_target_1 = require("../../utils/serialize-target");
const output_1 = require("../../utils/output");
const legacy_task_history_1 = require("../../utils/legacy-task-history");
class LegacyTaskHistoryLifeCycle {
    constructor() {
        this.startTimings = {};
        this.taskRuns = [];
    }
    startTasks(tasks) {
        for (let task of tasks) {
            this.startTimings[task.id] = new Date().getTime();
        }
    }
    async endTasks(taskResults) {
        const taskRuns = taskResults.map((taskResult) => ({
            project: taskResult.task.target.project,
            target: taskResult.task.target.target,
            configuration: taskResult.task.target.configuration,
            hash: taskResult.task.hash,
            code: taskResult.code.toString(),
            status: taskResult.status,
            start: (taskResult.task.startTime ?? this.startTimings[taskResult.task.id]).toString(),
            end: (taskResult.task.endTime ?? new Date().getTime()).toString(),
        }));
        this.taskRuns.push(...taskRuns);
    }
    async endCommand() {
        await (0, legacy_task_history_1.writeTaskRunsToHistory)(this.taskRuns);
        const history = await (0, legacy_task_history_1.getHistoryForHashes)(this.taskRuns.map((t) => t.hash));
        const flakyTasks = [];
        // check if any hash has different exit codes => flaky
        for (let hash in history) {
            if (history[hash].length > 1 &&
                history[hash].some((run) => run.code !== history[hash][0].code)) {
                flakyTasks.push((0, serialize_target_1.serializeTarget)(history[hash][0].project, history[hash][0].target, history[hash][0].configuration));
            }
        }
        if (flakyTasks.length > 0) {
            output_1.output.warn({
                title: `Nx detected ${flakyTasks.length === 1 ? 'a flaky task' : ' flaky tasks'}`,
                bodyLines: [
                    ,
                    ...flakyTasks.map((t) => `  ${t}`),
                    '',
                    `Flaky tasks can disrupt your CI pipeline. Automatically retry them with Nx Cloud. Learn more at https://nx.dev/ci/features/flaky-tasks`,
                ],
            });
        }
    }
}
exports.LegacyTaskHistoryLifeCycle = LegacyTaskHistoryLifeCycle;
