"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addBuildTargetDefaults = addBuildTargetDefaults;
exports.addE2eCiTargetDefaults = addE2eCiTargetDefaults;
const devkit_exports_1 = require("nx/src/devkit-exports");
const devkit_internals_1 = require("nx/src/devkit-internals");
function addBuildTargetDefaults(tree, executorName, buildTargetName = 'build') {
    const nxJson = (0, devkit_exports_1.readNxJson)(tree);
    nxJson.targetDefaults ??= {};
    nxJson.targetDefaults[executorName] ??= {
        cache: true,
        dependsOn: [`^${buildTargetName}`],
        inputs: nxJson.namedInputs && 'production' in nxJson.namedInputs
            ? ['production', '^production']
            : ['default', '^default'],
    };
    (0, devkit_exports_1.updateNxJson)(tree, nxJson);
}
async function addE2eCiTargetDefaults(tree, e2ePlugin, buildTarget, pathToE2EConfigFile) {
    const nxJson = (0, devkit_exports_1.readNxJson)(tree);
    if (!nxJson.plugins) {
        return;
    }
    const e2ePluginRegistrations = nxJson.plugins.filter((p) => typeof p === 'string' ? p === e2ePlugin : p.plugin === e2ePlugin);
    if (!e2ePluginRegistrations.length) {
        return;
    }
    const resolvedE2ePlugin = await Promise.resolve(`${e2ePlugin}`).then(s => require(s));
    const e2ePluginGlob = resolvedE2ePlugin.createNodesV2?.[0] ?? resolvedE2ePlugin.createNodes?.[0];
    let foundPluginForApplication;
    for (let i = 0; i < e2ePluginRegistrations.length; i++) {
        let candidatePluginForApplication = e2ePluginRegistrations[i];
        if (typeof candidatePluginForApplication === 'string') {
            foundPluginForApplication = candidatePluginForApplication;
            break;
        }
        const matchingConfigFiles = (0, devkit_internals_1.findMatchingConfigFiles)([pathToE2EConfigFile], e2ePluginGlob, candidatePluginForApplication.include, candidatePluginForApplication.exclude);
        if (matchingConfigFiles.length) {
            foundPluginForApplication = candidatePluginForApplication;
            break;
        }
    }
    if (!foundPluginForApplication) {
        return;
    }
    const ciTargetName = typeof foundPluginForApplication === 'string'
        ? 'e2e-ci'
        : foundPluginForApplication.options?.ciTargetName ?? 'e2e-ci';
    const ciTargetNameGlob = `${ciTargetName}--**/*`;
    nxJson.targetDefaults ??= {};
    const e2eCiTargetDefaults = nxJson.targetDefaults[ciTargetNameGlob];
    if (!e2eCiTargetDefaults) {
        nxJson.targetDefaults[ciTargetNameGlob] = {
            dependsOn: [buildTarget],
        };
    }
    else {
        e2eCiTargetDefaults.dependsOn ??= [];
        if (!e2eCiTargetDefaults.dependsOn.includes(buildTarget)) {
            e2eCiTargetDefaults.dependsOn.push(buildTarget);
        }
    }
    (0, devkit_exports_1.updateNxJson)(tree, nxJson);
}
