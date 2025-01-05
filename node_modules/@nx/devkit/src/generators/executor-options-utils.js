"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.forEachExecutorOptions = forEachExecutorOptions;
exports.forEachExecutorOptionsInGraph = forEachExecutorOptionsInGraph;
const devkit_exports_1 = require("nx/src/devkit-exports");
/**
 * Calls a function for each different options that an executor is configured with
 */
function forEachExecutorOptions(tree, 
/**
 * Name of the executor to update options for
 */
executorName, 
/**
 * Callback that is called for each options configured for a builder
 */
callback) {
    forEachProjectConfig((0, devkit_exports_1.getProjects)(tree), executorName, callback);
}
/**
 * Calls a function for each different options that an executor is configured with via the project graph
 * this is helpful when you need to get the expaned configuration options from the nx.json
 **/
function forEachExecutorOptionsInGraph(graph, executorName, callback) {
    const projects = new Map();
    Object.values(graph.nodes).forEach((p) => projects.set(p.name, p.data));
    forEachProjectConfig(projects, executorName, callback);
}
function forEachProjectConfig(projects, executorName, callback) {
    for (const [projectName, project] of projects) {
        for (const [targetName, target] of Object.entries(project.targets || {})) {
            if (executorName !== target.executor) {
                continue;
            }
            callback(target.options ?? {}, projectName, targetName);
            if (!target.configurations) {
                continue;
            }
            Object.entries(target.configurations).forEach(([configName, options]) => {
                callback(options, projectName, targetName, configName);
            });
        }
    }
}
// TODO: add a method for updating options
