"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getHoistedPackageVersion = getHoistedPackageVersion;
exports.normalizePackageJson = normalizePackageJson;
const fs_1 = require("fs");
const workspace_root_1 = require("../../../../utils/workspace-root");
/**
 * Get version of hoisted package if available
 */
function getHoistedPackageVersion(packageName) {
    const fullPath = `${workspace_root_1.workspaceRoot}/node_modules/${packageName}/package.json`;
    if ((0, fs_1.existsSync)(fullPath)) {
        const content = (0, fs_1.readFileSync)(fullPath, 'utf-8');
        return JSON.parse(content)?.version;
    }
    return;
}
/**
 * Strip off non-pruning related fields from package.json
 */
function normalizePackageJson(packageJson) {
    const { name, version, license, dependencies, devDependencies, peerDependencies, peerDependenciesMeta, optionalDependencies, } = packageJson;
    return {
        name,
        version,
        license,
        dependencies,
        devDependencies,
        peerDependencies,
        peerDependenciesMeta,
        optionalDependencies,
    };
}
