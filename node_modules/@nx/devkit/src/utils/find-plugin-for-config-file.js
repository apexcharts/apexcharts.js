"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findPluginForConfigFile = findPluginForConfigFile;
const devkit_exports_1 = require("nx/src/devkit-exports");
const devkit_internals_1 = require("nx/src/devkit-internals");
async function findPluginForConfigFile(tree, pluginName, pathToConfigFile) {
    const nxJson = (0, devkit_exports_1.readNxJson)(tree);
    if (!nxJson.plugins) {
        return;
    }
    const pluginRegistrations = nxJson.plugins.filter((p) => (typeof p === 'string' ? p === pluginName : p.plugin === pluginName));
    for (const plugin of pluginRegistrations) {
        if (typeof plugin === 'string') {
            return plugin;
        }
        if (!plugin.include && !plugin.exclude) {
            return plugin;
        }
        if (plugin.include || plugin.exclude) {
            const resolvedPlugin = await Promise.resolve(`${pluginName}`).then(s => require(s));
            const pluginGlob = resolvedPlugin.createNodesV2?.[0] ?? resolvedPlugin.createNodes?.[0];
            const matchingConfigFile = (0, devkit_internals_1.findMatchingConfigFiles)([pathToConfigFile], pluginGlob, plugin.include, plugin.exclude);
            if (matchingConfigFile.length) {
                return plugin;
            }
        }
    }
}
