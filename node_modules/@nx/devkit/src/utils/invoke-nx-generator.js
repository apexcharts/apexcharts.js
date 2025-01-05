"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertNxGenerator = convertNxGenerator;
const path_1 = require("path");
const devkit_exports_1 = require("nx/src/devkit-exports");
const devkit_internals_1 = require("nx/src/devkit-internals");
class RunCallbackTask {
    constructor(callback) {
        this.callback = callback;
    }
    toConfiguration() {
        return {
            name: 'RunCallback',
            options: {
                callback: this.callback,
            },
        };
    }
}
function createRunCallbackTask() {
    return {
        name: 'RunCallback',
        create: () => {
            return Promise.resolve(async ({ callback }) => {
                await callback();
            });
        },
    };
}
/**
 * Convert an Nx Generator into an Angular Devkit Schematic.
 * @param generator The Nx generator to convert to an Angular Devkit Schematic.
 */
function convertNxGenerator(generator, skipWritingConfigInOldFormat = false) {
    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    return (generatorOptions) => invokeNxGenerator(generator, generatorOptions);
}
/**
 * Create a Rule to invoke an Nx Generator
 */
function invokeNxGenerator(generator, options, skipWritingConfigInOldFormat) {
    return async (tree, context) => {
        if (context.engine.workflow) {
            const engineHost = context.engine.workflow.engineHost;
            engineHost.registerTaskExecutor(createRunCallbackTask());
        }
        const root = context.engine.workflow && context.engine.workflow.engineHost.paths
            ? context.engine.workflow.engineHost.paths[1]
            : tree.root.path;
        const adapterTree = new DevkitTreeFromAngularDevkitTree(tree, root, skipWritingConfigInOldFormat);
        const result = await generator(adapterTree, options);
        if (!result) {
            return adapterTree['tree'];
        }
        if (typeof result === 'function') {
            if (context.engine.workflow) {
                context.addTask(new RunCallbackTask(result));
            }
        }
    };
}
const actionToFileChangeMap = {
    c: 'CREATE',
    o: 'UPDATE',
    d: 'DELETE',
};
class DevkitTreeFromAngularDevkitTree {
    constructor(tree, _root, skipWritingConfigInOldFormat) {
        this.tree = tree;
        this._root = _root;
        this.skipWritingConfigInOldFormat = skipWritingConfigInOldFormat;
        /**
         * When using the UnitTestTree from @angular-devkit/schematics/testing, the root is just `/`.
         * This causes a massive issue if `getProjects()` is used in the underlying generator because it
         * causes fast-glob to be set to work on the user's entire file system.
         *
         * Therefore, in this case, patch the root to match what Nx Devkit does and use /virtual instead.
         */
        try {
            const { UnitTestTree } = require('@angular-devkit/schematics/testing');
            if (tree instanceof UnitTestTree && _root === '/') {
                this._root = '/virtual';
            }
        }
        catch { }
    }
    get root() {
        return this._root;
    }
    children(dirPath) {
        const { subdirs, subfiles } = this.tree.getDir(dirPath);
        return [...subdirs, ...subfiles];
    }
    delete(filePath) {
        this.tree.delete(filePath);
    }
    exists(filePath) {
        if (this.isFile(filePath)) {
            return this.tree.exists(filePath);
        }
        else {
            return this.children(filePath).length > 0;
        }
    }
    isFile(filePath) {
        return this.tree.exists(filePath) && !!this.tree.read(filePath);
    }
    listChanges() {
        const fileChanges = [];
        for (const action of this.tree.actions) {
            if (action.kind === 'r') {
                fileChanges.push({
                    path: this.normalize(action.to),
                    type: 'CREATE',
                    content: this.read(action.to),
                });
                fileChanges.push({
                    path: this.normalize(action.path),
                    type: 'DELETE',
                    content: null,
                });
            }
            else if (action.kind === 'c' || action.kind === 'o') {
                fileChanges.push({
                    path: this.normalize(action.path),
                    type: actionToFileChangeMap[action.kind],
                    content: action.content,
                });
            }
            else {
                fileChanges.push({
                    path: this.normalize(action.path),
                    type: 'DELETE',
                    content: null,
                });
            }
        }
        return fileChanges;
    }
    normalize(path) {
        return (0, path_1.relative)(this.root, (0, path_1.join)(this.root, path));
    }
    read(filePath, encoding) {
        return encoding
            ? this.tree.read(filePath).toString(encoding)
            : this.tree.read(filePath);
    }
    rename(from, to) {
        this.tree.rename(from, to);
    }
    write(filePath, content, options) {
        if (options?.mode) {
            this.warnUnsupportedFilePermissionsChange(filePath, options.mode);
        }
        if (this.tree.exists(filePath)) {
            this.tree.overwrite(filePath, content);
        }
        else {
            this.tree.create(filePath, content);
        }
    }
    changePermissions(filePath, mode) {
        this.warnUnsupportedFilePermissionsChange(filePath, mode);
    }
    warnUnsupportedFilePermissionsChange(filePath, mode) {
        devkit_exports_1.logger.warn((0, devkit_internals_1.stripIndent)(`The Angular DevKit tree does not support changing a file permissions.
                  Ignoring changing ${filePath} permissions to ${mode}.`));
    }
}
