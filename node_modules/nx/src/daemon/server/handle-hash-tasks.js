"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleHashTasks = handleHashTasks;
const project_graph_incremental_recomputation_1 = require("./project-graph-incremental-recomputation");
const task_hasher_1 = require("../../hasher/task-hasher");
const configuration_1 = require("../../config/configuration");
const error_types_1 = require("../../project-graph/error-types");
/**
 * We use this not to recreated hasher for every hash operation
 * TaskHasher has a cache inside, so keeping it around results in faster performance
 */
let storedProjectGraph = null;
let storedHasher = null;
async function handleHashTasks(payload) {
    const { error, projectGraph: _graph, allWorkspaceFiles, fileMap, rustReferences, } = await (0, project_graph_incremental_recomputation_1.getCachedSerializedProjectGraphPromise)();
    let projectGraph = _graph;
    if (error) {
        if (error instanceof error_types_1.DaemonProjectGraphError) {
            projectGraph = error.projectGraph;
        }
        else {
            throw error;
        }
    }
    const nxJson = (0, configuration_1.readNxJson)();
    if (projectGraph !== storedProjectGraph) {
        storedProjectGraph = projectGraph;
        storedHasher = new task_hasher_1.InProcessTaskHasher(projectGraph, nxJson, rustReferences, payload.runnerOptions);
    }
    const response = JSON.stringify(await storedHasher.hashTasks(payload.tasks, payload.taskGraph, payload.env));
    return {
        response,
        description: 'handleHashTasks',
    };
}
