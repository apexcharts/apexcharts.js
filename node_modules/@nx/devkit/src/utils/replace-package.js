"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.replaceNrwlPackageWithNxPackage = replaceNrwlPackageWithNxPackage;
const devkit_exports_1 = require("nx/src/devkit-exports");
const visit_not_ignored_files_1 = require("../generators/visit-not-ignored-files");
const path_1 = require("path");
const binary_extensions_1 = require("./binary-extensions");
function replaceNrwlPackageWithNxPackage(tree, oldPackageName, newPackageName) {
    replacePackageInDependencies(tree, oldPackageName, newPackageName);
    replacePackageInProjectConfigurations(tree, oldPackageName, newPackageName);
    replacePackageInNxJson(tree, oldPackageName, newPackageName);
    replaceMentions(tree, oldPackageName, newPackageName);
}
function replacePackageInDependencies(tree, oldPackageName, newPackageName) {
    (0, visit_not_ignored_files_1.visitNotIgnoredFiles)(tree, '.', (path) => {
        if ((0, path_1.basename)(path) !== 'package.json') {
            return;
        }
        try {
            (0, devkit_exports_1.updateJson)(tree, path, (packageJson) => {
                for (const deps of [
                    packageJson.dependencies ?? {},
                    packageJson.devDependencies ?? {},
                    packageJson.peerDependencies ?? {},
                    packageJson.optionalDependencies ?? {},
                ]) {
                    if (oldPackageName in deps) {
                        deps[newPackageName] = deps[oldPackageName];
                        delete deps[oldPackageName];
                    }
                }
                return packageJson;
            });
        }
        catch (e) {
            console.warn(`Could not replace ${oldPackageName} with ${newPackageName} in ${path}.`);
        }
    });
}
function replacePackageInProjectConfigurations(tree, oldPackageName, newPackageName) {
    const projects = (0, devkit_exports_1.getProjects)(tree);
    for (const [projectName, projectConfiguration] of projects) {
        let needsUpdate = false;
        for (const [targetName, targetConfig] of Object.entries(projectConfiguration.targets ?? {})) {
            if (!targetConfig.executor) {
                continue;
            }
            const [pkg, executorName] = targetConfig.executor.split(':');
            if (pkg === oldPackageName) {
                needsUpdate = true;
                projectConfiguration.targets[targetName].executor =
                    newPackageName + ':' + executorName;
            }
        }
        for (const [collection, collectionDefaults] of Object.entries(projectConfiguration.generators ?? {})) {
            if (collection === oldPackageName) {
                needsUpdate = true;
                projectConfiguration.generators[newPackageName] = collectionDefaults;
                delete projectConfiguration.generators[collection];
            }
        }
        if (needsUpdate) {
            (0, devkit_exports_1.updateProjectConfiguration)(tree, projectName, projectConfiguration);
        }
    }
}
function replacePackageInNxJson(tree, oldPackageName, newPackageName) {
    if (!tree.exists('nx.json')) {
        return;
    }
    const nxJson = (0, devkit_exports_1.readNxJson)(tree);
    let needsUpdate = false;
    for (const [targetName, targetConfig] of Object.entries(nxJson.targetDefaults ?? {})) {
        if (!targetConfig.executor) {
            continue;
        }
        const [pkg, executorName] = targetConfig.executor.split(':');
        if (pkg === oldPackageName) {
            needsUpdate = true;
            nxJson.targetDefaults[targetName].executor =
                newPackageName + ':' + executorName;
        }
    }
    for (const [collection, collectionDefaults] of Object.entries(nxJson.generators ?? {})) {
        if (collection === oldPackageName) {
            needsUpdate = true;
            nxJson.generators[newPackageName] = collectionDefaults;
            delete nxJson.generators[collection];
        }
    }
    if (needsUpdate) {
        (0, devkit_exports_1.updateNxJson)(tree, nxJson);
    }
}
function replaceMentions(tree, oldPackageName, newPackageName) {
    (0, visit_not_ignored_files_1.visitNotIgnoredFiles)(tree, '.', (path) => {
        if ((0, binary_extensions_1.isBinaryPath)(path)) {
            return;
        }
        const ignoredFiles = [
            'yarn.lock',
            'package-lock.json',
            'pnpm-lock.yaml',
            'bun.lockb',
            'CHANGELOG.md',
        ];
        if (ignoredFiles.includes((0, path_1.basename)(path))) {
            return;
        }
        try {
            const contents = tree.read(path).toString();
            if (!contents.includes(oldPackageName)) {
                return;
            }
            tree.write(path, contents.replace(new RegExp(oldPackageName, 'g'), newPackageName));
        }
        catch {
            // Its **probably** ok, contents can be null if the file is too large or
            // there was an access exception.
            devkit_exports_1.logger.warn(`An error was thrown when trying to update ${path}. If you believe the migration should have updated it, be sure to review the file and open an issue.`);
        }
    });
}
