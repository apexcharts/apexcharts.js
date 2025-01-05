"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NX_VERSION = void 0;
exports.addDependenciesToPackageJson = addDependenciesToPackageJson;
exports.removeDependenciesFromPackageJson = removeDependenciesFromPackageJson;
exports.ensurePackage = ensurePackage;
const child_process_1 = require("child_process");
const module_1 = require("module");
const semver_1 = require("semver");
const install_packages_task_1 = require("../tasks/install-packages-task");
const tmp_1 = require("tmp");
const path_1 = require("path");
const devkit_exports_1 = require("nx/src/devkit-exports");
const devkit_internals_1 = require("nx/src/devkit-internals");
const fs_1 = require("fs");
const UNIDENTIFIED_VERSION = 'UNIDENTIFIED_VERSION';
const NON_SEMVER_TAGS = {
    '*': 2,
    [UNIDENTIFIED_VERSION]: 2,
    next: 1,
    latest: 0,
    previous: -1,
    legacy: -2,
};
function filterExistingDependencies(dependencies, existingAltDependencies) {
    if (!existingAltDependencies) {
        return dependencies;
    }
    return Object.keys(dependencies ?? {})
        .filter((d) => !existingAltDependencies[d])
        .reduce((acc, d) => ({ ...acc, [d]: dependencies[d] }), {});
}
function cleanSemver(version) {
    return (0, semver_1.clean)(version) ?? (0, semver_1.coerce)(version);
}
function isIncomingVersionGreater(incomingVersion, existingVersion) {
    // if version is in the format of "latest", "next" or similar - keep it, otherwise try to parse it
    const incomingVersionCompareBy = incomingVersion in NON_SEMVER_TAGS
        ? incomingVersion
        : cleanSemver(incomingVersion)?.toString() ?? UNIDENTIFIED_VERSION;
    const existingVersionCompareBy = existingVersion in NON_SEMVER_TAGS
        ? existingVersion
        : cleanSemver(existingVersion)?.toString() ?? UNIDENTIFIED_VERSION;
    if (incomingVersionCompareBy in NON_SEMVER_TAGS &&
        existingVersionCompareBy in NON_SEMVER_TAGS) {
        return (NON_SEMVER_TAGS[incomingVersionCompareBy] >
            NON_SEMVER_TAGS[existingVersionCompareBy]);
    }
    if (incomingVersionCompareBy in NON_SEMVER_TAGS ||
        existingVersionCompareBy in NON_SEMVER_TAGS) {
        return true;
    }
    return (0, semver_1.gt)(cleanSemver(incomingVersion), cleanSemver(existingVersion));
}
function updateExistingAltDependenciesVersion(dependencies, existingAltDependencies) {
    return Object.keys(existingAltDependencies || {})
        .filter((d) => {
        if (!dependencies[d]) {
            return false;
        }
        const incomingVersion = dependencies[d];
        const existingVersion = existingAltDependencies[d];
        return isIncomingVersionGreater(incomingVersion, existingVersion);
    })
        .reduce((acc, d) => ({ ...acc, [d]: dependencies[d] }), {});
}
function updateExistingDependenciesVersion(dependencies, existingDependencies = {}) {
    return Object.keys(dependencies)
        .filter((d) => {
        if (!existingDependencies[d]) {
            return true;
        }
        const incomingVersion = dependencies[d];
        const existingVersion = existingDependencies[d];
        return isIncomingVersionGreater(incomingVersion, existingVersion);
    })
        .reduce((acc, d) => ({ ...acc, [d]: dependencies[d] }), {});
}
/**
 * Add Dependencies and Dev Dependencies to package.json
 *
 * For example:
 * ```typescript
 * addDependenciesToPackageJson(tree, { react: 'latest' }, { jest: 'latest' })
 * ```
 * This will **add** `react` and `jest` to the dependencies and devDependencies sections of package.json respectively.
 *
 * @param tree Tree representing file system to modify
 * @param dependencies Dependencies to be added to the dependencies section of package.json
 * @param devDependencies Dependencies to be added to the devDependencies section of package.json
 * @param packageJsonPath Path to package.json
 * @param keepExistingVersions If true, prevents existing dependencies from being bumped to newer versions
 * @returns Callback to install dependencies only if necessary, no-op otherwise
 */
function addDependenciesToPackageJson(tree, dependencies, devDependencies, packageJsonPath = 'package.json', keepExistingVersions) {
    const currentPackageJson = (0, devkit_exports_1.readJson)(tree, packageJsonPath);
    /** Dependencies to install that are not met in dev dependencies */
    let filteredDependencies = filterExistingDependencies(dependencies, currentPackageJson.devDependencies);
    /** Dev dependencies to install that are not met in dependencies */
    let filteredDevDependencies = filterExistingDependencies(devDependencies, currentPackageJson.dependencies);
    // filtered dependencies should consist of:
    // - dependencies of the same type that are not present
    // by default, filtered dependencies also include these (unless keepExistingVersions is true):
    // - dependencies of the same type that have greater version
    // - specified dependencies of the other type that have greater version and are already installed as current type
    filteredDependencies = {
        ...updateExistingDependenciesVersion(filteredDependencies, currentPackageJson.dependencies),
        ...updateExistingAltDependenciesVersion(devDependencies, currentPackageJson.dependencies),
    };
    filteredDevDependencies = {
        ...updateExistingDependenciesVersion(filteredDevDependencies, currentPackageJson.devDependencies),
        ...updateExistingAltDependenciesVersion(dependencies, currentPackageJson.devDependencies),
    };
    if (keepExistingVersions) {
        filteredDependencies = removeExistingDependencies(filteredDependencies, currentPackageJson.dependencies);
        filteredDevDependencies = removeExistingDependencies(filteredDevDependencies, currentPackageJson.devDependencies);
    }
    else {
        filteredDependencies = removeLowerVersions(filteredDependencies, currentPackageJson.dependencies);
        filteredDevDependencies = removeLowerVersions(filteredDevDependencies, currentPackageJson.devDependencies);
    }
    if (requiresAddingOfPackages(currentPackageJson, filteredDependencies, filteredDevDependencies)) {
        (0, devkit_exports_1.updateJson)(tree, packageJsonPath, (json) => {
            json.dependencies = {
                ...(json.dependencies || {}),
                ...filteredDependencies,
            };
            json.devDependencies = {
                ...(json.devDependencies || {}),
                ...filteredDevDependencies,
            };
            json.dependencies = sortObjectByKeys(json.dependencies);
            json.devDependencies = sortObjectByKeys(json.devDependencies);
            return json;
        });
        return () => {
            (0, install_packages_task_1.installPackagesTask)(tree);
        };
    }
    return () => { };
}
/**
 * @returns The the incoming dependencies that are higher than the existing verions
 **/
function removeLowerVersions(incomingDeps, existingDeps) {
    return Object.keys(incomingDeps).reduce((acc, d) => {
        if (!existingDeps?.[d] ||
            isIncomingVersionGreater(incomingDeps[d], existingDeps[d])) {
            acc[d] = incomingDeps[d];
        }
        return acc;
    }, {});
}
function removeExistingDependencies(incomingDeps, existingDeps) {
    return Object.keys(incomingDeps).reduce((acc, d) => {
        if (!existingDeps?.[d]) {
            acc[d] = incomingDeps[d];
        }
        return acc;
    }, {});
}
/**
 * Remove Dependencies and Dev Dependencies from package.json
 *
 * For example:
 * ```typescript
 * removeDependenciesFromPackageJson(tree, ['react'], ['jest'])
 * ```
 * This will **remove** `react` and `jest` from the dependencies and devDependencies sections of package.json respectively.
 *
 * @param dependencies Dependencies to be removed from the dependencies section of package.json
 * @param devDependencies Dependencies to be removed from the devDependencies section of package.json
 * @returns Callback to uninstall dependencies only if necessary. undefined is returned if changes are not necessary.
 */
function removeDependenciesFromPackageJson(tree, dependencies, devDependencies, packageJsonPath = 'package.json') {
    const currentPackageJson = (0, devkit_exports_1.readJson)(tree, packageJsonPath);
    if (requiresRemovingOfPackages(currentPackageJson, dependencies, devDependencies)) {
        (0, devkit_exports_1.updateJson)(tree, packageJsonPath, (json) => {
            for (const dep of dependencies) {
                delete json.dependencies[dep];
            }
            for (const devDep of devDependencies) {
                delete json.devDependencies[devDep];
            }
            json.dependencies = sortObjectByKeys(json.dependencies);
            json.devDependencies = sortObjectByKeys(json.devDependencies);
            return json;
        });
    }
    return () => {
        (0, install_packages_task_1.installPackagesTask)(tree);
    };
}
function sortObjectByKeys(obj) {
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
        return obj;
    }
    return Object.keys(obj)
        .sort()
        .reduce((result, key) => {
        return {
            ...result,
            [key]: obj[key],
        };
    }, {});
}
/**
 * Verifies whether the given packageJson dependencies require an update
 * given the deps & devDeps passed in
 */
function requiresAddingOfPackages(packageJsonFile, deps, devDeps) {
    let needsDepsUpdate = false;
    let needsDevDepsUpdate = false;
    packageJsonFile.dependencies = packageJsonFile.dependencies || {};
    packageJsonFile.devDependencies = packageJsonFile.devDependencies || {};
    if (Object.keys(deps).length > 0) {
        needsDepsUpdate = Object.keys(deps).some((entry) => {
            const incomingVersion = deps[entry];
            if (packageJsonFile.dependencies[entry]) {
                const existingVersion = packageJsonFile.dependencies[entry];
                return isIncomingVersionGreater(incomingVersion, existingVersion);
            }
            if (packageJsonFile.devDependencies[entry]) {
                const existingVersion = packageJsonFile.devDependencies[entry];
                return isIncomingVersionGreater(incomingVersion, existingVersion);
            }
            return true;
        });
    }
    if (Object.keys(devDeps).length > 0) {
        needsDevDepsUpdate = Object.keys(devDeps).some((entry) => {
            const incomingVersion = devDeps[entry];
            if (packageJsonFile.devDependencies[entry]) {
                const existingVersion = packageJsonFile.devDependencies[entry];
                return isIncomingVersionGreater(incomingVersion, existingVersion);
            }
            if (packageJsonFile.dependencies[entry]) {
                const existingVersion = packageJsonFile.dependencies[entry];
                return isIncomingVersionGreater(incomingVersion, existingVersion);
            }
            return true;
        });
    }
    return needsDepsUpdate || needsDevDepsUpdate;
}
/**
 * Verifies whether the given packageJson dependencies require an update
 * given the deps & devDeps passed in
 */
function requiresRemovingOfPackages(packageJsonFile, deps, devDeps) {
    let needsDepsUpdate = false;
    let needsDevDepsUpdate = false;
    packageJsonFile.dependencies = packageJsonFile.dependencies || {};
    packageJsonFile.devDependencies = packageJsonFile.devDependencies || {};
    if (deps.length > 0) {
        needsDepsUpdate = deps.some((entry) => packageJsonFile.dependencies[entry]);
    }
    if (devDeps.length > 0) {
        needsDevDepsUpdate = devDeps.some((entry) => packageJsonFile.devDependencies[entry]);
    }
    return needsDepsUpdate || needsDevDepsUpdate;
}
const packageMapCache = new Map();
function ensurePackage(pkgOrTree, requiredVersionOrPackage, maybeRequiredVersion, _) {
    let pkg;
    let requiredVersion;
    if (typeof pkgOrTree === 'string') {
        pkg = pkgOrTree;
        requiredVersion = requiredVersionOrPackage;
    }
    else {
        // Old Signature
        pkg = requiredVersionOrPackage;
        requiredVersion = maybeRequiredVersion;
    }
    if (packageMapCache.has(pkg)) {
        return packageMapCache.get(pkg);
    }
    try {
        return require(pkg);
    }
    catch (e) {
        if (e.code === 'ERR_REQUIRE_ESM') {
            // The package is installed, but is an ESM package.
            // The consumer of this function can import it as needed.
            return null;
        }
        else if (e.code !== 'MODULE_NOT_FOUND') {
            throw e;
        }
    }
    if (process.env.NX_DRY_RUN && process.env.NX_DRY_RUN !== 'false') {
        throw new Error('NOTE: This generator does not support --dry-run. If you are running this in Nx Console, it should execute fine once you hit the "Generate" button.\n');
    }
    const { dir: tempDir } = (0, devkit_internals_1.createTempNpmDirectory)?.() ?? {
        dir: (0, tmp_1.dirSync)().name,
    };
    console.log(`Fetching ${pkg}...`);
    const packageManager = (0, devkit_exports_1.detectPackageManager)();
    const isVerbose = process.env.NX_VERBOSE_LOGGING === 'true';
    generatePackageManagerFiles(tempDir, packageManager);
    const preInstallCommand = (0, devkit_exports_1.getPackageManagerCommand)(packageManager).preInstall;
    if (preInstallCommand) {
        // ensure package.json and repo in tmp folder is set to a proper package manager state
        (0, child_process_1.execSync)(preInstallCommand, {
            cwd: tempDir,
            stdio: isVerbose ? 'inherit' : 'ignore',
            windowsHide: false,
        });
    }
    let addCommand = (0, devkit_exports_1.getPackageManagerCommand)(packageManager).addDev;
    if (packageManager === 'pnpm') {
        addCommand = 'pnpm add -D'; // we need to ensure that we are not using workspace command
    }
    (0, child_process_1.execSync)(`${addCommand} ${pkg}@${requiredVersion}`, {
        cwd: tempDir,
        stdio: isVerbose ? 'inherit' : 'ignore',
        windowsHide: false,
    });
    addToNodePath((0, path_1.join)(devkit_exports_1.workspaceRoot, 'node_modules'));
    addToNodePath((0, path_1.join)(tempDir, 'node_modules'));
    // Re-initialize the added paths into require
    module_1.Module._initPaths();
    try {
        const result = require(require.resolve(pkg, {
            paths: [tempDir],
        }));
        packageMapCache.set(pkg, result);
        return result;
    }
    catch (e) {
        if (e.code === 'ERR_REQUIRE_ESM') {
            // The package is installed, but is an ESM package.
            // The consumer of this function can import it as needed.
            packageMapCache.set(pkg, null);
            return null;
        }
        throw e;
    }
}
/**
 * Generates necessary files needed for the package manager to work
 * and for the node_modules to be accessible.
 */
function generatePackageManagerFiles(root, packageManager = (0, devkit_exports_1.detectPackageManager)()) {
    const [pmMajor] = (0, devkit_exports_1.getPackageManagerVersion)(packageManager).split('.');
    switch (packageManager) {
        case 'yarn':
            if (+pmMajor >= 2) {
                (0, fs_1.writeFileSync)((0, path_1.join)(root, '.yarnrc.yml'), 'nodeLinker: node-modules\nenableScripts: false');
            }
            break;
    }
}
function addToNodePath(dir) {
    // NODE_PATH is a delimited list of paths.
    // The delimiter is different for windows.
    const delimiter = require('os').platform() === 'win32' ? ';' : ':';
    const paths = process.env.NODE_PATH
        ? process.env.NODE_PATH.split(delimiter)
        : [];
    // The path is already in the node path
    if (paths.includes(dir)) {
        return;
    }
    // Add the tmp path
    paths.push(dir);
    // Update the env variable.
    process.env.NODE_PATH = paths.join(delimiter);
}
function getPackageVersion(pkg) {
    return require((0, path_1.join)(pkg, 'package.json')).version;
}
/**
 * @description The version of Nx used by the workspace. Returns null if no version is found.
 */
exports.NX_VERSION = getPackageVersion('nx');
