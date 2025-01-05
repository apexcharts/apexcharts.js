"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.readNxJson = readNxJson;
exports.hasNxJson = hasNxJson;
const fs_1 = require("fs");
const path_1 = require("path");
const fileutils_1 = require("../utils/fileutils");
const workspace_root_1 = require("../utils/workspace-root");
function readNxJson(root = workspace_root_1.workspaceRoot) {
    const nxJson = (0, path_1.join)(root, 'nx.json');
    if ((0, fs_1.existsSync)(nxJson)) {
        const nxJsonConfiguration = (0, fileutils_1.readJsonFile)(nxJson);
        if (nxJsonConfiguration.extends) {
            const extendedNxJsonPath = require.resolve(nxJsonConfiguration.extends, {
                paths: [(0, path_1.dirname)(nxJson)],
            });
            const baseNxJson = (0, fileutils_1.readJsonFile)(extendedNxJsonPath);
            return {
                ...baseNxJson,
                ...nxJsonConfiguration,
            };
        }
        else {
            return nxJsonConfiguration;
        }
    }
    else {
        try {
            return (0, fileutils_1.readJsonFile)((0, path_1.join)(__dirname, '..', '..', 'presets', 'core.json'));
        }
        catch (e) {
            return {};
        }
    }
}
function hasNxJson(root) {
    const nxJson = (0, path_1.join)(root, 'nx.json');
    return (0, fs_1.existsSync)(nxJson);
}
