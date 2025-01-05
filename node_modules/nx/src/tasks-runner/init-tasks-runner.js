"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initTasksRunner = initTasksRunner;
const configuration_1 = require("../config/configuration");
const project_graph_1 = require("../project-graph/project-graph");
const run_command_1 = require("./run-command");
const invoke_runner_terminal_output_life_cycle_1 = require("./life-cycles/invoke-runner-terminal-output-life-cycle");
const perf_hooks_1 = require("perf_hooks");
const utils_1 = require("./utils");
const dotenv_1 = require("../utils/dotenv");
async function initTasksRunner(nxArgs) {
    perf_hooks_1.performance.mark('init-local');
    (0, dotenv_1.loadRootEnvFiles)();
    const nxJson = (0, configuration_1.readNxJson)();
    if (nxArgs.verbose) {
        process.env.NX_VERBOSE_LOGGING = 'true';
    }
    const projectGraph = await (0, project_graph_1.createProjectGraphAsync)({ exitOnError: true });
    return {
        invoke: async (opts) => {
            perf_hooks_1.performance.mark('code-loading:end');
            // TODO: This polyfills the outputs if someone doesn't pass a task with outputs. Remove this in Nx 20
            opts.tasks.forEach((t) => {
                if (!t.outputs) {
                    t.outputs = (0, utils_1.getOutputs)(projectGraph.nodes, t.target, t.overrides);
                }
            });
            const lifeCycle = new invoke_runner_terminal_output_life_cycle_1.InvokeRunnerTerminalOutputLifeCycle(opts.tasks);
            const taskGraph = {
                roots: opts.tasks.map((task) => task.id),
                tasks: opts.tasks.reduce((acc, task) => {
                    acc[task.id] = task;
                    return acc;
                }, {}),
                dependencies: opts.tasks.reduce((acc, task) => {
                    acc[task.id] = [];
                    return acc;
                }, {}),
            };
            const taskResults = await (0, run_command_1.invokeTasksRunner)({
                tasks: opts.tasks,
                projectGraph,
                taskGraph,
                lifeCycle,
                nxJson,
                nxArgs: { ...nxArgs, parallel: opts.parallel },
                loadDotEnvFiles: true,
                initiatingProject: null,
            });
            return {
                status: Object.values(taskResults).some((taskResult) => taskResult.status === 'failure' || taskResult.status === 'skipped')
                    ? 1
                    : 0,
                taskGraph,
                taskResults,
            };
        },
    };
}
