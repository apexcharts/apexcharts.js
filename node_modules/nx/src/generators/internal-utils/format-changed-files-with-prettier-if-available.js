"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatChangedFilesWithPrettierIfAvailable = formatChangedFilesWithPrettierIfAvailable;
exports.formatFilesWithPrettierIfAvailable = formatFilesWithPrettierIfAvailable;
const path = require("path");
/**
 * Formats all the created or updated files using Prettier
 * @param tree - the file system tree
 */
async function formatChangedFilesWithPrettierIfAvailable(tree, options) {
    const files = new Set(tree.listChanges().filter((file) => file.type !== 'DELETE'));
    const results = await formatFilesWithPrettierIfAvailable(Array.from(files), tree.root, options);
    for (const [path, content] of results) {
        tree.write(path, content);
    }
}
async function formatFilesWithPrettierIfAvailable(files, root, options) {
    const results = new Map();
    let prettier;
    try {
        prettier = await Promise.resolve().then(() => require('prettier'));
    }
    catch { }
    if (!prettier) {
        return results;
    }
    await Promise.all(Array.from(files).map(async (file) => {
        try {
            const systemPath = path.join(root, file.path);
            let options = {
                filepath: systemPath,
            };
            const resolvedOptions = await prettier.resolveConfig(systemPath, {
                editorconfig: true,
            });
            if (!resolvedOptions) {
                return;
            }
            options = {
                ...options,
                ...resolvedOptions,
            };
            const support = await prettier.getFileInfo(systemPath, options);
            if (support.ignored || !support.inferredParser) {
                return;
            }
            results.set(file.path, 
            // In prettier v3 the format result is a promise
            await prettier.format(file.content.toString('utf-8'), options));
        }
        catch (e) {
            if (!options?.silent) {
                console.warn(`Could not format ${file.path}. Error: "${e.message}"`);
            }
        }
    }));
    return results;
}
