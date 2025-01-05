"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNamedInputs = getNamedInputs;
const path_1 = require("path");
const fs_1 = require("fs");
const devkit_exports_1 = require("nx/src/devkit-exports");
/**
 * Get the named inputs available for a directory
 */
function getNamedInputs(directory, context) {
    const projectJsonPath = (0, path_1.join)(directory, 'project.json');
    const projectJson = (0, fs_1.existsSync)(projectJsonPath)
        ? (0, devkit_exports_1.readJsonFile)(projectJsonPath)
        : null;
    const packageJsonPath = (0, path_1.join)(directory, 'package.json');
    const packageJson = (0, fs_1.existsSync)(packageJsonPath)
        ? (0, devkit_exports_1.readJsonFile)(packageJsonPath)
        : null;
    return {
        ...context.nxJsonConfiguration.namedInputs,
        ...packageJson?.nx?.namedInputs,
        ...projectJson?.namedInputs,
    };
}
