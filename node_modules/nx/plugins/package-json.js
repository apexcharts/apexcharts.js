"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.readPackageJsonConfigurationCache = readPackageJsonConfigurationCache;
const plugins_1 = require("../src/project-graph/plugins");
const workspace_root_1 = require("../src/utils/workspace-root");
const package_json_1 = require("../src/plugins/package-json");
const cache_directory_1 = require("../src/utils/cache-directory");
const path_1 = require("path");
const fileutils_1 = require("../src/utils/fileutils");
const cachePath = (0, path_1.join)(cache_directory_1.workspaceDataDirectory, 'package-json.hash');
function readPackageJsonConfigurationCache() {
    try {
        return (0, fileutils_1.readJsonFile)(cachePath);
    }
    catch (e) {
        return {};
    }
}
function writeCache(cache) {
    (0, fileutils_1.writeJsonFile)(cachePath, cache);
}
const plugin = {
    name: 'nx-all-package-jsons-plugin',
    createNodesV2: [
        '*/**/package.json',
        (configFiles, options, context) => {
            const cache = readPackageJsonConfigurationCache();
            const result = (0, plugins_1.createNodesFromFiles)((f) => (0, package_json_1.createNodeFromPackageJson)(f, workspace_root_1.workspaceRoot, cache), configFiles, options, context);
            writeCache(cache);
            return result;
        },
    ],
};
module.exports = plugin;
module.exports.readPackageJsonConfigurationCache =
    readPackageJsonConfigurationCache;
