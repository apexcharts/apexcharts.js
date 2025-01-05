"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTaskDetails = getTaskDetails;
exports.hashTasksThatDoNotDependOnOutputsOfOtherTasks = hashTasksThatDoNotDependOnOutputsOfOtherTasks;
exports.hashTask = hashTask;
const utils_1 = require("../tasks-runner/utils");
const project_graph_1 = require("../project-graph/project-graph");
const task_hasher_1 = require("./task-hasher");
const nx_json_1 = require("../config/nx-json");
const native_1 = require("../native");
const db_connection_1 = require("../utils/db-connection");
let taskDetails;
function getTaskDetails() {
    // TODO: Remove when wasm supports sqlite
    if (process.env.NX_DISABLE_DB === 'true' || native_1.IS_WASM) {
        return null;
    }
    if (!taskDetails) {
        taskDetails = new native_1.TaskDetails((0, db_connection_1.getDbConnection)());
    }
    return taskDetails;
}
async function hashTasksThatDoNotDependOnOutputsOfOtherTasks(hasher, projectGraph, taskGraph, nxJson, tasksDetails) {
    performance.mark('hashMultipleTasks:start');
    const tasks = Object.values(taskGraph.tasks);
    const tasksWithHashers = await Promise.all(tasks.map(async (task) => {
        const customHasher = (0, utils_1.getCustomHasher)(task, projectGraph);
        return { task, customHasher };
    }));
    const tasksToHash = tasksWithHashers
        .filter(({ task, customHasher }) => {
        // If a task has a custom hasher, it might depend on the outputs of other tasks
        if (customHasher && customHasher.name !== 'eslint-hasher') {
            return false;
        }
        return !(taskGraph.dependencies[task.id].length > 0 &&
            (0, task_hasher_1.getInputs)(task, projectGraph, nxJson).depsOutputs.length > 0);
    })
        .map((t) => t.task);
    const hashes = await hasher.hashTasks(tasksToHash, taskGraph, process.env);
    for (let i = 0; i < tasksToHash.length; i++) {
        tasksToHash[i].hash = hashes[i].value;
        tasksToHash[i].hashDetails = hashes[i].details;
    }
    if (tasksDetails?.recordTaskDetails) {
        tasksDetails.recordTaskDetails(tasksToHash.map((task) => ({
            hash: task.hash,
            project: task.target.project,
            target: task.target.target,
            configuration: task.target.configuration,
        })));
    }
    performance.mark('hashMultipleTasks:end');
    performance.measure('hashMultipleTasks', 'hashMultipleTasks:start', 'hashMultipleTasks:end');
}
async function hashTask(hasher, projectGraph, taskGraph, task, env, taskDetails) {
    performance.mark('hashSingleTask:start');
    const customHasher = (0, utils_1.getCustomHasher)(task, projectGraph);
    const projectsConfigurations = (0, project_graph_1.readProjectsConfigurationFromProjectGraph)(projectGraph);
    const { value, details } = await (customHasher
        ? customHasher(task, {
            hasher,
            projectGraph,
            taskGraph,
            workspaceConfig: projectsConfigurations, // to make the change non-breaking. Remove after v19
            projectsConfigurations,
            nxJsonConfiguration: (0, nx_json_1.readNxJson)(),
            env,
        })
        : hasher.hashTask(task, taskGraph, env));
    task.hash = value;
    task.hashDetails = details;
    if (taskDetails?.recordTaskDetails) {
        taskDetails.recordTaskDetails([
            {
                hash: task.hash,
                project: task.target.project,
                target: task.target.target,
                configuration: task.target.configuration,
            },
        ]);
    }
    performance.mark('hashSingleTask:end');
    performance.measure('hashSingleTask', 'hashSingleTask:start', 'hashSingleTask:end');
}
