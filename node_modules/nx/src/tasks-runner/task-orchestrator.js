"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskOrchestrator = void 0;
const events_1 = require("events");
const perf_hooks_1 = require("perf_hooks");
const path_1 = require("path");
const fs_1 = require("fs");
const run_commands_impl_1 = require("../executors/run-commands/run-commands.impl");
const forked_process_task_runner_1 = require("./forked-process-task-runner");
const cache_1 = require("./cache");
const utils_1 = require("./utils");
const tasks_schedule_1 = require("./tasks-schedule");
const hash_task_1 = require("../hasher/hash-task");
const task_env_1 = require("./task-env");
const workspace_root_1 = require("../utils/workspace-root");
const output_1 = require("../utils/output");
const params_1 = require("../utils/params");
class TaskOrchestrator {
    // endregion internal state
    constructor(hasher, initiatingProject, projectGraph, taskGraph, nxJson, options, bail, daemon, outputStyle) {
        this.hasher = hasher;
        this.initiatingProject = initiatingProject;
        this.projectGraph = projectGraph;
        this.taskGraph = taskGraph;
        this.nxJson = nxJson;
        this.options = options;
        this.bail = bail;
        this.daemon = daemon;
        this.outputStyle = outputStyle;
        this.taskDetails = (0, hash_task_1.getTaskDetails)();
        this.cache = (0, cache_1.getCache)(this.options);
        this.forkedProcessTaskRunner = new forked_process_task_runner_1.ForkedProcessTaskRunner(this.options);
        this.tasksSchedule = new tasks_schedule_1.TasksSchedule(this.projectGraph, this.taskGraph, this.options);
        // region internal state
        this.batchEnv = (0, task_env_1.getEnvVariablesForBatchProcess)(this.options.skipNxCache, this.options.captureStderr);
        this.reverseTaskDeps = (0, utils_1.calculateReverseDeps)(this.taskGraph);
        this.processedTasks = new Map();
        this.processedBatches = new Map();
        this.completedTasks = {};
        this.waitingForTasks = [];
        this.groups = [];
        this.bailed = false;
    }
    async run() {
        // Init the ForkedProcessTaskRunner, TasksSchedule, and Cache
        await Promise.all([
            this.forkedProcessTaskRunner.init(),
            this.tasksSchedule.init(),
            'init' in this.cache ? this.cache.init() : null,
        ]);
        // initial scheduling
        await this.tasksSchedule.scheduleNextTasks();
        perf_hooks_1.performance.mark('task-execution:start');
        const threads = [];
        process.stdout.setMaxListeners(this.options.parallel + events_1.defaultMaxListeners);
        process.stderr.setMaxListeners(this.options.parallel + events_1.defaultMaxListeners);
        // initial seeding of the queue
        for (let i = 0; i < this.options.parallel; ++i) {
            threads.push(this.executeNextBatchOfTasksUsingTaskSchedule());
        }
        await Promise.all(threads);
        perf_hooks_1.performance.mark('task-execution:end');
        perf_hooks_1.performance.measure('task-execution', 'task-execution:start', 'task-execution:end');
        this.cache.removeOldCacheRecords();
        return this.completedTasks;
    }
    async executeNextBatchOfTasksUsingTaskSchedule() {
        // completed all the tasks
        if (!this.tasksSchedule.hasTasks() || this.bailed) {
            return null;
        }
        const doNotSkipCache = this.options.skipNxCache === false ||
            this.options.skipNxCache === undefined;
        this.processAllScheduledTasks();
        const batch = this.tasksSchedule.nextBatch();
        if (batch) {
            const groupId = this.closeGroup();
            await this.applyFromCacheOrRunBatch(doNotSkipCache, batch, groupId);
            this.openGroup(groupId);
            return this.executeNextBatchOfTasksUsingTaskSchedule();
        }
        const task = this.tasksSchedule.nextTask();
        if (task) {
            const groupId = this.closeGroup();
            await this.applyFromCacheOrRunTask(doNotSkipCache, task, groupId);
            this.openGroup(groupId);
            return this.executeNextBatchOfTasksUsingTaskSchedule();
        }
        // block until some other task completes, then try again
        return new Promise((res) => this.waitingForTasks.push(res)).then(() => this.executeNextBatchOfTasksUsingTaskSchedule());
    }
    // region Processing Scheduled Tasks
    async processScheduledTask(taskId) {
        const task = this.taskGraph.tasks[taskId];
        const taskSpecificEnv = (0, task_env_1.getTaskSpecificEnv)(task);
        if (!task.hash) {
            await (0, hash_task_1.hashTask)(this.hasher, this.projectGraph, this.taskGraph, task, taskSpecificEnv, this.taskDetails);
        }
        await this.options.lifeCycle.scheduleTask(task);
        return taskSpecificEnv;
    }
    async processScheduledBatch(batch) {
        await Promise.all(Object.values(batch.taskGraph.tasks).map(async (task) => {
            if (!task.hash) {
                await (0, hash_task_1.hashTask)(this.hasher, this.projectGraph, this.taskGraph, task, this.batchEnv, this.taskDetails);
            }
            await this.options.lifeCycle.scheduleTask(task);
        }));
    }
    processAllScheduledTasks() {
        const { scheduledTasks, scheduledBatches } = this.tasksSchedule.getAllScheduledTasks();
        for (const batch of scheduledBatches) {
            this.processedBatches.set(batch, this.processScheduledBatch(batch));
        }
        for (const taskId of scheduledTasks) {
            // Task is already handled or being handled
            if (!this.processedTasks.has(taskId)) {
                this.processedTasks.set(taskId, this.processScheduledTask(taskId));
            }
        }
    }
    // endregion Processing Scheduled Tasks
    // region Applying Cache
    async applyCachedResults(tasks) {
        const cacheableTasks = tasks.filter((t) => (0, utils_1.isCacheableTask)(t, this.options));
        const res = await Promise.all(cacheableTasks.map((t) => this.applyCachedResult(t)));
        return res.filter((r) => r !== null);
    }
    async applyCachedResult(task) {
        task.startTime = Date.now();
        const cachedResult = await this.cache.get(task);
        if (!cachedResult || cachedResult.code !== 0)
            return null;
        const outputs = task.outputs;
        const shouldCopyOutputsFromCache = !!outputs.length &&
            (await this.shouldCopyOutputsFromCache(outputs, task.hash));
        if (shouldCopyOutputsFromCache) {
            await this.cache.copyFilesFromCache(task.hash, cachedResult, outputs);
        }
        task.endTime = Date.now();
        const status = cachedResult.remote
            ? 'remote-cache'
            : shouldCopyOutputsFromCache
                ? 'local-cache'
                : 'local-cache-kept-existing';
        this.options.lifeCycle.printTaskTerminalOutput(task, status, cachedResult.terminalOutput);
        return {
            task,
            status,
        };
    }
    // endregion Applying Cache
    // region Batch
    async applyFromCacheOrRunBatch(doNotSkipCache, batch, groupId) {
        const taskEntries = Object.entries(batch.taskGraph.tasks);
        const tasks = taskEntries.map(([, task]) => task);
        // Wait for batch to be processed
        await this.processedBatches.get(batch);
        await this.preRunSteps(tasks, { groupId });
        let results = doNotSkipCache ? await this.applyCachedResults(tasks) : [];
        // Run tasks that were not cached
        if (results.length !== taskEntries.length) {
            const unrunTaskGraph = (0, utils_1.removeTasksFromTaskGraph)(batch.taskGraph, results.map(({ task }) => task.id));
            const batchResults = await this.runBatch({
                executorName: batch.executorName,
                taskGraph: unrunTaskGraph,
            }, this.batchEnv);
            results.push(...batchResults);
        }
        await this.postRunSteps(tasks, results, doNotSkipCache, { groupId });
        const tasksCompleted = taskEntries.filter(([taskId]) => this.completedTasks[taskId]);
        // Batch is still not done, run it again
        if (tasksCompleted.length !== taskEntries.length) {
            await this.applyFromCacheOrRunBatch(doNotSkipCache, {
                executorName: batch.executorName,
                taskGraph: (0, utils_1.removeTasksFromTaskGraph)(batch.taskGraph, tasksCompleted.map(([taskId]) => taskId)),
            }, groupId);
        }
    }
    async runBatch(batch, env) {
        try {
            const results = await this.forkedProcessTaskRunner.forkProcessForBatch(batch, this.taskGraph, env);
            const batchResultEntries = Object.entries(results);
            return batchResultEntries.map(([taskId, result]) => ({
                ...result,
                task: {
                    ...this.taskGraph.tasks[taskId],
                    startTime: result.startTime,
                    endTime: result.endTime,
                },
                status: (result.success ? 'success' : 'failure'),
                terminalOutput: result.terminalOutput,
            }));
        }
        catch (e) {
            return batch.taskGraph.roots.map((rootTaskId) => ({
                task: this.taskGraph.tasks[rootTaskId],
                status: 'failure',
            }));
        }
    }
    // endregion Batch
    // region Single Task
    async applyFromCacheOrRunTask(doNotSkipCache, task, groupId) {
        // Wait for task to be processed
        const taskSpecificEnv = await this.processedTasks.get(task.id);
        await this.preRunSteps([task], { groupId });
        const pipeOutput = await this.pipeOutputCapture(task);
        // obtain metadata
        const temporaryOutputPath = this.cache.temporaryOutputPath(task);
        const streamOutput = this.outputStyle === 'static'
            ? false
            : (0, utils_1.shouldStreamOutput)(task, this.initiatingProject);
        let env = pipeOutput
            ? (0, task_env_1.getEnvVariablesForTask)(task, taskSpecificEnv, process.env.FORCE_COLOR === undefined
                ? 'true'
                : process.env.FORCE_COLOR, this.options.skipNxCache, this.options.captureStderr, null, null)
            : (0, task_env_1.getEnvVariablesForTask)(task, taskSpecificEnv, undefined, this.options.skipNxCache, this.options.captureStderr, temporaryOutputPath, streamOutput);
        let results = doNotSkipCache ? await this.applyCachedResults([task]) : [];
        // the task wasn't cached
        if (results.length === 0) {
            const shouldPrefix = streamOutput && process.env.NX_PREFIX_OUTPUT === 'true';
            const targetConfiguration = (0, utils_1.getTargetConfigurationForTask)(task, this.projectGraph);
            if (process.env.NX_RUN_COMMANDS_DIRECTLY !== 'false' &&
                targetConfiguration.executor === 'nx:run-commands' &&
                !shouldPrefix) {
                try {
                    const { schema } = (0, utils_1.getExecutorForTask)(task, this.projectGraph);
                    const isRunOne = this.initiatingProject != null;
                    const combinedOptions = (0, params_1.combineOptionsForExecutor)(task.overrides, task.target.configuration ??
                        targetConfiguration.defaultConfiguration, targetConfiguration, schema, task.target.project, (0, path_1.relative)(task.projectRoot ?? workspace_root_1.workspaceRoot, process.cwd()), process.env.NX_VERBOSE_LOGGING === 'true');
                    if (combinedOptions.env) {
                        env = {
                            ...env,
                            ...combinedOptions.env,
                        };
                    }
                    if (streamOutput) {
                        const args = (0, utils_1.getPrintableCommandArgsForTask)(task);
                        output_1.output.logCommand(args.join(' '));
                    }
                    const { success, terminalOutput } = await (0, run_commands_impl_1.default)({
                        ...combinedOptions,
                        env,
                        usePty: isRunOne && !this.tasksSchedule.hasTasks(),
                        streamOutput,
                    }, {
                        root: workspace_root_1.workspaceRoot, // only root is needed in runCommandsImpl
                    });
                    const status = success ? 'success' : 'failure';
                    if (!streamOutput) {
                        this.options.lifeCycle.printTaskTerminalOutput(task, status, terminalOutput);
                    }
                    (0, fs_1.writeFileSync)(temporaryOutputPath, terminalOutput);
                    results.push({
                        task,
                        status,
                        terminalOutput,
                    });
                }
                catch (e) {
                    if (process.env.NX_VERBOSE_LOGGING === 'true') {
                        console.error(e);
                    }
                    else {
                        console.error(e.message);
                    }
                    const terminalOutput = e.stack ?? e.message ?? '';
                    (0, fs_1.writeFileSync)(temporaryOutputPath, terminalOutput);
                    results.push({
                        task,
                        status: 'failure',
                        terminalOutput,
                    });
                }
            }
            else if (targetConfiguration.executor === 'nx:noop') {
                (0, fs_1.writeFileSync)(temporaryOutputPath, '');
                results.push({
                    task,
                    status: 'success',
                    terminalOutput: '',
                });
            }
            else {
                // cache prep
                const { code, terminalOutput } = await this.runTaskInForkedProcess(task, env, pipeOutput, temporaryOutputPath, streamOutput);
                results.push({
                    task,
                    status: code === 0 ? 'success' : 'failure',
                    terminalOutput,
                });
            }
        }
        await this.postRunSteps([task], results, doNotSkipCache, { groupId });
    }
    async runTaskInForkedProcess(task, env, pipeOutput, temporaryOutputPath, streamOutput) {
        try {
            const usePtyFork = process.env.NX_NATIVE_COMMAND_RUNNER !== 'false';
            // Disable the pseudo terminal if this is a run-many
            const disablePseudoTerminal = !this.initiatingProject;
            // execution
            const { code, terminalOutput } = usePtyFork
                ? await this.forkedProcessTaskRunner.forkProcess(task, {
                    temporaryOutputPath,
                    streamOutput,
                    pipeOutput,
                    taskGraph: this.taskGraph,
                    env,
                    disablePseudoTerminal,
                })
                : await this.forkedProcessTaskRunner.forkProcessLegacy(task, {
                    temporaryOutputPath,
                    streamOutput,
                    pipeOutput,
                    taskGraph: this.taskGraph,
                    env,
                });
            return {
                code,
                terminalOutput,
            };
        }
        catch (e) {
            if (process.env.NX_VERBOSE_LOGGING === 'true') {
                console.error(e);
            }
            return {
                code: 1,
            };
        }
    }
    // endregion Single Task
    // region Lifecycle
    async preRunSteps(tasks, metadata) {
        await this.options.lifeCycle.startTasks(tasks, metadata);
    }
    async postRunSteps(tasks, results, doNotSkipCache, { groupId }) {
        for (const task of tasks) {
            await this.recordOutputsHash(task);
        }
        if (doNotSkipCache) {
            // cache the results
            perf_hooks_1.performance.mark('cache-results-start');
            await Promise.all(results
                .filter(({ status }) => status !== 'local-cache' &&
                status !== 'local-cache-kept-existing' &&
                status !== 'remote-cache' &&
                status !== 'skipped')
                .map((result) => ({
                ...result,
                code: result.status === 'local-cache' ||
                    result.status === 'local-cache-kept-existing' ||
                    result.status === 'remote-cache' ||
                    result.status === 'success'
                    ? 0
                    : 1,
                outputs: result.task.outputs,
            }))
                .filter(({ task, code }) => this.shouldCacheTaskResult(task, code))
                .filter(({ terminalOutput, outputs }) => terminalOutput || outputs)
                .map(async ({ task, code, terminalOutput, outputs }) => this.cache.put(task, terminalOutput, outputs, code)));
            perf_hooks_1.performance.mark('cache-results-end');
            perf_hooks_1.performance.measure('cache-results', 'cache-results-start', 'cache-results-end');
        }
        await this.options.lifeCycle.endTasks(results.map((result) => {
            const code = result.status === 'success' ||
                result.status === 'local-cache' ||
                result.status === 'local-cache-kept-existing' ||
                result.status === 'remote-cache'
                ? 0
                : 1;
            return {
                ...result,
                task: result.task,
                status: result.status,
                code,
            };
        }), { groupId });
        this.complete(results.map(({ task, status }) => {
            return {
                taskId: task.id,
                status,
            };
        }));
        await this.tasksSchedule.scheduleNextTasks();
        // release blocked threads
        this.waitingForTasks.forEach((f) => f(null));
        this.waitingForTasks.length = 0;
    }
    complete(taskResults) {
        this.tasksSchedule.complete(taskResults.map(({ taskId }) => taskId));
        for (const { taskId, status } of taskResults) {
            if (this.completedTasks[taskId] === undefined) {
                this.completedTasks[taskId] = status;
                if (status === 'failure' || status === 'skipped') {
                    if (this.bail) {
                        // mark the execution as bailed which will stop all further execution
                        // only the tasks that are currently running will finish
                        this.bailed = true;
                    }
                    else {
                        // only mark the packages that depend on the current task as skipped
                        // other tasks will continue to execute
                        this.complete(this.reverseTaskDeps[taskId].map((depTaskId) => ({
                            taskId: depTaskId,
                            status: 'skipped',
                        })));
                    }
                }
            }
        }
    }
    //endregion Lifecycle
    // region utils
    async pipeOutputCapture(task) {
        try {
            if (process.env.NX_NATIVE_COMMAND_RUNNER !== 'false') {
                return true;
            }
            const { schema } = (0, utils_1.getExecutorForTask)(task, this.projectGraph);
            return (schema.outputCapture === 'pipe' ||
                process.env.NX_STREAM_OUTPUT === 'true');
        }
        catch (e) {
            return false;
        }
    }
    shouldCacheTaskResult(task, code) {
        return ((0, utils_1.isCacheableTask)(task, this.options) &&
            (process.env.NX_CACHE_FAILURES == 'true' ? true : code === 0));
    }
    closeGroup() {
        for (let i = 0; i < this.options.parallel; i++) {
            if (!this.groups[i]) {
                this.groups[i] = true;
                return i;
            }
        }
    }
    openGroup(id) {
        this.groups[id] = false;
    }
    async shouldCopyOutputsFromCache(outputs, hash) {
        if (this.daemon?.enabled()) {
            return !(await this.daemon.outputsHashesMatch(outputs, hash));
        }
        else {
            return true;
        }
    }
    async recordOutputsHash(task) {
        if (this.daemon?.enabled()) {
            return this.daemon.recordOutputsHash(task.outputs, task.hash);
        }
    }
}
exports.TaskOrchestrator = TaskOrchestrator;
