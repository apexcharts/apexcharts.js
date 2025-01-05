"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.replaceProjectConfigurationsWithPlugin = replaceProjectConfigurationsWithPlugin;
const devkit_exports_1 = require("nx/src/devkit-exports");
const devkit_internals_1 = require("nx/src/devkit-internals");
async function replaceProjectConfigurationsWithPlugin(tree, rootMappings, pluginPath, createNodes, pluginOptions) {
    const nxJson = (0, devkit_exports_1.readNxJson)(tree);
    const hasPlugin = nxJson.plugins?.some((p) => typeof p === 'string' ? p === pluginPath : p.plugin === pluginPath);
    if (hasPlugin) {
        return;
    }
    nxJson.plugins ??= [];
    nxJson.plugins.push({
        plugin: pluginPath,
        options: pluginOptions,
    });
    (0, devkit_exports_1.updateNxJson)(tree, nxJson);
    const [pluginGlob, createNodesFunction] = createNodes;
    const configFiles = (0, devkit_exports_1.glob)(tree, [pluginGlob]);
    for (const configFile of configFiles) {
        try {
            const projectName = (0, devkit_internals_1.findProjectForPath)(configFile, rootMappings);
            const projectConfig = (0, devkit_exports_1.readProjectConfiguration)(tree, projectName);
            const nodes = await createNodesFunction(configFile, pluginOptions, {
                workspaceRoot: tree.root,
                nxJsonConfiguration: (0, devkit_exports_1.readNxJson)(tree),
                configFiles,
            });
            const node = nodes.projects[Object.keys(nodes.projects)[0]];
            for (const [targetName, targetConfig] of Object.entries(node.targets)) {
                const targetFromProjectConfig = projectConfig.targets[targetName];
                if (targetFromProjectConfig?.executor !== targetConfig.executor) {
                    continue;
                }
                const targetFromCreateNodes = node.targets[targetName];
                removeConfigurationDefinedByPlugin(targetName, targetFromProjectConfig, targetFromCreateNodes, projectConfig);
            }
            (0, devkit_exports_1.updateProjectConfiguration)(tree, projectName, projectConfig);
        }
        catch (e) {
            console.error(e);
        }
    }
}
function removeConfigurationDefinedByPlugin(targetName, targetFromProjectConfig, targetFromCreateNodes, projectConfig) {
    // Executor
    delete targetFromProjectConfig.executor;
    // Default Configuration
    if (targetFromProjectConfig.defaultConfiguration ===
        targetFromCreateNodes.defaultConfiguration) {
        delete targetFromProjectConfig.defaultConfiguration;
    }
    // Cache
    if (targetFromProjectConfig.cache === targetFromCreateNodes.cache) {
        delete targetFromProjectConfig.cache;
    }
    // Depends On
    if (targetFromProjectConfig.dependsOn &&
        shouldRemoveArrayProperty(targetFromProjectConfig.dependsOn, targetFromCreateNodes.dependsOn)) {
        delete targetFromProjectConfig.dependsOn;
    }
    // Outputs
    if (targetFromProjectConfig.outputs &&
        shouldRemoveArrayProperty(targetFromProjectConfig.outputs, targetFromCreateNodes.outputs)) {
        delete targetFromProjectConfig.outputs;
    }
    // Inputs
    if (targetFromProjectConfig.inputs &&
        shouldRemoveArrayProperty(targetFromProjectConfig.inputs, targetFromCreateNodes.inputs)) {
        delete targetFromProjectConfig.inputs;
    }
    // Options
    for (const [optionName, optionValue] of Object.entries(targetFromProjectConfig.options ?? {})) {
        if (equals(targetFromCreateNodes.options[optionName], optionValue)) {
            delete targetFromProjectConfig.options[optionName];
        }
    }
    if (Object.keys(targetFromProjectConfig.options).length === 0) {
        delete targetFromProjectConfig.options;
    }
    // Configurations
    for (const [configName, configOptions] of Object.entries(targetFromProjectConfig.configurations ?? {})) {
        for (const [optionName, optionValue] of Object.entries(configOptions)) {
            if (targetFromCreateNodes.configurations?.[configName]?.[optionName] ===
                optionValue) {
                delete targetFromProjectConfig.configurations[configName][optionName];
            }
        }
        if (Object.keys(configOptions).length === 0) {
            delete targetFromProjectConfig.configurations[configName];
        }
    }
    if (Object.keys(targetFromProjectConfig.configurations ?? {}).length === 0) {
        delete targetFromProjectConfig.configurations;
    }
    if (Object.keys(targetFromProjectConfig).length === 0) {
        delete projectConfig.targets[targetName];
    }
}
function equals(a, b) {
    if (Array.isArray(a) && Array.isArray(b)) {
        return a.length === b.length && a.every((v, i) => v === b[i]);
    }
    if (typeof a === 'object' && typeof b === 'object') {
        return (0, devkit_internals_1.hashObject)(a) === (0, devkit_internals_1.hashObject)(b);
    }
    return a === b;
}
function shouldRemoveArrayProperty(arrayValuesFromProjectConfiguration, arrayValuesFromCreateNodes) {
    const setOfArrayValuesFromProjectConfiguration = new Set(arrayValuesFromProjectConfiguration);
    loopThroughArrayValuesFromCreateNodes: for (const arrayValueFromCreateNodes of arrayValuesFromCreateNodes) {
        if (typeof arrayValueFromCreateNodes === 'string') {
            if (!setOfArrayValuesFromProjectConfiguration.has(arrayValueFromCreateNodes)) {
                // If the inputs from the project configuration is missing an input from createNodes it was removed
                return false;
            }
            else {
                setOfArrayValuesFromProjectConfiguration.delete(arrayValueFromCreateNodes);
            }
        }
        else {
            for (const arrayValue of setOfArrayValuesFromProjectConfiguration.values()) {
                if (typeof arrayValue !== 'string' &&
                    (0, devkit_internals_1.hashObject)(arrayValue) === (0, devkit_internals_1.hashObject)(arrayValueFromCreateNodes)) {
                    setOfArrayValuesFromProjectConfiguration.delete(arrayValue);
                    // Continue the outer loop, breaking out of this loop
                    continue loopThroughArrayValuesFromCreateNodes;
                }
            }
            // If an input was not matched, that means the input was removed
            return false;
        }
    }
    // If there are still inputs in the project configuration, they have added additional inputs
    return setOfArrayValuesFromProjectConfiguration.size === 0;
}
