"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findCycle = findCycle;
exports.findCycles = findCycles;
exports.makeAcyclic = makeAcyclic;
exports.validateNoAtomizedTasks = validateNoAtomizedTasks;
const output_1 = require("../utils/output");
function _findCycle(graph, id, visited, path) {
    if (visited[id])
        return null;
    visited[id] = true;
    for (const d of graph.dependencies[id]) {
        if (path.includes(d))
            return [...path, d];
        const cycle = _findCycle(graph, d, visited, [...path, d]);
        if (cycle)
            return cycle;
    }
    return null;
}
/**
 * This function finds a cycle in the graph.
 * @returns the first cycle found, or null if no cycle is found.
 */
function findCycle(graph) {
    const visited = {};
    for (const t of Object.keys(graph.dependencies)) {
        visited[t] = false;
    }
    for (const t of Object.keys(graph.dependencies)) {
        const cycle = _findCycle(graph, t, visited, [t]);
        if (cycle)
            return cycle;
    }
    return null;
}
/**
 * This function finds all cycles in the graph.
 * @returns a list of unique task ids in all cycles found, or null if no cycle is found.
 */
function findCycles(graph) {
    const visited = {};
    const cycles = new Set();
    for (const t of Object.keys(graph.dependencies)) {
        visited[t] = false;
    }
    for (const t of Object.keys(graph.dependencies)) {
        const cycle = _findCycle(graph, t, visited, [t]);
        if (cycle) {
            cycle.forEach((t) => cycles.add(t));
        }
    }
    return cycles.size ? cycles : null;
}
function _makeAcyclic(graph, id, visited, path) {
    if (visited[id])
        return;
    visited[id] = true;
    const deps = graph.dependencies[id];
    for (const d of [...deps]) {
        if (path.includes(d)) {
            deps.splice(deps.indexOf(d), 1);
        }
        else {
            _makeAcyclic(graph, d, visited, [...path, d]);
        }
    }
    return null;
}
function makeAcyclic(graph) {
    const visited = {};
    for (const t of Object.keys(graph.dependencies)) {
        visited[t] = false;
    }
    for (const t of Object.keys(graph.dependencies)) {
        _makeAcyclic(graph, t, visited, [t]);
    }
    graph.roots = Object.keys(graph.dependencies).filter((t) => graph.dependencies[t].length === 0);
}
function validateNoAtomizedTasks(taskGraph, projectGraph) {
    const getNonAtomizedTargetForTask = (task) => projectGraph.nodes[task.target.project]?.data?.targets?.[task.target.target]
        ?.metadata?.nonAtomizedTarget;
    const atomizedRootTasks = Object.values(taskGraph.tasks).filter((task) => getNonAtomizedTargetForTask(task) !== undefined);
    if (atomizedRootTasks.length === 0) {
        return;
    }
    const nonAtomizedTasks = atomizedRootTasks
        .map((t) => `"${getNonAtomizedTargetForTask(t)}"`)
        .filter((item, index, arr) => arr.indexOf(item) === index);
    const moreInfoLines = [
        `Please enable Nx Cloud or use the slower ${nonAtomizedTasks.join(',')} task${nonAtomizedTasks.length > 1 ? 's' : ''}.`,
        'Learn more at https://nx.dev/ci/features/split-e2e-tasks#nx-cloud-is-required-to-run-atomized-tasks',
    ];
    if (atomizedRootTasks.length === 1) {
        output_1.output.error({
            title: `The ${atomizedRootTasks[0].id} task should only be run with Nx Cloud.`,
            bodyLines: [...moreInfoLines],
        });
    }
    else {
        output_1.output.error({
            title: `The following tasks should only be run with Nx Cloud:`,
            bodyLines: [
                ...atomizedRootTasks.map((task) => `  - ${task.id}`),
                '',
                ...moreInfoLines,
            ],
        });
    }
    process.exit(1);
}
