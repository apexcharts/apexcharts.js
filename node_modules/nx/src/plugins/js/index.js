"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDependencies = exports.createNodes = exports.name = void 0;
const fs_1 = require("fs");
const path_1 = require("path");
const perf_hooks_1 = require("perf_hooks");
const cache_directory_1 = require("../../utils/cache-directory");
const globs_1 = require("../../utils/globs");
const lock_file_1 = require("./lock-file/lock-file");
const build_dependencies_1 = require("./project-graph/build-dependencies/build-dependencies");
const config_1 = require("./utils/config");
const file_hasher_1 = require("../../hasher/file-hasher");
const package_manager_1 = require("../../utils/package-manager");
const workspace_root_1 = require("../../utils/workspace-root");
const versions_1 = require("../../utils/versions");
const child_process_1 = require("child_process");
exports.name = 'nx/js/dependencies-and-lockfile';
let parsedLockFile = {};
exports.createNodes = [
    // Look for all lockfiles
    (0, globs_1.combineGlobPatterns)(lock_file_1.LOCKFILES),
    (lockFile, _, context) => {
        const pluginConfig = (0, config_1.jsPluginConfig)(context.nxJsonConfiguration);
        if (!pluginConfig.analyzeLockfile) {
            return {};
        }
        const packageManager = (0, package_manager_1.detectPackageManager)(workspace_root_1.workspaceRoot);
        // Only process the correct lockfile
        if (lockFile !== (0, lock_file_1.getLockFileName)(packageManager)) {
            return {};
        }
        const lockFilePath = (0, path_1.join)(workspace_root_1.workspaceRoot, lockFile);
        const lockFileContents = packageManager !== 'bun'
            ? (0, fs_1.readFileSync)(lockFilePath).toString()
            : (0, child_process_1.execSync)(`bun ${lockFilePath}`, {
                maxBuffer: 1024 * 1024 * 10,
                windowsHide: false,
            }).toString();
        const lockFileHash = getLockFileHash(lockFileContents);
        if (!lockFileNeedsReprocessing(lockFileHash)) {
            const nodes = readCachedParsedLockFile().externalNodes;
            parsedLockFile.externalNodes = nodes;
            return {
                externalNodes: nodes,
            };
        }
        const externalNodes = (0, lock_file_1.getLockFileNodes)(packageManager, lockFileContents, lockFileHash, context);
        parsedLockFile.externalNodes = externalNodes;
        return {
            externalNodes,
        };
    },
];
const createDependencies = (_, ctx) => {
    const pluginConfig = (0, config_1.jsPluginConfig)(ctx.nxJsonConfiguration);
    const packageManager = (0, package_manager_1.detectPackageManager)(workspace_root_1.workspaceRoot);
    let lockfileDependencies = [];
    // lockfile may not exist yet
    if (pluginConfig.analyzeLockfile &&
        (0, lock_file_1.lockFileExists)(packageManager) &&
        parsedLockFile.externalNodes) {
        const lockFilePath = (0, path_1.join)(workspace_root_1.workspaceRoot, (0, lock_file_1.getLockFileName)(packageManager));
        const lockFileContents = packageManager !== 'bun'
            ? (0, fs_1.readFileSync)(lockFilePath).toString()
            : (0, child_process_1.execSync)(`bun ${lockFilePath}`, {
                maxBuffer: 1024 * 1024 * 10,
                windowsHide: false,
            }).toString();
        const lockFileHash = getLockFileHash(lockFileContents);
        if (!lockFileNeedsReprocessing(lockFileHash)) {
            lockfileDependencies = readCachedParsedLockFile().dependencies ?? [];
        }
        else {
            lockfileDependencies = (0, lock_file_1.getLockFileDependencies)(packageManager, lockFileContents, lockFileHash, ctx);
            parsedLockFile.dependencies = lockfileDependencies;
            writeLastProcessedLockfileHash(lockFileHash, parsedLockFile);
        }
    }
    perf_hooks_1.performance.mark('build typescript dependencies - start');
    const explicitProjectDependencies = (0, build_dependencies_1.buildExplicitDependencies)(pluginConfig, ctx);
    perf_hooks_1.performance.mark('build typescript dependencies - end');
    perf_hooks_1.performance.measure('build typescript dependencies', 'build typescript dependencies - start', 'build typescript dependencies - end');
    return lockfileDependencies.concat(explicitProjectDependencies);
};
exports.createDependencies = createDependencies;
function getLockFileHash(lockFileContents) {
    return (0, file_hasher_1.hashArray)([versions_1.nxVersion, lockFileContents]);
}
function lockFileNeedsReprocessing(lockHash) {
    try {
        return (0, fs_1.readFileSync)(lockFileHashFile).toString() !== lockHash;
    }
    catch {
        return true;
    }
}
function writeLastProcessedLockfileHash(hash, lockFile) {
    (0, fs_1.mkdirSync)((0, path_1.dirname)(lockFileHashFile), { recursive: true });
    (0, fs_1.writeFileSync)(cachedParsedLockFile, JSON.stringify(lockFile, null, 2));
    (0, fs_1.writeFileSync)(lockFileHashFile, hash);
}
function readCachedParsedLockFile() {
    return JSON.parse((0, fs_1.readFileSync)(cachedParsedLockFile).toString());
}
const lockFileHashFile = (0, path_1.join)(cache_directory_1.workspaceDataDirectory, 'lockfile.hash');
const cachedParsedLockFile = (0, path_1.join)(cache_directory_1.workspaceDataDirectory, 'parsed-lock-file.json');
