"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getE2EWebServerInfo = getE2EWebServerInfo;
const devkit_exports_1 = require("nx/src/devkit-exports");
const find_plugin_for_config_file_1 = require("../utils/find-plugin-for-config-file");
async function getE2EWebServerInfo(tree, projectName, pluginOptions, defaultValues, isPluginBeingAdded) {
    const pm = (0, devkit_exports_1.getPackageManagerCommand)();
    if (isPluginBeingAdded) {
        return await getE2EWebServerInfoForPlugin(tree, projectName, pluginOptions, defaultValues, pm);
    }
    else {
        return {
            e2eWebServerAddress: defaultValues.defaultE2EWebServerAddress,
            e2eWebServerCommand: `${pm.exec} nx run ${projectName}:${defaultValues.defaultServeTargetName}`,
            e2eCiWebServerCommand: `${pm.exec} nx run ${projectName}:${defaultValues.defaultServeStaticTargetName}`,
            e2eCiBaseUrl: defaultValues.defaultE2ECiBaseUrl,
            e2eDevServerTarget: `${projectName}:${defaultValues.defaultServeTargetName}`,
        };
    }
}
async function getE2EWebServerInfoForPlugin(tree, projectName, pluginOptions, defaultValues, pm) {
    const foundPlugin = await (0, find_plugin_for_config_file_1.findPluginForConfigFile)(tree, pluginOptions.plugin, pluginOptions.configFilePath);
    if (!foundPlugin ||
        typeof foundPlugin === 'string' ||
        !foundPlugin?.options) {
        return {
            e2eWebServerAddress: defaultValues.defaultE2EWebServerAddress,
            e2eWebServerCommand: `${pm.exec} nx run ${projectName}:${defaultValues.defaultServeTargetName}`,
            e2eCiWebServerCommand: `${pm.exec} nx run ${projectName}:${defaultValues.defaultServeStaticTargetName}`,
            e2eCiBaseUrl: defaultValues.defaultE2ECiBaseUrl,
            e2eDevServerTarget: `${projectName}:${defaultValues.defaultServeTargetName}`,
        };
    }
    const nxJson = (0, devkit_exports_1.readNxJson)(tree);
    let e2ePort = defaultValues.defaultE2EPort ?? 4200;
    if (nxJson.targetDefaults?.[foundPlugin.options[pluginOptions.serveTargetName] ??
        defaultValues.defaultServeTargetName] &&
        nxJson.targetDefaults?.[foundPlugin.options[pluginOptions.serveTargetName] ??
            defaultValues.defaultServeTargetName].options?.port) {
        e2ePort =
            nxJson.targetDefaults?.[foundPlugin.options[pluginOptions.serveTargetName] ??
                defaultValues.defaultServeTargetName].options?.port;
    }
    const e2eWebServerAddress = defaultValues.defaultE2EWebServerAddress.replace(/:\d+/, `:${e2ePort}`);
    return {
        e2eWebServerAddress,
        e2eWebServerCommand: `${pm.exec} nx run ${projectName}:${foundPlugin.options[pluginOptions.serveTargetName] ??
            defaultValues.defaultServeTargetName}`,
        e2eCiWebServerCommand: `${pm.exec} nx run ${projectName}:${foundPlugin.options[pluginOptions.serveStaticTargetName] ??
            defaultValues.defaultServeStaticTargetName}`,
        e2eCiBaseUrl: defaultValues.defaultE2ECiBaseUrl,
        e2eDevServerTarget: `${projectName}:${foundPlugin.options[pluginOptions.serveTargetName] ??
            defaultValues.defaultServeTargetName}`,
    };
}
