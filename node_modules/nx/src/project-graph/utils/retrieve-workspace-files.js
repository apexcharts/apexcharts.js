"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.retrieveWorkspaceFiles = retrieveWorkspaceFiles;
exports.retrieveProjectConfigurations = retrieveProjectConfigurations;
exports.retrieveProjectConfigurationsWithAngularProjects = retrieveProjectConfigurationsWithAngularProjects;
exports.retrieveProjectConfigurationPaths = retrieveProjectConfigurationPaths;
exports.retrieveProjectConfigurationsWithoutPluginInference = retrieveProjectConfigurationsWithoutPluginInference;
exports.configurationGlobs = configurationGlobs;
const perf_hooks_1 = require("perf_hooks");
const angular_json_1 = require("../../adapter/angular-json");
const nx_json_1 = require("../../config/nx-json");
const project_configuration_utils_1 = require("./project-configuration-utils");
const workspace_context_1 = require("../../utils/workspace-context");
const build_all_workspace_files_1 = require("./build-all-workspace-files");
const path_1 = require("path");
const get_plugins_1 = require("../plugins/get-plugins");
/**
 * Walks the workspace directory to create the `projectFileMap`, `ProjectConfigurations` and `allWorkspaceFiles`
 * @throws
 * @param workspaceRoot
 * @param nxJson
 */
async function retrieveWorkspaceFiles(workspaceRoot, projectRootMap) {
    perf_hooks_1.performance.mark('native-file-deps:start');
    perf_hooks_1.performance.mark('native-file-deps:end');
    perf_hooks_1.performance.measure('native-file-deps', 'native-file-deps:start', 'native-file-deps:end');
    perf_hooks_1.performance.mark('get-workspace-files:start');
    const { projectFileMap, globalFiles, externalReferences } = await (0, workspace_context_1.getNxWorkspaceFilesFromContext)(workspaceRoot, projectRootMap);
    perf_hooks_1.performance.mark('get-workspace-files:end');
    perf_hooks_1.performance.measure('get-workspace-files', 'get-workspace-files:start', 'get-workspace-files:end');
    return {
        allWorkspaceFiles: (0, build_all_workspace_files_1.buildAllWorkspaceFiles)(projectFileMap, globalFiles),
        fileMap: {
            projectFileMap,
            nonProjectFiles: globalFiles,
        },
        rustReferences: externalReferences,
    };
}
/**
 * Walk through the workspace and return `ProjectConfigurations`. Only use this if the projectFileMap is not needed.
 */
async function retrieveProjectConfigurations(plugins, workspaceRoot, nxJson) {
    const globPatterns = configurationGlobs(plugins);
    const workspaceFiles = await (0, workspace_context_1.globWithWorkspaceContext)(workspaceRoot, globPatterns);
    return (0, project_configuration_utils_1.createProjectConfigurations)(workspaceRoot, nxJson, workspaceFiles, plugins);
}
async function retrieveProjectConfigurationsWithAngularProjects(workspaceRoot, nxJson) {
    const pluginsToLoad = nxJson?.plugins ?? [];
    if ((0, angular_json_1.shouldMergeAngularProjects)(workspaceRoot, true) &&
        !pluginsToLoad.some((p) => p === angular_json_1.NX_ANGULAR_JSON_PLUGIN_NAME ||
            (typeof p === 'object' && p.plugin === angular_json_1.NX_ANGULAR_JSON_PLUGIN_NAME))) {
        pluginsToLoad.push((0, path_1.join)(__dirname, '../../adapter/angular-json'));
    }
    const plugins = await (0, get_plugins_1.getPlugins)();
    const res = await retrieveProjectConfigurations(plugins, workspaceRoot, nxJson);
    return res;
}
function retrieveProjectConfigurationPaths(root, plugins) {
    const projectGlobPatterns = configurationGlobs(plugins);
    return (0, workspace_context_1.globWithWorkspaceContext)(root, projectGlobPatterns);
}
const projectsWithoutPluginCache = new Map();
// TODO: This function is called way too often, it should be optimized without this cache
async function retrieveProjectConfigurationsWithoutPluginInference(root) {
    const nxJson = (0, nx_json_1.readNxJson)(root);
    const plugins = await (0, get_plugins_1.getOnlyDefaultPlugins)(); // only load default plugins
    const projectGlobPatterns = await retrieveProjectConfigurationPaths(root, plugins);
    const cacheKey = root + ',' + projectGlobPatterns.join(',');
    if (projectsWithoutPluginCache.has(cacheKey)) {
        return projectsWithoutPluginCache.get(cacheKey);
    }
    const projectFiles = (await (0, workspace_context_1.globWithWorkspaceContext)(root, projectGlobPatterns)) ?? [];
    const { projects } = await (0, project_configuration_utils_1.createProjectConfigurations)(root, nxJson, projectFiles, plugins);
    projectsWithoutPluginCache.set(cacheKey, projects);
    return projects;
}
function configurationGlobs(plugins) {
    const globPatterns = [];
    for (const plugin of plugins) {
        if ('createNodes' in plugin && plugin.createNodes) {
            globPatterns.push(plugin.createNodes[0]);
        }
    }
    return globPatterns;
}
