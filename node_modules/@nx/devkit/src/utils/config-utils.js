"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dynamicImport = void 0;
exports.loadConfigFile = loadConfigFile;
exports.getRootTsConfigPath = getRootTsConfigPath;
exports.getRootTsConfigFileName = getRootTsConfigFileName;
exports.clearRequireCache = clearRequireCache;
const path_1 = require("path");
const fs_1 = require("fs");
const node_url_1 = require("node:url");
const devkit_exports_1 = require("nx/src/devkit-exports");
const devkit_internals_1 = require("nx/src/devkit-internals");
exports.dynamicImport = new Function('modulePath', 'return import(modulePath);');
async function loadConfigFile(configFilePath) {
    {
        let module;
        if ((0, path_1.extname)(configFilePath) === '.ts') {
            const siblingFiles = (0, fs_1.readdirSync)((0, path_1.dirname)(configFilePath));
            const tsConfigPath = siblingFiles.includes('tsconfig.json')
                ? (0, path_1.join)((0, path_1.dirname)(configFilePath), 'tsconfig.json')
                : getRootTsConfigPath();
            if (tsConfigPath) {
                const unregisterTsProject = (0, devkit_internals_1.registerTsProject)(tsConfigPath);
                try {
                    module = await load(configFilePath);
                }
                finally {
                    unregisterTsProject();
                }
            }
            else {
                module = await load(configFilePath);
            }
        }
        else {
            module = await load(configFilePath);
        }
        return module.default ?? module;
    }
}
function getRootTsConfigPath() {
    const tsConfigFileName = getRootTsConfigFileName();
    return tsConfigFileName ? (0, path_1.join)(devkit_exports_1.workspaceRoot, tsConfigFileName) : null;
}
function getRootTsConfigFileName() {
    for (const tsConfigName of ['tsconfig.base.json', 'tsconfig.json']) {
        const pathExists = (0, fs_1.existsSync)((0, path_1.join)(devkit_exports_1.workspaceRoot, tsConfigName));
        if (pathExists) {
            return tsConfigName;
        }
    }
    return null;
}
const packageInstallationDirectories = [
    `${path_1.sep}node_modules${path_1.sep}`,
    `${path_1.sep}.yarn${path_1.sep}`,
];
function clearRequireCache() {
    for (const k of Object.keys(require.cache)) {
        if (!packageInstallationDirectories.some((dir) => k.includes(dir))) {
            delete require.cache[k];
        }
    }
}
/**
 * Load the module after ensuring that the require cache is cleared.
 */
async function load(path) {
    // Clear cache if the path is in the cache
    if (require.cache[path]) {
        clearRequireCache();
    }
    try {
        // Try using `require` first, which works for CJS modules.
        // Modules are CJS unless it is named `.mjs` or `package.json` sets type to "module".
        return require(path);
    }
    catch (e) {
        if (e.code === 'ERR_REQUIRE_ESM') {
            // If `require` fails to load ESM, try dynamic `import()`. ESM requires file url protocol for handling absolute paths.
            const pathAsFileUrl = (0, node_url_1.pathToFileURL)(path).pathname;
            return await (0, exports.dynamicImport)(`${pathAsFileUrl}?t=${Date.now()}`);
        }
        // Re-throw all other errors
        throw e;
    }
}
