"use strict";
var _ExecutorToPluginMigrator_instances, _ExecutorToPluginMigrator_projectGraph, _ExecutorToPluginMigrator_executor, _ExecutorToPluginMigrator_pluginPath, _ExecutorToPluginMigrator_pluginOptionsBuilder, _ExecutorToPluginMigrator_postTargetTransformer, _ExecutorToPluginMigrator_skipTargetFilter, _ExecutorToPluginMigrator_skipProjectFilter, _ExecutorToPluginMigrator_specificProjectToMigrate, _ExecutorToPluginMigrator_logger, _ExecutorToPluginMigrator_nxJson, _ExecutorToPluginMigrator_targetDefaultsForExecutor, _ExecutorToPluginMigrator_targetAndProjectsToMigrate, _ExecutorToPluginMigrator_createNodes, _ExecutorToPluginMigrator_createNodesV2, _ExecutorToPluginMigrator_createNodesResultsForTargets, _ExecutorToPluginMigrator_skippedProjects, _ExecutorToPluginMigrator_init, _ExecutorToPluginMigrator_migrateTarget, _ExecutorToPluginMigrator_migrateProject, _ExecutorToPluginMigrator_mergeInputs, _ExecutorToPluginMigrator_getTargetAndProjectsToMigrate, _ExecutorToPluginMigrator_getTargetDefaultsForExecutor, _ExecutorToPluginMigrator_getCreatedTargetForProjectRoot, _ExecutorToPluginMigrator_getCreateNodesResults;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NoTargetsToMigrateError = void 0;
exports.migrateProjectExecutorsToPlugin = migrateProjectExecutorsToPlugin;
exports.migrateProjectExecutorsToPluginV1 = migrateProjectExecutorsToPluginV1;
const tslib_1 = require("tslib");
const minimatch_1 = require("minimatch");
const node_assert_1 = require("node:assert");
const posix_1 = require("node:path/posix");
const devkit_exports_1 = require("nx/src/devkit-exports");
const devkit_internals_1 = require("nx/src/devkit-internals");
const executor_options_utils_1 = require("../executor-options-utils");
const plugin_migration_utils_1 = require("./plugin-migration-utils");
const devkit_exports_2 = require("nx/src/devkit-exports");
class ExecutorToPluginMigrator {
    constructor(tree, projectGraph, executor, pluginPath, pluginOptionsBuilder, postTargetTransformer, createNodes, createNodesV2, specificProjectToMigrate, filters, logger) {
        _ExecutorToPluginMigrator_instances.add(this);
        _ExecutorToPluginMigrator_projectGraph.set(this, void 0);
        _ExecutorToPluginMigrator_executor.set(this, void 0);
        _ExecutorToPluginMigrator_pluginPath.set(this, void 0);
        _ExecutorToPluginMigrator_pluginOptionsBuilder.set(this, void 0);
        _ExecutorToPluginMigrator_postTargetTransformer.set(this, void 0);
        _ExecutorToPluginMigrator_skipTargetFilter.set(this, void 0);
        _ExecutorToPluginMigrator_skipProjectFilter.set(this, void 0);
        _ExecutorToPluginMigrator_specificProjectToMigrate.set(this, void 0);
        _ExecutorToPluginMigrator_logger.set(this, void 0);
        _ExecutorToPluginMigrator_nxJson.set(this, void 0);
        _ExecutorToPluginMigrator_targetDefaultsForExecutor.set(this, void 0);
        _ExecutorToPluginMigrator_targetAndProjectsToMigrate.set(this, void 0);
        _ExecutorToPluginMigrator_createNodes.set(this, void 0);
        _ExecutorToPluginMigrator_createNodesV2.set(this, void 0);
        _ExecutorToPluginMigrator_createNodesResultsForTargets.set(this, void 0);
        _ExecutorToPluginMigrator_skippedProjects.set(this, void 0);
        this.tree = tree;
        tslib_1.__classPrivateFieldSet(this, _ExecutorToPluginMigrator_projectGraph, projectGraph, "f");
        tslib_1.__classPrivateFieldSet(this, _ExecutorToPluginMigrator_executor, executor, "f");
        tslib_1.__classPrivateFieldSet(this, _ExecutorToPluginMigrator_pluginPath, pluginPath, "f");
        tslib_1.__classPrivateFieldSet(this, _ExecutorToPluginMigrator_pluginOptionsBuilder, pluginOptionsBuilder, "f");
        tslib_1.__classPrivateFieldSet(this, _ExecutorToPluginMigrator_postTargetTransformer, postTargetTransformer, "f");
        tslib_1.__classPrivateFieldSet(this, _ExecutorToPluginMigrator_createNodes, createNodes, "f");
        tslib_1.__classPrivateFieldSet(this, _ExecutorToPluginMigrator_createNodesV2, createNodesV2, "f");
        tslib_1.__classPrivateFieldSet(this, _ExecutorToPluginMigrator_specificProjectToMigrate, specificProjectToMigrate, "f");
        tslib_1.__classPrivateFieldSet(this, _ExecutorToPluginMigrator_skipProjectFilter, filters?.skipProjectFilter ?? ((...args) => false), "f");
        tslib_1.__classPrivateFieldSet(this, _ExecutorToPluginMigrator_skipTargetFilter, filters?.skipTargetFilter ?? ((...args) => false), "f");
        tslib_1.__classPrivateFieldSet(this, _ExecutorToPluginMigrator_logger, logger ?? devkit_exports_2.logger, "f");
    }
    async run() {
        await tslib_1.__classPrivateFieldGet(this, _ExecutorToPluginMigrator_instances, "m", _ExecutorToPluginMigrator_init).call(this);
        if (tslib_1.__classPrivateFieldGet(this, _ExecutorToPluginMigrator_targetAndProjectsToMigrate, "f").size > 0) {
            for (const targetName of tslib_1.__classPrivateFieldGet(this, _ExecutorToPluginMigrator_targetAndProjectsToMigrate, "f").keys()) {
                await tslib_1.__classPrivateFieldGet(this, _ExecutorToPluginMigrator_instances, "m", _ExecutorToPluginMigrator_migrateTarget).call(this, targetName);
            }
        }
        return tslib_1.__classPrivateFieldGet(this, _ExecutorToPluginMigrator_targetAndProjectsToMigrate, "f");
    }
}
_ExecutorToPluginMigrator_projectGraph = new WeakMap(), _ExecutorToPluginMigrator_executor = new WeakMap(), _ExecutorToPluginMigrator_pluginPath = new WeakMap(), _ExecutorToPluginMigrator_pluginOptionsBuilder = new WeakMap(), _ExecutorToPluginMigrator_postTargetTransformer = new WeakMap(), _ExecutorToPluginMigrator_skipTargetFilter = new WeakMap(), _ExecutorToPluginMigrator_skipProjectFilter = new WeakMap(), _ExecutorToPluginMigrator_specificProjectToMigrate = new WeakMap(), _ExecutorToPluginMigrator_logger = new WeakMap(), _ExecutorToPluginMigrator_nxJson = new WeakMap(), _ExecutorToPluginMigrator_targetDefaultsForExecutor = new WeakMap(), _ExecutorToPluginMigrator_targetAndProjectsToMigrate = new WeakMap(), _ExecutorToPluginMigrator_createNodes = new WeakMap(), _ExecutorToPluginMigrator_createNodesV2 = new WeakMap(), _ExecutorToPluginMigrator_createNodesResultsForTargets = new WeakMap(), _ExecutorToPluginMigrator_skippedProjects = new WeakMap(), _ExecutorToPluginMigrator_instances = new WeakSet(), _ExecutorToPluginMigrator_init = async function _ExecutorToPluginMigrator_init() {
    const nxJson = (0, devkit_exports_1.readNxJson)(this.tree);
    nxJson.plugins ??= [];
    tslib_1.__classPrivateFieldSet(this, _ExecutorToPluginMigrator_nxJson, nxJson, "f");
    tslib_1.__classPrivateFieldSet(this, _ExecutorToPluginMigrator_targetAndProjectsToMigrate, new Map(), "f");
    tslib_1.__classPrivateFieldSet(this, _ExecutorToPluginMigrator_createNodesResultsForTargets, new Map(), "f");
    tslib_1.__classPrivateFieldSet(this, _ExecutorToPluginMigrator_skippedProjects, new Set(), "f");
    tslib_1.__classPrivateFieldGet(this, _ExecutorToPluginMigrator_instances, "m", _ExecutorToPluginMigrator_getTargetDefaultsForExecutor).call(this);
    tslib_1.__classPrivateFieldGet(this, _ExecutorToPluginMigrator_instances, "m", _ExecutorToPluginMigrator_getTargetAndProjectsToMigrate).call(this);
    await tslib_1.__classPrivateFieldGet(this, _ExecutorToPluginMigrator_instances, "m", _ExecutorToPluginMigrator_getCreateNodesResults).call(this);
}, _ExecutorToPluginMigrator_migrateTarget = async function _ExecutorToPluginMigrator_migrateTarget(targetName) {
    for (const projectName of tslib_1.__classPrivateFieldGet(this, _ExecutorToPluginMigrator_targetAndProjectsToMigrate, "f").get(targetName)) {
        await tslib_1.__classPrivateFieldGet(this, _ExecutorToPluginMigrator_instances, "m", _ExecutorToPluginMigrator_migrateProject).call(this, projectName, targetName);
    }
}, _ExecutorToPluginMigrator_migrateProject = async function _ExecutorToPluginMigrator_migrateProject(projectName, targetName) {
    const projectFromGraph = tslib_1.__classPrivateFieldGet(this, _ExecutorToPluginMigrator_projectGraph, "f").nodes[projectName];
    const projectConfig = (0, devkit_exports_1.readProjectConfiguration)(this.tree, projectName);
    const createdTarget = tslib_1.__classPrivateFieldGet(this, _ExecutorToPluginMigrator_instances, "m", _ExecutorToPluginMigrator_getCreatedTargetForProjectRoot).call(this, targetName, projectFromGraph.data.root);
    let projectTarget = projectConfig.targets[targetName];
    projectTarget = (0, devkit_internals_1.mergeTargetConfigurations)(projectTarget, tslib_1.__classPrivateFieldGet(this, _ExecutorToPluginMigrator_targetDefaultsForExecutor, "f"));
    delete projectTarget.executor;
    (0, plugin_migration_utils_1.deleteMatchingProperties)(projectTarget, createdTarget);
    if (projectTarget.inputs && createdTarget.inputs) {
        tslib_1.__classPrivateFieldGet(this, _ExecutorToPluginMigrator_instances, "m", _ExecutorToPluginMigrator_mergeInputs).call(this, projectTarget, createdTarget);
    }
    projectTarget = await tslib_1.__classPrivateFieldGet(this, _ExecutorToPluginMigrator_postTargetTransformer, "f").call(this, projectTarget, this.tree, { projectName, root: projectFromGraph.data.root }, { ...createdTarget, name: targetName });
    if (projectTarget.options &&
        Object.keys(projectTarget.options).length === 0) {
        delete projectTarget.options;
    }
    if (Object.keys(projectTarget).length > 0) {
        projectConfig.targets[targetName] = projectTarget;
    }
    else {
        delete projectConfig.targets[targetName];
    }
    if (!projectConfig['// targets']) {
        projectConfig['// targets'] = `to see all targets run: nx show project ${projectName} --web`;
    }
    (0, devkit_exports_1.updateProjectConfiguration)(this.tree, projectName, projectConfig);
}, _ExecutorToPluginMigrator_mergeInputs = function _ExecutorToPluginMigrator_mergeInputs(target, inferredTarget) {
    const isInputInferred = (input) => {
        return inferredTarget.inputs.some((inferredInput) => {
            try {
                (0, node_assert_1.deepStrictEqual)(input, inferredInput);
                return true;
            }
            catch {
                return false;
            }
        });
    };
    if (target.inputs.every(isInputInferred)) {
        delete target.inputs;
        return;
    }
    const inferredTargetExternalDependencyInput = inferredTarget.inputs.find((i) => typeof i !== 'string' && 'externalDependencies' in i);
    if (!inferredTargetExternalDependencyInput) {
        // plugins should normally have an externalDependencies input, but if it
        // doesn't, there's nothing to merge
        return;
    }
    const targetExternalDependencyInput = target.inputs.find((i) => typeof i !== 'string' && 'externalDependencies' in i);
    if (!targetExternalDependencyInput) {
        // the target doesn't have an externalDependencies input, so we can just
        // add the inferred one
        target.inputs.push(inferredTargetExternalDependencyInput);
    }
    else {
        // the target has an externalDependencies input, so we need to merge them
        targetExternalDependencyInput.externalDependencies = Array.from(new Set([
            ...targetExternalDependencyInput.externalDependencies,
            ...inferredTargetExternalDependencyInput.externalDependencies,
        ]));
    }
}, _ExecutorToPluginMigrator_getTargetAndProjectsToMigrate = function _ExecutorToPluginMigrator_getTargetAndProjectsToMigrate() {
    (0, executor_options_utils_1.forEachExecutorOptions)(this.tree, tslib_1.__classPrivateFieldGet(this, _ExecutorToPluginMigrator_executor, "f"), (options, projectName, targetName, configurationName) => {
        if (tslib_1.__classPrivateFieldGet(this, _ExecutorToPluginMigrator_skippedProjects, "f").has(projectName) || configurationName) {
            return;
        }
        if (tslib_1.__classPrivateFieldGet(this, _ExecutorToPluginMigrator_specificProjectToMigrate, "f") &&
            projectName !== tslib_1.__classPrivateFieldGet(this, _ExecutorToPluginMigrator_specificProjectToMigrate, "f")) {
            return;
        }
        const skipProjectReason = tslib_1.__classPrivateFieldGet(this, _ExecutorToPluginMigrator_skipProjectFilter, "f").call(this, tslib_1.__classPrivateFieldGet(this, _ExecutorToPluginMigrator_projectGraph, "f").nodes[projectName].data);
        if (skipProjectReason) {
            tslib_1.__classPrivateFieldGet(this, _ExecutorToPluginMigrator_skippedProjects, "f").add(projectName);
            const errorMsg = `The "${projectName}" project cannot be migrated. ${skipProjectReason}`;
            if (tslib_1.__classPrivateFieldGet(this, _ExecutorToPluginMigrator_specificProjectToMigrate, "f")) {
                throw new Error(errorMsg);
            }
            tslib_1.__classPrivateFieldGet(this, _ExecutorToPluginMigrator_logger, "f").warn(errorMsg);
            return;
        }
        const skipTargetReason = tslib_1.__classPrivateFieldGet(this, _ExecutorToPluginMigrator_skipTargetFilter, "f").call(this, options, tslib_1.__classPrivateFieldGet(this, _ExecutorToPluginMigrator_projectGraph, "f").nodes[projectName].data);
        if (skipTargetReason) {
            const errorMsg = `The ${targetName} target on project "${projectName}" cannot be migrated. ${skipTargetReason}`;
            if (tslib_1.__classPrivateFieldGet(this, _ExecutorToPluginMigrator_specificProjectToMigrate, "f")) {
                throw new Error(errorMsg);
            }
            else {
                tslib_1.__classPrivateFieldGet(this, _ExecutorToPluginMigrator_logger, "f").warn(errorMsg);
            }
            return;
        }
        if (tslib_1.__classPrivateFieldGet(this, _ExecutorToPluginMigrator_targetAndProjectsToMigrate, "f").has(targetName)) {
            tslib_1.__classPrivateFieldGet(this, _ExecutorToPluginMigrator_targetAndProjectsToMigrate, "f").get(targetName).add(projectName);
        }
        else {
            tslib_1.__classPrivateFieldGet(this, _ExecutorToPluginMigrator_targetAndProjectsToMigrate, "f").set(targetName, new Set([projectName]));
        }
    });
}, _ExecutorToPluginMigrator_getTargetDefaultsForExecutor = function _ExecutorToPluginMigrator_getTargetDefaultsForExecutor() {
    tslib_1.__classPrivateFieldSet(this, _ExecutorToPluginMigrator_targetDefaultsForExecutor, structuredClone(tslib_1.__classPrivateFieldGet(this, _ExecutorToPluginMigrator_nxJson, "f").targetDefaults?.[tslib_1.__classPrivateFieldGet(this, _ExecutorToPluginMigrator_executor, "f")]), "f");
}, _ExecutorToPluginMigrator_getCreatedTargetForProjectRoot = function _ExecutorToPluginMigrator_getCreatedTargetForProjectRoot(targetName, projectRoot) {
    const entry = Object.entries(tslib_1.__classPrivateFieldGet(this, _ExecutorToPluginMigrator_createNodesResultsForTargets, "f").get(targetName)?.projects ?? {}).find(([root]) => root === projectRoot);
    if (!entry) {
        throw new Error(`The nx plugin did not find a project inside ${projectRoot}. File an issue at https://github.com/nrwl/nx with information about your project structure.`);
    }
    const createdProject = entry[1];
    const createdTarget = structuredClone(createdProject.targets[targetName]);
    delete createdTarget.command;
    delete createdTarget.options?.cwd;
    return createdTarget;
}, _ExecutorToPluginMigrator_getCreateNodesResults = async function _ExecutorToPluginMigrator_getCreateNodesResults() {
    if (tslib_1.__classPrivateFieldGet(this, _ExecutorToPluginMigrator_targetAndProjectsToMigrate, "f").size === 0) {
        return;
    }
    global.NX_GRAPH_CREATION = true;
    try {
        for (const targetName of tslib_1.__classPrivateFieldGet(this, _ExecutorToPluginMigrator_targetAndProjectsToMigrate, "f").keys()) {
            const result = await getCreateNodesResultsForPlugin(this.tree, {
                plugin: tslib_1.__classPrivateFieldGet(this, _ExecutorToPluginMigrator_pluginPath, "f"),
                options: tslib_1.__classPrivateFieldGet(this, _ExecutorToPluginMigrator_pluginOptionsBuilder, "f").call(this, targetName),
            }, tslib_1.__classPrivateFieldGet(this, _ExecutorToPluginMigrator_pluginPath, "f"), tslib_1.__classPrivateFieldGet(this, _ExecutorToPluginMigrator_createNodes, "f"), tslib_1.__classPrivateFieldGet(this, _ExecutorToPluginMigrator_createNodesV2, "f"), tslib_1.__classPrivateFieldGet(this, _ExecutorToPluginMigrator_nxJson, "f"));
            tslib_1.__classPrivateFieldGet(this, _ExecutorToPluginMigrator_createNodesResultsForTargets, "f").set(targetName, result);
        }
    }
    finally {
        global.NX_GRAPH_CREATION = false;
    }
};
class NoTargetsToMigrateError extends Error {
    constructor() {
        super('Could not find any targets to migrate.');
    }
}
exports.NoTargetsToMigrateError = NoTargetsToMigrateError;
async function migrateProjectExecutorsToPlugin(tree, projectGraph, pluginPath, createNodesV2, defaultPluginOptions, migrations, specificProjectToMigrate, logger) {
    const projects = await migrateProjects(tree, projectGraph, pluginPath, undefined, createNodesV2, defaultPluginOptions, migrations, specificProjectToMigrate, logger);
    return projects;
}
async function migrateProjectExecutorsToPluginV1(tree, projectGraph, pluginPath, createNodes, defaultPluginOptions, migrations, specificProjectToMigrate) {
    const projects = await migrateProjects(tree, projectGraph, pluginPath, createNodes, undefined, defaultPluginOptions, migrations, specificProjectToMigrate);
    return projects;
}
async function migrateProjects(tree, projectGraph, pluginPath, createNodes, createNodesV2, defaultPluginOptions, migrations, specificProjectToMigrate, logger) {
    const projects = new Map();
    for (const migration of migrations) {
        for (const executor of migration.executors) {
            const migrator = new ExecutorToPluginMigrator(tree, projectGraph, executor, pluginPath, migration.targetPluginOptionMapper, migration.postTargetTransformer, createNodes, createNodesV2, specificProjectToMigrate, {
                skipProjectFilter: migration.skipProjectFilter,
                skipTargetFilter: migration.skipTargetFilter,
            }, logger);
            const result = await migrator.run();
            // invert the result to have a map of projects to their targets
            for (const [target, projectList] of result.entries()) {
                for (const project of projectList) {
                    if (!projects.has(project)) {
                        projects.set(project, {});
                    }
                    projects.set(project, {
                        ...projects.get(project),
                        ...migration.targetPluginOptionMapper(target),
                    });
                }
            }
        }
    }
    // apply default options
    for (const [project, pluginOptions] of projects.entries()) {
        projects.set(project, {
            ...defaultPluginOptions,
            ...pluginOptions,
        });
    }
    await addPluginRegistrations(tree, projects, pluginPath, createNodes, createNodesV2, defaultPluginOptions, projectGraph);
    return projects;
}
async function addPluginRegistrations(tree, projects, pluginPath, createNodes, createNodesV2, defaultPluginOptions, projectGraph) {
    const nxJson = (0, devkit_exports_1.readNxJson)(tree);
    // collect createNodes results for each project before adding the plugins
    const createNodesResults = new Map();
    global.NX_GRAPH_CREATION = true;
    try {
        for (const [project, options] of projects.entries()) {
            const projectConfigs = await getCreateNodesResultsForPlugin(tree, { plugin: pluginPath, options }, pluginPath, createNodes, createNodesV2, nxJson);
            createNodesResults.set(project, projectConfigs);
        }
    }
    finally {
        global.NX_GRAPH_CREATION = false;
    }
    const arePluginIncludesRequired = async (project, pluginConfiguration) => {
        global.NX_GRAPH_CREATION = true;
        let result;
        try {
            result = await getCreateNodesResultsForPlugin(tree, pluginConfiguration, pluginPath, createNodes, createNodesV2, nxJson);
        }
        finally {
            global.NX_GRAPH_CREATION = false;
        }
        const originalResults = createNodesResults.get(project);
        return !deepEqual(originalResults, result);
    };
    for (const [project, options] of projects.entries()) {
        const existingPlugin = nxJson.plugins?.find((plugin) => typeof plugin !== 'string' &&
            plugin.plugin === pluginPath &&
            Object.keys(options).every((key) => plugin.options[key] === options[key] ||
                (plugin.options[key] === undefined &&
                    options[key] === defaultPluginOptions[key])));
        const projectIncludeGlob = projectGraph.nodes[project].data.root === '.'
            ? '*'
            : (0, posix_1.join)(projectGraph.nodes[project].data.root, '**/*');
        if (!existingPlugin) {
            nxJson.plugins ??= [];
            const plugin = {
                plugin: pluginPath,
                options,
                include: [projectIncludeGlob],
            };
            if (!(await arePluginIncludesRequired(project, plugin))) {
                delete plugin.include;
            }
            nxJson.plugins.push(plugin);
        }
        else if (existingPlugin.include) {
            if (!existingPlugin.include.some((include) => (0, minimatch_1.minimatch)(projectIncludeGlob, include, { dot: true }))) {
                existingPlugin.include.push(projectIncludeGlob);
                if (!(await arePluginIncludesRequired(project, existingPlugin))) {
                    delete existingPlugin.include;
                }
            }
        }
    }
    (0, devkit_exports_1.updateNxJson)(tree, nxJson);
}
async function getCreateNodesResultsForPlugin(tree, pluginConfiguration, pluginPath, createNodes, createNodesV2, nxJson) {
    let projectConfigs;
    try {
        const plugin = new devkit_internals_1.LoadedNxPlugin({ createNodes, createNodesV2, name: pluginPath }, pluginConfiguration);
        projectConfigs = await (0, devkit_internals_1.retrieveProjectConfigurations)([plugin], tree.root, nxJson);
    }
    catch (e) {
        if (e instanceof devkit_internals_1.ProjectConfigurationsError) {
            projectConfigs = e.partialProjectConfigurationsResult;
        }
        else {
            throw e;
        }
    }
    return projectConfigs;
}
// Checks if two objects are structurely equal, without caring
// about the order of the keys.
function deepEqual(a, b, logKey = '') {
    const aKeys = Object.keys(a);
    const bKeys = new Set(Object.keys(b));
    if (aKeys.length !== bKeys.size) {
        return false;
    }
    for (const key of aKeys) {
        if (!bKeys.has(key)) {
            return false;
        }
        if (typeof a[key] === 'object' && typeof b[key] === 'object') {
            if (!deepEqual(a[key], b[key], logKey + '.' + key)) {
                return false;
            }
        }
        else if (a[key] !== b[key]) {
            return false;
        }
    }
    return true;
}
