"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLegacyMigrationFunctionIfApplicable = getLegacyMigrationFunctionIfApplicable;
const child_process_1 = require("child_process");
const path_1 = require("path");
const semver_1 = require("semver");
const fileutils_1 = require("../../../../utils/fileutils");
const object_sort_1 = require("../../../../utils/object-sort");
const output_1 = require("../../../../utils/output");
const package_json_1 = require("../../../../utils/package-json");
const package_manager_1 = require("../../../../utils/package-manager");
const utils_1 = require("../utils");
const connect_to_nx_cloud_1 = require("../../../connect/connect-to-nx-cloud");
// map of Angular major versions to Nx versions to use for legacy `nx init` migrations,
// key is major Angular version and value is Nx version to use
const nxAngularLegacyVersionMap = {
    14: '~17.0.0',
    15: '~19.0.0',
    16: '~20.1.0',
};
// min major angular version supported in latest Nx
const minMajorAngularVersionSupported = 17;
// version when the Nx CLI changed from @nrwl/tao & @nrwl/cli to nx
const versionWithConsolidatedPackages = '13.9.0';
// version when packages were rescoped from @nrwl/* to @nx/*
const versionWithRescopeToNx = '16.0.0-beta.2';
async function getLegacyMigrationFunctionIfApplicable(repoRoot, options) {
    const angularVersion = (0, package_json_1.readModulePackageJson)('@angular/core').packageJson.version;
    const majorAngularVersion = (0, semver_1.major)(angularVersion);
    if (majorAngularVersion >= minMajorAngularVersionSupported) {
        // non-legacy
        return null;
    }
    let legacyMigrationCommand;
    let pkgName;
    let unscopedPkgName;
    let pkgScope;
    let pkgVersion;
    if (majorAngularVersion < 13) {
        // for versions lower than 13, the migration was in @nrwl/workspace:ng-add
        pkgScope = '@nrwl';
        unscopedPkgName = 'workspace';
        pkgName = `${pkgScope}/${unscopedPkgName}`;
        pkgVersion = await resolvePackageVersion(pkgName, `^${majorAngularVersion}.0.0`);
        const preserveAngularCliLayoutFlag = !options.integrated
            ? '--preserveAngularCLILayout'
            : '--preserveAngularCLILayout=false';
        legacyMigrationCommand = `ng g ${pkgName}:ng-add ${preserveAngularCliLayoutFlag}`;
    }
    else if (majorAngularVersion < 14) {
        // for v13, the migration was in @nrwl/angular:ng-add
        pkgScope = '@nrwl';
        unscopedPkgName = 'angular';
        pkgName = `${pkgScope}/${unscopedPkgName}`;
        pkgVersion = await resolvePackageVersion(pkgName, '~14.1.0');
        const preserveAngularCliLayoutFlag = !options.integrated
            ? '--preserve-angular-cli-layout'
            : '--preserve-angular-cli-layout=false';
        legacyMigrationCommand = `ng g ${pkgName}:ng-add ${preserveAngularCliLayoutFlag}`;
    }
    else {
        // use the latest Nx version that supported the Angular version
        pkgVersion = await resolvePackageVersion('nx', nxAngularLegacyVersionMap[majorAngularVersion]);
        pkgScope = (0, semver_1.gte)(pkgVersion, versionWithRescopeToNx) ? '@nx' : '@nrwl';
        unscopedPkgName = 'angular';
        pkgName = `${pkgScope}/${unscopedPkgName}`;
        legacyMigrationCommand = `nx@${pkgVersion} init ${process.argv
            .slice(2)
            .join(' ')}`;
    }
    return async () => {
        output_1.output.log({ title: '🐳 Nx initialization' });
        const useNxCloud = options.nxCloud ??
            (options.interactive
                ? await (0, connect_to_nx_cloud_1.connectExistingRepoToNxCloudPrompt)()
                : false);
        output_1.output.log({ title: '📦 Installing dependencies' });
        const pmc = (0, package_manager_1.getPackageManagerCommand)();
        await installDependencies(repoRoot, {
            pkgName,
            pkgScope,
            pkgVersion,
            unscopedPkgName,
        }, pmc);
        output_1.output.log({ title: '📝 Setting up workspace' });
        (0, child_process_1.execSync)(`${pmc.exec} ${legacyMigrationCommand}`, {
            stdio: [0, 1, 2],
            windowsHide: false,
        });
        if (useNxCloud) {
            output_1.output.log({ title: '🛠️ Setting up Nx Cloud' });
            await (0, utils_1.initCloud)('nx-init-angular');
        }
    };
}
async function installDependencies(repoRoot, pkgInfo, pmc) {
    const json = (0, fileutils_1.readJsonFile)((0, path_1.join)(repoRoot, 'package.json'));
    json.devDependencies ??= {};
    json.devDependencies[`${pkgInfo.pkgScope}/workspace`] = pkgInfo.pkgVersion;
    if ((0, semver_1.gte)(pkgInfo.pkgVersion, versionWithConsolidatedPackages)) {
        json.devDependencies['nx'] = pkgInfo.pkgVersion;
    }
    else {
        json.devDependencies[`${pkgInfo.pkgScope}/cli`] = pkgInfo.pkgVersion;
        json.devDependencies[`${pkgInfo.pkgScope}/tao`] = pkgInfo.pkgVersion;
    }
    json.devDependencies = (0, object_sort_1.sortObjectByKeys)(json.devDependencies);
    if (pkgInfo.unscopedPkgName === 'angular') {
        json.dependencies ??= {};
        json.dependencies[pkgInfo.pkgName] = pkgInfo.pkgVersion;
        json.dependencies = (0, object_sort_1.sortObjectByKeys)(json.dependencies);
    }
    (0, fileutils_1.writeJsonFile)(`package.json`, json);
    (0, child_process_1.execSync)(pmc.install, { stdio: [0, 1, 2], windowsHide: false });
}
async function resolvePackageVersion(packageName, version) {
    try {
        return await (0, package_manager_1.resolvePackageVersionUsingRegistry)(packageName, version);
    }
    catch {
        return await (0, package_manager_1.resolvePackageVersionUsingInstallation)(packageName, version);
    }
}
