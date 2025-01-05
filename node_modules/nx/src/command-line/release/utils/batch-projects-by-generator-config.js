"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.batchProjectsByGeneratorConfig = batchProjectsByGeneratorConfig;
const json_diff_1 = require("../../../utils/json-diff");
/**
 * To be most efficient with our invocations of runVersionOnProjects, we want to batch projects by their generator and generator options
 * within any given release group.
 */
function batchProjectsByGeneratorConfig(projectGraph, releaseGroup, projectNamesToBatch) {
    const configBatches = new Map();
    for (const projectName of projectNamesToBatch) {
        const project = projectGraph.nodes[projectName];
        const generator = project.data.release?.version?.generator ||
            releaseGroup.version.generator;
        const generatorOptions = {
            ...releaseGroup.version.generatorOptions,
            ...project.data.release?.version?.generatorOptions,
        };
        let found = false;
        for (const [key, projects] of configBatches) {
            const [existingGenerator, existingOptions] = JSON.parse(key);
            if (generator === existingGenerator &&
                (0, json_diff_1.deepEquals)(generatorOptions, existingOptions)) {
                projects.push(projectName);
                found = true;
                break;
            }
        }
        if (!found) {
            configBatches.set(JSON.stringify([generator, generatorOptions]), [
                projectName,
            ]);
        }
    }
    return configBatches;
}
