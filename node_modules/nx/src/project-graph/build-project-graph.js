"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFileMap = getFileMap;
exports.hydrateFileMap = hydrateFileMap;
exports.buildProjectGraphUsingProjectFileMap = buildProjectGraphUsingProjectFileMap;
exports.applyProjectMetadata = applyProjectMetadata;
const workspace_root_1 = require("../utils/workspace-root");
const path_1 = require("path");
const perf_hooks_1 = require("perf_hooks");
const assert_workspace_validity_1 = require("../utils/assert-workspace-validity");
const nx_deps_cache_1 = require("./nx-deps-cache");
const implicit_project_dependencies_1 = require("./utils/implicit-project-dependencies");
const normalize_project_nodes_1 = require("./utils/normalize-project-nodes");
const typescript_1 = require("../plugins/js/utils/typescript");
const fileutils_1 = require("../utils/fileutils");
const project_graph_builder_1 = require("./project-graph-builder");
const configuration_1 = require("../config/configuration");
const fs_1 = require("fs");
const error_types_1 = require("./error-types");
const project_configuration_utils_1 = require("./utils/project-configuration-utils");
const delayed_spinner_1 = require("../utils/delayed-spinner");
let storedFileMap = null;
let storedAllWorkspaceFiles = null;
let storedRustReferences = null;
function getFileMap() {
    if (!!storedFileMap) {
        return {
            fileMap: storedFileMap,
            allWorkspaceFiles: storedAllWorkspaceFiles,
            rustReferences: storedRustReferences,
        };
    }
    else {
        return {
            fileMap: {
                nonProjectFiles: [],
                projectFileMap: {},
            },
            allWorkspaceFiles: [],
            rustReferences: null,
        };
    }
}
function hydrateFileMap(fileMap, allWorkspaceFiles, rustReferences) {
    storedFileMap = fileMap;
    storedAllWorkspaceFiles = allWorkspaceFiles;
    storedRustReferences = rustReferences;
}
async function buildProjectGraphUsingProjectFileMap(projectRootMap, externalNodes, fileMap, allWorkspaceFiles, rustReferences, fileMapCache, plugins, sourceMap) {
    storedFileMap = fileMap;
    storedAllWorkspaceFiles = allWorkspaceFiles;
    storedRustReferences = rustReferences;
    const projects = {};
    for (const root in projectRootMap) {
        const project = projectRootMap[root];
        projects[project.name] = project;
    }
    const errors = [];
    const nxJson = (0, configuration_1.readNxJson)();
    const projectGraphVersion = '6.0';
    try {
        (0, assert_workspace_validity_1.assertWorkspaceValidity)(projects, nxJson);
    }
    catch (e) {
        if ((0, error_types_1.isWorkspaceValidityError)(e)) {
            errors.push(e);
        }
    }
    const packageJsonDeps = readCombinedDeps();
    const rootTsConfig = readRootTsConfig();
    let filesToProcess;
    let cachedFileData;
    const useCacheData = fileMapCache &&
        !(0, nx_deps_cache_1.shouldRecomputeWholeGraph)(fileMapCache, packageJsonDeps, projects, nxJson, rootTsConfig);
    if (useCacheData) {
        const fromCache = (0, nx_deps_cache_1.extractCachedFileData)(fileMap, fileMapCache);
        filesToProcess = fromCache.filesToProcess;
        cachedFileData = fromCache.cachedFileData;
    }
    else {
        filesToProcess = fileMap;
        cachedFileData = {
            nonProjectFiles: {},
            projectFileMap: {},
        };
    }
    let projectGraph;
    let projectFileMapCache;
    try {
        const context = createContext(projects, nxJson, externalNodes, fileMap, filesToProcess);
        projectGraph = await buildProjectGraphUsingContext(externalNodes, context, cachedFileData, projectGraphVersion, plugins, sourceMap);
        projectFileMapCache = (0, nx_deps_cache_1.createProjectFileMapCache)(nxJson, packageJsonDeps, fileMap, rootTsConfig);
    }
    catch (e) {
        // we need to include the workspace validity errors in the final error
        if ((0, error_types_1.isAggregateProjectGraphError)(e)) {
            errors.push(...e.errors);
            throw new error_types_1.AggregateProjectGraphError(errors, e.partialProjectGraph);
        }
        else {
            throw e;
        }
    }
    if (errors.length > 0) {
        throw new error_types_1.AggregateProjectGraphError(errors, projectGraph);
    }
    return {
        projectGraph,
        projectFileMapCache,
    };
}
function readCombinedDeps() {
    const installationPackageJsonPath = (0, path_1.join)(workspace_root_1.workspaceRoot, '.nx', 'installation', 'package.json');
    const installationPackageJson = (0, fs_1.existsSync)(installationPackageJsonPath)
        ? (0, fileutils_1.readJsonFile)(installationPackageJsonPath)
        : {};
    const rootPackageJsonPath = (0, path_1.join)(workspace_root_1.workspaceRoot, 'package.json');
    const rootPackageJson = (0, fs_1.existsSync)(rootPackageJsonPath)
        ? (0, fileutils_1.readJsonFile)(rootPackageJsonPath)
        : {};
    return {
        ...rootPackageJson.dependencies,
        ...rootPackageJson.devDependencies,
        ...installationPackageJson.dependencies,
        ...installationPackageJson.devDependencies,
    };
}
async function buildProjectGraphUsingContext(knownExternalNodes, ctx, cachedFileData, projectGraphVersion, plugins, sourceMap) {
    const builder = new project_graph_builder_1.ProjectGraphBuilder(null, ctx.fileMap.projectFileMap);
    builder.setVersion(projectGraphVersion);
    for (const node in knownExternalNodes) {
        builder.addExternalNode(knownExternalNodes[node]);
    }
    await (0, normalize_project_nodes_1.normalizeProjectNodes)(ctx, builder);
    const initProjectGraph = builder.getUpdatedProjectGraph();
    let updatedGraph;
    let error;
    try {
        updatedGraph = await updateProjectGraphWithPlugins(ctx, initProjectGraph, plugins, sourceMap);
    }
    catch (e) {
        if ((0, error_types_1.isAggregateProjectGraphError)(e)) {
            updatedGraph = e.partialProjectGraph;
            error = e;
        }
        else {
            throw e;
        }
    }
    const updatedBuilder = new project_graph_builder_1.ProjectGraphBuilder(updatedGraph, ctx.fileMap.projectFileMap);
    for (const proj of Object.keys(cachedFileData.projectFileMap)) {
        for (const f of ctx.fileMap.projectFileMap[proj] || []) {
            const cached = cachedFileData.projectFileMap[proj][f.file];
            if (cached && cached.deps) {
                f.deps = [...cached.deps];
            }
        }
    }
    for (const file of ctx.fileMap.nonProjectFiles) {
        const cached = cachedFileData.nonProjectFiles[file.file];
        if (cached?.deps) {
            file.deps = [...cached.deps];
        }
    }
    (0, implicit_project_dependencies_1.applyImplicitDependencies)(ctx.projects, updatedBuilder);
    const finalGraph = updatedBuilder.getUpdatedProjectGraph();
    if (!error) {
        return finalGraph;
    }
    else {
        throw new error_types_1.AggregateProjectGraphError(error.errors, finalGraph);
    }
}
function createContext(projects, nxJson, externalNodes, fileMap, filesToProcess) {
    return {
        nxJsonConfiguration: nxJson,
        projects,
        externalNodes,
        workspaceRoot: workspace_root_1.workspaceRoot,
        fileMap,
        filesToProcess,
    };
}
async function updateProjectGraphWithPlugins(context, initProjectGraph, plugins, sourceMap) {
    let graph = initProjectGraph;
    const errors = [];
    const builder = new project_graph_builder_1.ProjectGraphBuilder(graph, context.fileMap.projectFileMap, context.fileMap.nonProjectFiles);
    const createDependencyPlugins = plugins.filter((plugin) => plugin.createDependencies);
    perf_hooks_1.performance.mark('createDependencies:start');
    let spinner;
    const inProgressPlugins = new Set();
    function updateSpinner() {
        if (!spinner || inProgressPlugins.size === 0) {
            return;
        }
        if (inProgressPlugins.size === 1) {
            spinner.setMessage(`Creating project graph dependencies with ${inProgressPlugins.values().next().value}`);
        }
        else if (process.env.NX_VERBOSE_LOGGING === 'true') {
            spinner.setMessage([
                `Creating project graph dependencies with ${inProgressPlugins.size} plugins`,
                ...Array.from(inProgressPlugins).map((p) => `  - ${p}`),
            ].join('\n'));
        }
        else {
            spinner.setMessage(`Creating project graph dependencies with ${inProgressPlugins.size} plugins`);
        }
    }
    spinner = new delayed_spinner_1.DelayedSpinner(`Creating project graph dependencies with ${plugins.length} plugins`);
    await Promise.all(createDependencyPlugins.map(async (plugin) => {
        perf_hooks_1.performance.mark(`${plugin.name}:createDependencies - start`);
        inProgressPlugins.add(plugin.name);
        try {
            const dependencies = await plugin
                .createDependencies({
                ...context,
            })
                .finally(() => {
                inProgressPlugins.delete(plugin.name);
                updateSpinner();
            });
            for (const dep of dependencies) {
                builder.addDependency(dep.source, dep.target, dep.type, 'sourceFile' in dep ? dep.sourceFile : null);
            }
        }
        catch (cause) {
            errors.push(new error_types_1.ProcessDependenciesError(plugin.name, {
                cause,
            }));
        }
        perf_hooks_1.performance.mark(`${plugin.name}:createDependencies - end`);
        perf_hooks_1.performance.measure(`${plugin.name}:createDependencies`, `${plugin.name}:createDependencies - start`, `${plugin.name}:createDependencies - end`);
    }));
    perf_hooks_1.performance.mark('createDependencies:end');
    perf_hooks_1.performance.measure(`createDependencies`, `createDependencies:start`, `createDependencies:end`);
    spinner?.cleanup();
    const graphWithDeps = builder.getUpdatedProjectGraph();
    const { errors: metadataErrors, graph: updatedGraph } = await applyProjectMetadata(graphWithDeps, plugins, {
        nxJsonConfiguration: context.nxJsonConfiguration,
        workspaceRoot: workspace_root_1.workspaceRoot,
    }, sourceMap);
    errors.push(...metadataErrors);
    if (errors.length > 0) {
        throw new error_types_1.AggregateProjectGraphError(errors, updatedGraph);
    }
    return updatedGraph;
}
function readRootTsConfig() {
    try {
        const tsConfigPath = (0, typescript_1.getRootTsConfigPath)();
        if (tsConfigPath) {
            return (0, fileutils_1.readJsonFile)(tsConfigPath, { expectComments: true });
        }
    }
    catch (e) {
        return {};
    }
}
async function applyProjectMetadata(graph, plugins, context, sourceMap) {
    const results = [];
    const errors = [];
    perf_hooks_1.performance.mark('createMetadata:start');
    let spinner;
    const inProgressPlugins = new Set();
    function updateSpinner() {
        if (!spinner || inProgressPlugins.size === 0) {
            return;
        }
        if (inProgressPlugins.size === 1) {
            spinner.setMessage(`Creating project metadata with ${inProgressPlugins.values().next().value}`);
        }
        else if (process.env.NX_VERBOSE_LOGGING === 'true') {
            spinner.setMessage([
                `Creating project metadata with ${inProgressPlugins.size} plugins`,
                ...Array.from(inProgressPlugins).map((p) => `  - ${p}`),
            ].join('\n'));
        }
        else {
            spinner.setMessage(`Creating project metadata with ${inProgressPlugins.size} plugins`);
        }
    }
    spinner = new delayed_spinner_1.DelayedSpinner(`Creating project metadata with ${plugins.length} plugins`);
    const promises = plugins.map(async (plugin) => {
        if (plugin.createMetadata) {
            perf_hooks_1.performance.mark(`${plugin.name}:createMetadata - start`);
            inProgressPlugins.add(plugin.name);
            try {
                const metadata = await plugin.createMetadata(graph, context);
                results.push({ metadata, pluginName: plugin.name });
            }
            catch (e) {
                errors.push(new error_types_1.CreateMetadataError(e, plugin.name));
            }
            finally {
                inProgressPlugins.delete(plugin.name);
                updateSpinner();
                perf_hooks_1.performance.mark(`${plugin.name}:createMetadata - end`);
                perf_hooks_1.performance.measure(`${plugin.name}:createMetadata`, `${plugin.name}:createMetadata - start`, `${plugin.name}:createMetadata - end`);
            }
        }
    });
    await Promise.all(promises);
    spinner?.cleanup();
    for (const { metadata: projectsMetadata, pluginName } of results) {
        for (const project in projectsMetadata) {
            const projectConfiguration = graph.nodes[project]?.data;
            if (projectConfiguration) {
                projectConfiguration.metadata = (0, project_configuration_utils_1.mergeMetadata)(sourceMap[project], [null, pluginName], 'metadata', projectsMetadata[project].metadata, projectConfiguration.metadata);
            }
        }
    }
    perf_hooks_1.performance.mark('createMetadata:end');
    perf_hooks_1.performance.measure(`createMetadata`, `createMetadata:start`, `createMetadata:end`);
    return { errors, graph };
}
