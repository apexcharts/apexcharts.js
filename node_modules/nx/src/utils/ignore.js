"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ALWAYS_IGNORE = void 0;
exports.getIgnoredGlobs = getIgnoredGlobs;
exports.getAlwaysIgnore = getAlwaysIgnore;
exports.getIgnoreObject = getIgnoreObject;
const node_fs_1 = require("node:fs");
const ignore_1 = require("ignore");
const fileutils_1 = require("./fileutils");
const path_1 = require("./path");
const workspace_root_1 = require("./workspace-root");
/**
 * An array of glob patterns that should always be ignored.
 */
exports.ALWAYS_IGNORE = getAlwaysIgnore();
function getIgnoredGlobs(root = workspace_root_1.workspaceRoot, prependRoot = true) {
    const files = ['.gitignore', '.nxignore'];
    if (prependRoot) {
        return [
            ...getAlwaysIgnore(root),
            ...files.flatMap((f) => getIgnoredGlobsFromFile((0, path_1.joinPathFragments)(root, f), root)),
        ];
    }
    else {
        return [
            ...getAlwaysIgnore(),
            ...files.flatMap((f) => getIgnoredGlobsFromFile((0, path_1.joinPathFragments)(root, f))),
        ];
    }
}
function getAlwaysIgnore(root) {
    const paths = [
        'node_modules',
        '**/node_modules',
        '.git',
        '.nx',
        '.vscode',
        '.yarn/cache',
    ];
    return root ? paths.map((x) => (0, path_1.joinPathFragments)(root, x)) : paths;
}
function getIgnoreObject(root = workspace_root_1.workspaceRoot) {
    const ig = (0, ignore_1.default)();
    ig.add((0, fileutils_1.readFileIfExisting)(`${root}/.gitignore`));
    ig.add((0, fileutils_1.readFileIfExisting)(`${root}/.nxignore`));
    return ig;
}
function getIgnoredGlobsFromFile(file, root) {
    try {
        const results = [];
        const contents = (0, node_fs_1.readFileSync)(file, 'utf-8');
        const lines = contents.split('\n');
        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('#')) {
                continue;
            }
            else if (trimmed.startsWith('/')) {
                if (root) {
                    results.push((0, path_1.joinPathFragments)(root, trimmed));
                }
                else {
                    results.push((0, path_1.joinPathFragments)('.', trimmed));
                }
            }
            else {
                results.push(trimmed);
            }
        }
        return results;
    }
    catch (e) {
        return [];
    }
}
