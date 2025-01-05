"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskHistoryLifeCycle = void 0;
const serialize_target_1 = require("../../utils/serialize-target");
const output_1 = require("../../utils/output");
const task_history_1 = require("../../utils/task-history");
class TaskHistoryLifeCycle {
    constructor() {
        this.startTimings = {};
        this.taskRuns = new Map();
        this.taskHistory = (0, task_history_1.getTaskHistory)();
    }
    startTasks(tasks) {
        for (let task of tasks) {
            this.startTimings[task.id] = new Date().getTime();
        }
    }
    async endTasks(taskResults) {
        taskResults
            .map((taskResult) => ({
            hash: taskResult.task.hash,
            target: taskResult.task.target,
            code: taskResult.code,
            status: taskResult.status,
            start: taskResult.task.startTime ?? this.startTimings[taskResult.task.id],
            end: taskResult.task.endTime ?? Date.now(),
        }))
            .forEach((taskRun) => {
            this.taskRuns.set(taskRun.hash, taskRun);
        });
    }
    async endCommand() {
        const entries = Array.from(this.taskRuns);
        if (!this.taskHistory) {
            return;
        }
        await this.taskHistory.recordTaskRuns(entries.map(([_, v]) => v));
        const flakyTasks = await this.taskHistory.getFlakyTasks(entries.map(([hash]) => hash));
        if (flakyTasks.length > 0) {
            output_1.output.warn({
                title: `Nx detected ${flakyTasks.length === 1 ? 'a flaky task' : ' flaky tasks'}`,
                bodyLines: [
                    ,
                    ...flakyTasks.map((hash) => {
                        const taskRun = this.taskRuns.get(hash);
                        return `  ${(0, serialize_target_1.serializeTarget)(taskRun.target.project, taskRun.target.target, taskRun.target.configuration)}`;
                    }),
                    '',
                    `Flaky tasks can disrupt your CI pipeline. Automatically retry them with Nx Cloud. Learn more at https://nx.dev/ci/features/flaky-tasks`,
                ],
            });
        }
    }
}
exports.TaskHistoryLifeCycle = TaskHistoryLifeCycle;
