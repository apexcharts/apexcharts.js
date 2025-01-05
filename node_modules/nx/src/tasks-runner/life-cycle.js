"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompositeLifeCycle = void 0;
class CompositeLifeCycle {
    constructor(lifeCycles) {
        this.lifeCycles = lifeCycles;
    }
    async startCommand() {
        for (let l of this.lifeCycles) {
            if (l.startCommand) {
                await l.startCommand();
            }
        }
    }
    async endCommand() {
        for (let l of this.lifeCycles) {
            if (l.endCommand) {
                await l.endCommand();
            }
        }
    }
    async scheduleTask(task) {
        for (let l of this.lifeCycles) {
            if (l.scheduleTask) {
                await l.scheduleTask(task);
            }
        }
    }
    startTask(task) {
        for (let l of this.lifeCycles) {
            if (l.startTask) {
                l.startTask(task);
            }
        }
    }
    endTask(task, code) {
        for (let l of this.lifeCycles) {
            if (l.endTask) {
                l.endTask(task, code);
            }
        }
    }
    async startTasks(tasks, metadata) {
        for (let l of this.lifeCycles) {
            if (l.startTasks) {
                await l.startTasks(tasks, metadata);
            }
            else if (l.startTask) {
                tasks.forEach((t) => l.startTask(t));
            }
        }
    }
    async endTasks(taskResults, metadata) {
        for (let l of this.lifeCycles) {
            if (l.endTasks) {
                await l.endTasks(taskResults, metadata);
            }
            else if (l.endTask) {
                taskResults.forEach((t) => l.endTask(t.task, t.code));
            }
        }
    }
    printTaskTerminalOutput(task, status, output) {
        for (let l of this.lifeCycles) {
            if (l.printTaskTerminalOutput) {
                l.printTaskTerminalOutput(task, status, output);
            }
        }
    }
}
exports.CompositeLifeCycle = CompositeLifeCycle;
