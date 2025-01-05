"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.currentProjectGraph = exports.currentProjectFileMapCache = exports.fileMapWithFiles = void 0;
exports.getCachedSerializedProjectGraphPromise = getCachedSerializedProjectGraphPromise;
exports.addUpdatedAndDeletedFiles = addUpdatedAndDeletedFiles;
exports.registerProjectGraphRecomputationListener = registerProjectGraphRecomputationListener;
const perf_hooks_1 = require("perf_hooks");
const nx_json_1 = require("../../config/nx-json");
const file_hasher_1 = require("../../hasher/file-hasher");
const build_project_graph_1 = require("../../project-graph/build-project-graph");
const file_map_utils_1 = require("../../project-graph/file-map-utils");
const nx_deps_cache_1 = require("../../project-graph/nx-deps-cache");
const retrieve_workspace_files_1 = require("../../project-graph/utils/retrieve-workspace-files");
const fileutils_1 = require("../../utils/fileutils");
const workspace_context_1 = require("../../utils/workspace-context");
const workspace_root_1 = require("../../utils/workspace-root");
const file_watcher_sockets_1 = require("./file-watching/file-watcher-sockets");
const logger_1 = require("./logger");
const error_types_1 = require("../../project-graph/error-types");
const get_plugins_1 = require("../../project-graph/plugins/get-plugins");
let cachedSerializedProjectGraphPromise;
const collectedUpdatedFiles = new Set();
const collectedDeletedFiles = new Set();
const projectGraphRecomputationListeners = new Set();
let storedWorkspaceConfigHash;
let waitPeriod = 100;
let scheduledTimeoutId;
let knownExternalNodes = {};
async function getCachedSerializedProjectGraphPromise() {
    try {
        let wasScheduled = false;
        // recomputing it now on demand. we can ignore the scheduled timeout
        if (scheduledTimeoutId) {
            wasScheduled = true;
            clearTimeout(scheduledTimeoutId);
            scheduledTimeoutId = undefined;
        }
        // reset the wait time
        waitPeriod = 100;
        await resetInternalStateIfNxDepsMissing();
        const plugins = await (0, get_plugins_1.getPlugins)();
        if (collectedUpdatedFiles.size == 0 && collectedDeletedFiles.size == 0) {
            if (!cachedSerializedProjectGraphPromise) {
                cachedSerializedProjectGraphPromise =
                    processFilesAndCreateAndSerializeProjectGraph(plugins);
            }
        }
        else {
            cachedSerializedProjectGraphPromise =
                processFilesAndCreateAndSerializeProjectGraph(plugins);
        }
        const result = await cachedSerializedProjectGraphPromise;
        if (wasScheduled) {
            notifyProjectGraphRecomputationListeners(result.projectGraph);
        }
        return result;
    }
    catch (e) {
        return {
            error: e,
            serializedProjectGraph: null,
            serializedSourceMaps: null,
            projectGraph: null,
            projectFileMapCache: null,
            fileMap: null,
            allWorkspaceFiles: null,
            rustReferences: null,
        };
    }
}
function addUpdatedAndDeletedFiles(createdFiles, updatedFiles, deletedFiles) {
    for (let f of [...createdFiles, ...updatedFiles]) {
        collectedDeletedFiles.delete(f);
        collectedUpdatedFiles.add(f);
    }
    for (let f of deletedFiles) {
        collectedUpdatedFiles.delete(f);
        collectedDeletedFiles.add(f);
    }
    if (updatedFiles.length > 0 || deletedFiles.length > 0) {
        (0, file_watcher_sockets_1.notifyFileWatcherSockets)(null, updatedFiles, deletedFiles);
    }
    if (createdFiles.length > 0) {
        waitPeriod = 100; // reset it to process the graph faster
    }
    if (!scheduledTimeoutId) {
        scheduledTimeoutId = setTimeout(async () => {
            scheduledTimeoutId = undefined;
            if (waitPeriod < 4000) {
                waitPeriod = waitPeriod * 2;
            }
            cachedSerializedProjectGraphPromise =
                processFilesAndCreateAndSerializeProjectGraph(await (0, get_plugins_1.getPlugins)());
            const { projectGraph } = await cachedSerializedProjectGraphPromise;
            if (createdFiles.length > 0) {
                (0, file_watcher_sockets_1.notifyFileWatcherSockets)(createdFiles, null, null);
            }
            notifyProjectGraphRecomputationListeners(projectGraph);
        }, waitPeriod);
    }
}
function registerProjectGraphRecomputationListener(listener) {
    projectGraphRecomputationListeners.add(listener);
}
function computeWorkspaceConfigHash(projectsConfigurations) {
    const projectConfigurationStrings = Object.entries(projectsConfigurations)
        .sort(([projectNameA], [projectNameB]) => projectNameA.localeCompare(projectNameB))
        .map(([projectName, projectConfig]) => `${projectName}:${JSON.stringify(projectConfig)}`);
    return (0, file_hasher_1.hashArray)(projectConfigurationStrings);
}
async function processCollectedUpdatedAndDeletedFiles({ projects, externalNodes, projectRootMap }, updatedFileHashes, deletedFiles) {
    try {
        const workspaceConfigHash = computeWorkspaceConfigHash(projects);
        // when workspace config changes we cannot incrementally update project file map
        if (workspaceConfigHash !== storedWorkspaceConfigHash) {
            storedWorkspaceConfigHash = workspaceConfigHash;
            ({ ...exports.fileMapWithFiles } = await (0, retrieve_workspace_files_1.retrieveWorkspaceFiles)(workspace_root_1.workspaceRoot, projectRootMap));
            knownExternalNodes = externalNodes;
        }
        else {
            if (exports.fileMapWithFiles) {
                exports.fileMapWithFiles = (0, file_map_utils_1.updateFileMap)(projects, exports.fileMapWithFiles.rustReferences, updatedFileHashes, deletedFiles);
            }
            else {
                exports.fileMapWithFiles = await (0, retrieve_workspace_files_1.retrieveWorkspaceFiles)(workspace_root_1.workspaceRoot, projectRootMap);
            }
        }
        collectedUpdatedFiles.clear();
        collectedDeletedFiles.clear();
    }
    catch (e) {
        // this is expected
        // for instance, project.json can be incorrect or a file we are trying to has
        // has been deleted
        // we are resetting internal state to start from scratch next time a file changes
        // given the user the opportunity to fix the error
        // if Nx requests the project graph prior to the error being fixed,
        // the error will be propagated
        logger_1.serverLogger.log(`Error detected when recomputing project file map: ${e.message}`);
        resetInternalState();
        throw e;
    }
}
async function processFilesAndCreateAndSerializeProjectGraph(plugins) {
    try {
        perf_hooks_1.performance.mark('hash-watched-changes-start');
        const updatedFiles = [...collectedUpdatedFiles.values()];
        const deletedFiles = [...collectedDeletedFiles.values()];
        let updatedFileHashes = (0, workspace_context_1.updateFilesInContext)(workspace_root_1.workspaceRoot, updatedFiles, deletedFiles);
        perf_hooks_1.performance.mark('hash-watched-changes-end');
        perf_hooks_1.performance.measure('hash changed files from watcher', 'hash-watched-changes-start', 'hash-watched-changes-end');
        logger_1.serverLogger.requestLog(`Updated workspace context based on watched changes, recomputing project graph...`);
        logger_1.serverLogger.requestLog([...updatedFiles.values()]);
        logger_1.serverLogger.requestLog([...deletedFiles]);
        const nxJson = (0, nx_json_1.readNxJson)(workspace_root_1.workspaceRoot);
        global.NX_GRAPH_CREATION = true;
        let projectConfigurationsResult;
        let projectConfigurationsError;
        try {
            projectConfigurationsResult = await (0, retrieve_workspace_files_1.retrieveProjectConfigurations)(plugins, workspace_root_1.workspaceRoot, nxJson);
        }
        catch (e) {
            if (e instanceof error_types_1.ProjectConfigurationsError) {
                projectConfigurationsResult = e.partialProjectConfigurationsResult;
                projectConfigurationsError = e;
            }
            else {
                throw e;
            }
        }
        await processCollectedUpdatedAndDeletedFiles(projectConfigurationsResult, updatedFileHashes, deletedFiles);
        const g = await createAndSerializeProjectGraph(projectConfigurationsResult);
        delete global.NX_GRAPH_CREATION;
        const errors = [...(projectConfigurationsError?.errors ?? [])];
        if (g.error) {
            if ((0, error_types_1.isAggregateProjectGraphError)(g.error) && g.error.errors?.length) {
                errors.push(...g.error.errors);
            }
            else {
                return {
                    error: g.error,
                    projectGraph: null,
                    projectFileMapCache: null,
                    fileMap: null,
                    rustReferences: null,
                    allWorkspaceFiles: null,
                    serializedProjectGraph: null,
                    serializedSourceMaps: null,
                };
            }
        }
        if (errors.length > 0) {
            return {
                error: new error_types_1.DaemonProjectGraphError(errors, g.projectGraph, projectConfigurationsResult.sourceMaps),
                projectGraph: null,
                projectFileMapCache: null,
                fileMap: null,
                rustReferences: null,
                allWorkspaceFiles: null,
                serializedProjectGraph: null,
                serializedSourceMaps: null,
            };
        }
        else {
            (0, nx_deps_cache_1.writeCache)(g.projectFileMapCache, g.projectGraph);
            return g;
        }
    }
    catch (err) {
        return {
            error: err,
            projectGraph: null,
            projectFileMapCache: null,
            fileMap: null,
            rustReferences: null,
            allWorkspaceFiles: null,
            serializedProjectGraph: null,
            serializedSourceMaps: null,
        };
    }
}
function copyFileData(d) {
    return d.map((t) => ({ ...t }));
}
function copyFileMap(m) {
    const c = {
        nonProjectFiles: copyFileData(m.nonProjectFiles),
        projectFileMap: {},
    };
    for (let p of Object.keys(m.projectFileMap)) {
        c.projectFileMap[p] = copyFileData(m.projectFileMap[p]);
    }
    return c;
}
async function createAndSerializeProjectGraph({ projects, sourceMaps, }) {
    try {
        perf_hooks_1.performance.mark('create-project-graph-start');
        const fileMap = copyFileMap(exports.fileMapWithFiles.fileMap);
        const allWorkspaceFiles = copyFileData(exports.fileMapWithFiles.allWorkspaceFiles);
        const rustReferences = exports.fileMapWithFiles.rustReferences;
        const { projectGraph, projectFileMapCache } = await (0, build_project_graph_1.buildProjectGraphUsingProjectFileMap)(projects, knownExternalNodes, fileMap, allWorkspaceFiles, rustReferences, exports.currentProjectFileMapCache || (0, nx_deps_cache_1.readFileMapCache)(), await (0, get_plugins_1.getPlugins)(), sourceMaps);
        exports.currentProjectFileMapCache = projectFileMapCache;
        exports.currentProjectGraph = projectGraph;
        perf_hooks_1.performance.mark('create-project-graph-end');
        perf_hooks_1.performance.measure('total execution time for createProjectGraph()', 'create-project-graph-start', 'create-project-graph-end');
        perf_hooks_1.performance.mark('json-stringify-start');
        const serializedProjectGraph = JSON.stringify(projectGraph);
        const serializedSourceMaps = JSON.stringify(sourceMaps);
        perf_hooks_1.performance.mark('json-stringify-end');
        perf_hooks_1.performance.measure('serialize graph', 'json-stringify-start', 'json-stringify-end');
        return {
            error: null,
            projectGraph,
            projectFileMapCache,
            fileMap,
            allWorkspaceFiles,
            serializedProjectGraph,
            serializedSourceMaps,
            rustReferences,
        };
    }
    catch (e) {
        logger_1.serverLogger.log(`Error detected when creating a project graph: ${e.message}`);
        return {
            error: e,
            projectGraph: null,
            projectFileMapCache: null,
            fileMap: null,
            allWorkspaceFiles: null,
            serializedProjectGraph: null,
            serializedSourceMaps: null,
            rustReferences: null,
        };
    }
}
async function resetInternalState() {
    cachedSerializedProjectGraphPromise = undefined;
    exports.fileMapWithFiles = undefined;
    exports.currentProjectFileMapCache = undefined;
    exports.currentProjectGraph = undefined;
    collectedUpdatedFiles.clear();
    collectedDeletedFiles.clear();
    (0, workspace_context_1.resetWorkspaceContext)();
    waitPeriod = 100;
}
async function resetInternalStateIfNxDepsMissing() {
    try {
        if (!(0, fileutils_1.fileExists)(nx_deps_cache_1.nxProjectGraph) && cachedSerializedProjectGraphPromise) {
            await resetInternalState();
        }
    }
    catch (e) {
        await resetInternalState();
    }
}
function notifyProjectGraphRecomputationListeners(projectGraph) {
    for (const listener of projectGraphRecomputationListeners) {
        listener(projectGraph);
    }
}
