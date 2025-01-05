"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listPlugins = listPlugins;
exports.listAlsoAvailableCorePlugins = listAlsoAvailableCorePlugins;
exports.listPowerpackPlugins = listPowerpackPlugins;
exports.listPluginCapabilities = listPluginCapabilities;
const chalk = require("chalk");
const output_1 = require("../output");
const package_manager_1 = require("../package-manager");
const workspace_root_1 = require("../workspace-root");
const core_plugins_1 = require("./core-plugins");
const plugin_capabilities_1 = require("./plugin-capabilities");
const package_json_1 = require("../package-json");
function listPlugins(plugins, title) {
    package_json_1.readModulePackageJson;
    const bodyLines = [];
    for (const [, p] of plugins) {
        const capabilities = [];
        if (hasElements(p.executors)) {
            capabilities.push('executors');
        }
        if (hasElements(p.generators)) {
            capabilities.push('generators');
        }
        if (p.projectGraphExtension) {
            capabilities.push('graph-extension');
        }
        if (p.projectInference) {
            capabilities.push('project-inference');
        }
        bodyLines.push(`${chalk.bold(p.name)} ${capabilities.length >= 1 ? `(${capabilities.join()})` : ''}`);
    }
    output_1.output.log({
        title: title,
        bodyLines: bodyLines,
    });
}
function listAlsoAvailableCorePlugins(installedPlugins) {
    const alsoAvailable = core_plugins_1.CORE_PLUGINS.filter((p) => !installedPlugins.has(p.name));
    if (alsoAvailable.length) {
        output_1.output.log({
            title: `Also available:`,
            bodyLines: alsoAvailable.map((p) => {
                return `${chalk.bold(p.name)} (${p.capabilities})`;
            }),
        });
    }
}
function listPowerpackPlugins() {
    const powerpackLink = 'https://nx.dev/plugin-registry#powerpack';
    output_1.output.log({
        title: `Available Powerpack Plugins: ${powerpackLink}`,
    });
}
async function listPluginCapabilities(pluginName, projects) {
    const plugin = await (0, plugin_capabilities_1.getPluginCapabilities)(workspace_root_1.workspaceRoot, pluginName, projects);
    if (!plugin) {
        const pmc = (0, package_manager_1.getPackageManagerCommand)();
        output_1.output.note({
            title: `${pluginName} is not currently installed`,
            bodyLines: [
                `Use "${pmc.addDev} ${pluginName}" to install the plugin.`,
                `After that, use "${pmc.exec} nx g ${pluginName}:init" to add the required peer deps and initialize the plugin.`,
            ],
        });
        return;
    }
    const hasBuilders = hasElements(plugin.executors);
    const hasGenerators = hasElements(plugin.generators);
    const hasProjectGraphExtension = !!plugin.projectGraphExtension;
    const hasProjectInference = !!plugin.projectInference;
    if (!hasBuilders &&
        !hasGenerators &&
        !hasProjectGraphExtension &&
        !hasProjectInference) {
        output_1.output.warn({ title: `No capabilities found in ${pluginName}` });
        return;
    }
    const bodyLines = [];
    if (hasGenerators) {
        bodyLines.push(chalk.bold(chalk.green('GENERATORS')));
        bodyLines.push('');
        bodyLines.push(...Object.keys(plugin.generators).map((name) => `${chalk.bold(name)} : ${plugin.generators[name].description}`));
        if (hasBuilders) {
            bodyLines.push('');
        }
    }
    if (hasBuilders) {
        bodyLines.push(chalk.bold(chalk.green('EXECUTORS/BUILDERS')));
        bodyLines.push('');
        bodyLines.push(...Object.keys(plugin.executors).map((name) => {
            const definition = plugin.executors[name];
            return typeof definition === 'string'
                ? chalk.bold(name)
                : `${chalk.bold(name)} : ${definition.description}`;
        }));
    }
    if (hasProjectGraphExtension) {
        bodyLines.push(`✔️  Project Graph Extension`);
    }
    if (hasProjectInference) {
        bodyLines.push(`✔️  Project Inference`);
    }
    output_1.output.log({
        title: `Capabilities in ${plugin.name}:`,
        bodyLines,
    });
}
function hasElements(obj) {
    return obj && Object.values(obj).length > 0;
}
