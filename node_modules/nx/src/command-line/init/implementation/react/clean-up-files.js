"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanUpFiles = cleanUpFiles;
const node_fs_1 = require("node:fs");
const fileutils_1 = require("../../../../utils/fileutils");
function cleanUpFiles(appName, isStandalone) {
    // Delete targets from project since we delegate to npm scripts.
    const projectJsonPath = isStandalone
        ? 'project.json'
        : `apps/${appName}/project.json`;
    const json = (0, fileutils_1.readJsonFile)(projectJsonPath);
    delete json.targets;
    if (isStandalone) {
        if (json.sourceRoot) {
            json.sourceRoot = json.sourceRoot.replace(`apps/${appName}/`, '');
        }
        if (json['$schema']) {
            json['$schema'] = json['$schema'].replace('../../node_modules', 'node_modules');
        }
    }
    (0, fileutils_1.writeJsonFile)(projectJsonPath, json);
    (0, node_fs_1.rmSync)('temp-workspace', { recursive: true, force: true });
    if (isStandalone) {
        (0, node_fs_1.rmSync)('babel.config.json', { recursive: true, force: true });
        (0, node_fs_1.rmSync)('jest.preset.js', { recursive: true, force: true });
        (0, node_fs_1.rmSync)('jest.config.ts', { recursive: true, force: true });
        (0, node_fs_1.rmSync)('libs', { recursive: true, force: true });
        (0, node_fs_1.rmSync)('tools', { recursive: true, force: true });
    }
}
