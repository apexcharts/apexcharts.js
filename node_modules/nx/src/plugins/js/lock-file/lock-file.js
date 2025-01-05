"use strict";
/**
 * This is the main API for accessing the lock file functionality.
 * It encapsulates the package manager specific logic and implementation details.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.LOCKFILES = void 0;
exports.getLockFileNodes = getLockFileNodes;
exports.getLockFileDependencies = getLockFileDependencies;
exports.lockFileExists = lockFileExists;
exports.getLockFileName = getLockFileName;
exports.createLockFile = createLockFile;
const fs_1 = require("fs");
const path_1 = require("path");
const package_manager_1 = require("../../../utils/package-manager");
const workspace_root_1 = require("../../../utils/workspace-root");
const output_1 = require("../../../utils/output");
const npm_parser_1 = require("./npm-parser");
const pnpm_parser_1 = require("./pnpm-parser");
const yarn_parser_1 = require("./yarn-parser");
const project_graph_pruning_1 = require("./project-graph-pruning");
const package_json_1 = require("./utils/package-json");
const fileutils_1 = require("../../../utils/fileutils");
const YARN_LOCK_FILE = 'yarn.lock';
const NPM_LOCK_FILE = 'package-lock.json';
const PNPM_LOCK_FILE = 'pnpm-lock.yaml';
const BUN_LOCK_FILE = 'bun.lockb';
exports.LOCKFILES = [
    YARN_LOCK_FILE,
    NPM_LOCK_FILE,
    PNPM_LOCK_FILE,
    BUN_LOCK_FILE,
];
const YARN_LOCK_PATH = (0, path_1.join)(workspace_root_1.workspaceRoot, YARN_LOCK_FILE);
const NPM_LOCK_PATH = (0, path_1.join)(workspace_root_1.workspaceRoot, NPM_LOCK_FILE);
const PNPM_LOCK_PATH = (0, path_1.join)(workspace_root_1.workspaceRoot, PNPM_LOCK_FILE);
const BUN_LOCK_PATH = (0, path_1.join)(workspace_root_1.workspaceRoot, BUN_LOCK_FILE);
/**
 * Parses lock file and maps dependencies and metadata to {@link LockFileGraph}
 */
function getLockFileNodes(packageManager, contents, lockFileHash, context) {
    try {
        if (packageManager === 'yarn') {
            const packageJson = (0, fileutils_1.readJsonFile)((0, path_1.join)(context.workspaceRoot, 'package.json'));
            return (0, yarn_parser_1.getYarnLockfileNodes)(contents, lockFileHash, packageJson);
        }
        if (packageManager === 'pnpm') {
            return (0, pnpm_parser_1.getPnpmLockfileNodes)(contents, lockFileHash);
        }
        if (packageManager === 'npm') {
            return (0, npm_parser_1.getNpmLockfileNodes)(contents, lockFileHash);
        }
        if (packageManager === 'bun') {
            // bun uses yarn v1 for the file format
            const packageJson = (0, fileutils_1.readJsonFile)('package.json');
            return (0, yarn_parser_1.getYarnLockfileNodes)(contents, lockFileHash, packageJson);
        }
    }
    catch (e) {
        if (!isPostInstallProcess()) {
            output_1.output.error({
                title: `Failed to parse ${packageManager} lockfile`,
                bodyLines: errorBodyLines(e),
            });
        }
        throw e;
    }
    throw new Error(`Unknown package manager: ${packageManager}`);
}
/**
 * Parses lock file and maps dependencies and metadata to {@link LockFileGraph}
 */
function getLockFileDependencies(packageManager, contents, lockFileHash, context) {
    try {
        if (packageManager === 'yarn') {
            return (0, yarn_parser_1.getYarnLockfileDependencies)(contents, lockFileHash, context);
        }
        if (packageManager === 'pnpm') {
            return (0, pnpm_parser_1.getPnpmLockfileDependencies)(contents, lockFileHash, context);
        }
        if (packageManager === 'npm') {
            return (0, npm_parser_1.getNpmLockfileDependencies)(contents, lockFileHash, context);
        }
        if (packageManager === 'bun') {
            // bun uses yarn v1 for the file format
            return (0, yarn_parser_1.getYarnLockfileDependencies)(contents, lockFileHash, context);
        }
    }
    catch (e) {
        if (!isPostInstallProcess()) {
            output_1.output.error({
                title: `Failed to parse ${packageManager} lockfile`,
                bodyLines: errorBodyLines(e),
            });
        }
        throw e;
    }
    throw new Error(`Unknown package manager: ${packageManager}`);
}
function lockFileExists(packageManager) {
    if (packageManager === 'yarn') {
        return (0, fs_1.existsSync)(YARN_LOCK_PATH);
    }
    if (packageManager === 'pnpm') {
        return (0, fs_1.existsSync)(PNPM_LOCK_PATH);
    }
    if (packageManager === 'npm') {
        return (0, fs_1.existsSync)(NPM_LOCK_PATH);
    }
    if (packageManager === 'bun') {
        return (0, fs_1.existsSync)(BUN_LOCK_PATH);
    }
    throw new Error(`Unknown package manager ${packageManager} or lock file missing`);
}
/**
 * Returns lock file name based on the detected package manager in the root
 * @param packageManager
 * @returns
 */
function getLockFileName(packageManager) {
    if (packageManager === 'yarn') {
        return YARN_LOCK_FILE;
    }
    if (packageManager === 'pnpm') {
        return PNPM_LOCK_FILE;
    }
    if (packageManager === 'npm') {
        return NPM_LOCK_FILE;
    }
    if (packageManager === 'bun') {
        return BUN_LOCK_FILE;
    }
    throw new Error(`Unknown package manager: ${packageManager}`);
}
function getLockFilePath(packageManager) {
    if (packageManager === 'yarn') {
        return YARN_LOCK_PATH;
    }
    if (packageManager === 'pnpm') {
        return PNPM_LOCK_PATH;
    }
    if (packageManager === 'npm') {
        return NPM_LOCK_PATH;
    }
    if (packageManager === 'bun') {
        return BUN_LOCK_PATH;
    }
    throw new Error(`Unknown package manager: ${packageManager}`);
}
/**
 * Create lock file based on the root level lock file and (pruned) package.json
 *
 * @param packageJson
 * @param isProduction
 * @param packageManager
 * @returns
 */
function createLockFile(packageJson, graph, packageManager = (0, package_manager_1.detectPackageManager)(workspace_root_1.workspaceRoot)) {
    const normalizedPackageJson = (0, package_json_1.normalizePackageJson)(packageJson);
    const content = (0, fs_1.readFileSync)(getLockFilePath(packageManager), 'utf8');
    try {
        if (packageManager === 'yarn') {
            const prunedGraph = (0, project_graph_pruning_1.pruneProjectGraph)(graph, packageJson);
            return (0, yarn_parser_1.stringifyYarnLockfile)(prunedGraph, content, normalizedPackageJson);
        }
        if (packageManager === 'pnpm') {
            const prunedGraph = (0, project_graph_pruning_1.pruneProjectGraph)(graph, packageJson);
            return (0, pnpm_parser_1.stringifyPnpmLockfile)(prunedGraph, content, normalizedPackageJson);
        }
        if (packageManager === 'npm') {
            const prunedGraph = (0, project_graph_pruning_1.pruneProjectGraph)(graph, packageJson);
            return (0, npm_parser_1.stringifyNpmLockfile)(prunedGraph, content, normalizedPackageJson);
        }
        if (packageManager === 'bun') {
            output_1.output.log({
                title: "Unable to create bun lock files. Run bun install it's just as quick",
            });
        }
    }
    catch (e) {
        if (!isPostInstallProcess()) {
            const additionalInfo = [
                'To prevent the build from breaking we are returning the root lock file.',
            ];
            if (packageManager === 'npm') {
                additionalInfo.push('If you run `npm install --package-lock-only` in your output folder it will regenerate the correct pruned lockfile.');
            }
            if (packageManager === 'pnpm') {
                additionalInfo.push('If you run `pnpm install --lockfile-only` in your output folder it will regenerate the correct pruned lockfile.');
            }
            output_1.output.error({
                title: 'An error occured while creating pruned lockfile',
                bodyLines: errorBodyLines(e, additionalInfo),
            });
        }
        return content;
    }
}
// generate body lines for error message
function errorBodyLines(originalError, additionalInfo = []) {
    return [
        'Please open an issue at `https://github.com/nrwl/nx/issues/new?template=1-bug.yml` and provide a reproduction.',
        ...additionalInfo,
        `\nOriginal error: ${originalError.message}\n\n`,
        originalError.stack,
    ];
}
function isPostInstallProcess() {
    return (process.env.npm_command === 'install' &&
        process.env.npm_lifecycle_event === 'postinstall');
}
