"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultTasksRunner = exports.RemoteCacheV2 = void 0;
const task_orchestrator_1 = require("./task-orchestrator");
const cache_directory_1 = require("../utils/cache-directory");
const promises_1 = require("fs/promises");
const path_1 = require("path");
class RemoteCacheV2 {
    static async fromCacheV1(cache) {
        await (0, promises_1.mkdir)((0, path_1.join)(cache_directory_1.cacheDir, 'terminalOutputs'), { recursive: true });
        return {
            retrieve: async (hash, cacheDirectory) => {
                const res = await cache.retrieve(hash, cacheDirectory);
                if (res) {
                    const [terminalOutput, oldTerminalOutput, code] = await Promise.all([
                        (0, promises_1.readFile)((0, path_1.join)(cacheDirectory, hash, 'terminalOutputs'), 'utf-8').catch(() => null),
                        (0, promises_1.readFile)((0, path_1.join)(cache_directory_1.cacheDir, 'terminalOutputs', hash), 'utf-8').catch(() => null),
                        (0, promises_1.readFile)((0, path_1.join)(cacheDirectory, hash, 'code'), 'utf-8').then((s) => +s),
                    ]);
                    return {
                        outputsPath: cacheDirectory,
                        terminalOutput: terminalOutput ?? oldTerminalOutput,
                        code,
                    };
                }
                else {
                    return null;
                }
            },
            store: async (hash, cacheDirectory, __, code) => {
                await (0, promises_1.writeFile)((0, path_1.join)(cacheDirectory, hash, 'code'), code.toString());
                return cache.store(hash, cacheDirectory);
            },
        };
    }
}
exports.RemoteCacheV2 = RemoteCacheV2;
const defaultTasksRunner = async (tasks, options, context) => {
    if (options['parallel'] === 'false' ||
        options['parallel'] === false) {
        options['parallel'] = 1;
    }
    else if (options['parallel'] === 'true' ||
        options['parallel'] === true ||
        options['parallel'] === undefined ||
        options['parallel'] === '') {
        options['parallel'] = Number(options['maxParallel'] || 3);
    }
    await options.lifeCycle.startCommand();
    try {
        return await runAllTasks(tasks, options, context);
    }
    finally {
        await options.lifeCycle.endCommand();
    }
};
exports.defaultTasksRunner = defaultTasksRunner;
async function runAllTasks(tasks, options, context) {
    const orchestrator = new task_orchestrator_1.TaskOrchestrator(context.hasher, context.initiatingProject, context.projectGraph, context.taskGraph, context.nxJson, options, context.nxArgs?.nxBail, context.daemon, context.nxArgs?.outputStyle);
    return orchestrator.run();
}
exports.default = exports.defaultTasksRunner;
