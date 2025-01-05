"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateTsConfigsToJs = updateTsConfigsToJs;
const devkit_exports_1 = require("nx/src/devkit-exports");
function updateTsConfigsToJs(tree, options) {
    let updateConfigPath;
    const paths = {
        tsConfig: `${options.projectRoot}/tsconfig.json`,
        tsConfigLib: `${options.projectRoot}/tsconfig.lib.json`,
        tsConfigApp: `${options.projectRoot}/tsconfig.app.json`,
    };
    const getProjectType = (tree) => {
        if (tree.exists(paths.tsConfigApp)) {
            return 'application';
        }
        if (tree.exists(paths.tsConfigLib)) {
            return 'library';
        }
        throw new Error(`project is missing tsconfig.lib.json or tsconfig.app.json`);
    };
    (0, devkit_exports_1.updateJson)(tree, paths.tsConfig, (json) => {
        if (json.compilerOptions) {
            json.compilerOptions.allowJs = true;
        }
        else {
            json.compilerOptions = { allowJs: true };
        }
        return json;
    });
    const projectType = getProjectType(tree);
    if (projectType === 'library') {
        updateConfigPath = paths.tsConfigLib;
    }
    if (projectType === 'application') {
        updateConfigPath = paths.tsConfigApp;
    }
    (0, devkit_exports_1.updateJson)(tree, updateConfigPath, (json) => {
        json.include = uniq([...json.include, 'src/**/*.js']);
        json.exclude = uniq([
            ...json.exclude,
            'src/**/*.spec.js',
            'src/**/*.test.js',
        ]);
        return json;
    });
}
const uniq = (value) => [...new Set(value)];
