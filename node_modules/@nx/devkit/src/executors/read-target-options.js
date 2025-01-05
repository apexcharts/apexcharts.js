"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.readTargetOptions = readTargetOptions;
const path_1 = require("path");
const devkit_internals_1 = require("nx/src/devkit-internals");
/**
 * Reads and combines options for a given target.
 *
 * Works as if you invoked the target yourself without passing any command lint overrides.
 */
function readTargetOptions({ project, target, configuration }, context) {
    const projectConfiguration = context.projectsConfigurations.projects[project];
    if (!projectConfiguration) {
        throw new Error(`Unable to find project ${project}`);
    }
    const targetConfiguration = projectConfiguration.targets[target];
    if (!targetConfiguration) {
        throw new Error(`Unable to find target ${target} for project ${project}`);
    }
    const [nodeModule, executorName] = targetConfiguration.executor.split(':');
    const { schema } = (0, devkit_internals_1.getExecutorInformation)(nodeModule, executorName, context.root, context.projectsConfigurations?.projects);
    const defaultProject = (0, devkit_internals_1.calculateDefaultProjectName)(context.cwd, context.root, { version: 2, projects: context.projectsConfigurations.projects }, context.nxJsonConfiguration);
    return (0, devkit_internals_1.combineOptionsForExecutor)({}, configuration ?? targetConfiguration.defaultConfiguration ?? '', targetConfiguration, schema, defaultProject, (0, path_1.relative)(context.root, context.cwd));
}
