"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildExplicitPackageJsonDependencies = buildExplicitPackageJsonDependencies;
const project_graph_1 = require("../../../../config/project-graph");
const file_utils_1 = require("../../../../project-graph/file-utils");
const project_graph_builder_1 = require("../../../../project-graph/project-graph-builder");
const json_1 = require("../../../../utils/json");
const path_1 = require("../../../../utils/path");
function buildExplicitPackageJsonDependencies(ctx, targetProjectLocator) {
    const res = [];
    const nodes = Object.values(ctx.projects);
    Object.keys(ctx.filesToProcess.projectFileMap).forEach((source) => {
        Object.values(ctx.filesToProcess.projectFileMap[source]).forEach((f) => {
            if (isPackageJsonAtProjectRoot(nodes, f.file)) {
                processPackageJson(source, f.file, ctx, targetProjectLocator, res);
            }
        });
    });
    return res;
}
function isPackageJsonAtProjectRoot(nodes, fileName) {
    return (fileName.endsWith('package.json') &&
        nodes.find((projectNode) => (0, path_1.joinPathFragments)(projectNode.root, 'package.json') === fileName));
}
function processPackageJson(sourceProject, fileName, ctx, targetProjectLocator, collectedDeps) {
    try {
        const deps = readDeps((0, json_1.parseJson)((0, file_utils_1.defaultFileRead)(fileName)));
        for (const d of Object.keys(deps)) {
            const localProject = targetProjectLocator.findDependencyInWorkspaceProjects(d);
            if (localProject) {
                // package.json refers to another project in the monorepo
                const dependency = {
                    source: sourceProject,
                    target: localProject,
                    sourceFile: fileName,
                    type: project_graph_1.DependencyType.static,
                };
                (0, project_graph_builder_1.validateDependency)(dependency, ctx);
                collectedDeps.push(dependency);
                continue;
            }
            const externalNodeName = targetProjectLocator.findNpmProjectFromImport(d, fileName);
            if (!externalNodeName) {
                continue;
            }
            const dependency = {
                source: sourceProject,
                target: externalNodeName,
                sourceFile: fileName,
                type: project_graph_1.DependencyType.static,
            };
            (0, project_graph_builder_1.validateDependency)(dependency, ctx);
            collectedDeps.push(dependency);
        }
    }
    catch (e) {
        if (process.env.NX_VERBOSE_LOGGING === 'true') {
            console.error(e);
        }
    }
}
function readDeps(packageJson) {
    const deps = {};
    /**
     * We process dependencies in a rough order of increasing importance such that if a dependency is listed in multiple
     * sections, the version listed under the "most important" one wins, with production dependencies being the most important.
     */
    const depType = [
        'optionalDependencies',
        'peerDependencies',
        'devDependencies',
        'dependencies',
    ];
    for (const type of depType) {
        for (const [depName, depVersion] of Object.entries(packageJson[type] || {})) {
            deps[depName] = depVersion;
        }
    }
    return deps;
}
