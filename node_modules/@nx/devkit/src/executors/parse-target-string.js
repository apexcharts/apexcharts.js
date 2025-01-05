"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseTargetString = parseTargetString;
exports.targetToTargetString = targetToTargetString;
const devkit_exports_1 = require("nx/src/devkit-exports");
const devkit_internals_1 = require("nx/src/devkit-internals");
function parseTargetString(targetString, projectGraphOrCtx) {
    let projectGraph = projectGraphOrCtx && 'projectGraph' in projectGraphOrCtx
        ? projectGraphOrCtx.projectGraph
        : projectGraphOrCtx;
    if (!projectGraph) {
        try {
            projectGraph = (0, devkit_exports_1.readCachedProjectGraph)();
        }
        catch (e) {
            projectGraph = { nodes: {} };
        }
    }
    const [maybeProject] = (0, devkit_internals_1.splitByColons)(targetString);
    if (!projectGraph.nodes[maybeProject] &&
        projectGraphOrCtx &&
        'projectName' in projectGraphOrCtx &&
        maybeProject !== projectGraphOrCtx.projectName) {
        targetString = `${projectGraphOrCtx.projectName}:${targetString}`;
    }
    const [project, target, configuration] = (0, devkit_internals_1.splitTarget)(targetString, projectGraph);
    if (!project || !target) {
        throw new Error(`Invalid Target String: ${targetString}`);
    }
    return {
        project,
        target,
        configuration,
    };
}
/**
 * Returns a string in the format "project:target[:configuration]" for the target
 *
 * @param target - target object
 *
 * Examples:
 *
 * ```typescript
 * targetToTargetString({ project: "proj", target: "test" }) // returns "proj:test"
 * targetToTargetString({ project: "proj", target: "test", configuration: "production" }) // returns "proj:test:production"
 * ```
 */
function targetToTargetString({ project, target, configuration, }) {
    return `${project}:${target.indexOf(':') > -1 ? `"${target}"` : target}${configuration !== undefined ? ':' + configuration : ''}`;
}
