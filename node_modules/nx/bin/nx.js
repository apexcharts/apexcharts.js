#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const find_workspace_root_1 = require("../src/utils/find-workspace-root");
const chalk = require("chalk");
const dotenv_1 = require("../src/utils/dotenv");
const init_local_1 = require("./init-local");
const output_1 = require("../src/utils/output");
const installation_directory_1 = require("../src/utils/installation-directory");
const semver_1 = require("semver");
const strip_indents_1 = require("../src/utils/strip-indents");
const package_json_1 = require("../src/utils/package-json");
const child_process_1 = require("child_process");
const path_1 = require("path");
const assert_supported_platform_1 = require("../src/native/assert-supported-platform");
const perf_hooks_1 = require("perf_hooks");
const workspace_context_1 = require("../src/utils/workspace-context");
const client_1 = require("../src/daemon/client/client");
const db_connection_1 = require("../src/utils/db-connection");
const exit_codes_1 = require("../src/utils/exit-codes");
function main() {
    if (process.argv[2] !== 'report' &&
        process.argv[2] !== '--version' &&
        process.argv[2] !== '--help' &&
        process.argv[2] !== 'reset') {
        (0, assert_supported_platform_1.assertSupportedPlatform)();
    }
    require('nx/src/utils/perf-logging');
    const workspace = (0, find_workspace_root_1.findWorkspaceRoot)(process.cwd());
    perf_hooks_1.performance.mark('loading dotenv files:start');
    if (workspace) {
        (0, dotenv_1.loadRootEnvFiles)(workspace.dir);
    }
    perf_hooks_1.performance.mark('loading dotenv files:end');
    perf_hooks_1.performance.measure('loading dotenv files', 'loading dotenv files:start', 'loading dotenv files:end');
    // new is a special case because there is no local workspace to load
    if (process.argv[2] === 'new' ||
        process.argv[2] === '_migrate' ||
        process.argv[2] === 'init' ||
        (process.argv[2] === 'graph' && !workspace)) {
        process.env.NX_DAEMON = 'false';
        require('nx/src/command-line/nx-commands').commandsObject.argv;
    }
    else {
        if (!client_1.daemonClient.enabled() && workspace !== null) {
            (0, workspace_context_1.setupWorkspaceContext)(workspace.dir);
        }
        // polyfill rxjs observable to avoid issues with multiple version of Observable installed in node_modules
        // https://twitter.com/BenLesh/status/1192478226385428483?s=20
        if (!Symbol.observable)
            Symbol.observable = Symbol('observable polyfill');
        // Make sure that a local copy of Nx exists in workspace
        let localNx;
        try {
            localNx = workspace && resolveNx(workspace);
        }
        catch {
            localNx = null;
        }
        const isLocalInstall = localNx === resolveNx(null);
        const { LOCAL_NX_VERSION, GLOBAL_NX_VERSION } = determineNxVersions(localNx, workspace, isLocalInstall);
        if (process.argv[2] === '--version') {
            handleNxVersionCommand(LOCAL_NX_VERSION, GLOBAL_NX_VERSION);
        }
        if (!workspace) {
            handleNoWorkspace(GLOBAL_NX_VERSION);
        }
        if (!localNx) {
            handleMissingLocalInstallation();
        }
        // this file is already in the local workspace
        if (isLocalInstall) {
            (0, init_local_1.initLocal)(workspace);
        }
        else {
            // Nx is being run from globally installed CLI - hand off to the local
            warnIfUsingOutdatedGlobalInstall(GLOBAL_NX_VERSION, LOCAL_NX_VERSION);
            if (localNx.includes('.nx')) {
                const nxWrapperPath = localNx.replace(/\.nx.*/, '.nx/') + 'nxw.js';
                require(nxWrapperPath);
            }
            else {
                require(localNx);
            }
        }
    }
}
function handleNoWorkspace(globalNxVersion) {
    output_1.output.log({
        title: `The current directory isn't part of an Nx workspace.`,
        bodyLines: [
            `To create a workspace run:`,
            chalk.bold.white(`npx create-nx-workspace@latest <workspace name>`),
            '',
            `To add Nx to an existing workspace with a workspace-specific nx.json, run:`,
            chalk.bold.white(`npx nx@latest init`),
        ],
    });
    output_1.output.note({
        title: `For more information please visit https://nx.dev/`,
    });
    warnIfUsingOutdatedGlobalInstall(globalNxVersion);
    process.exit(1);
}
function handleNxVersionCommand(LOCAL_NX_VERSION, GLOBAL_NX_VERSION) {
    console.log((0, strip_indents_1.stripIndents) `Nx Version:
      - Local: ${LOCAL_NX_VERSION ? 'v' + LOCAL_NX_VERSION : 'Not found'}
      - Global: ${GLOBAL_NX_VERSION ? 'v' + GLOBAL_NX_VERSION : 'Not found'}`);
    process.exit(0);
}
function determineNxVersions(localNx, workspace, isLocalInstall) {
    const LOCAL_NX_VERSION = localNx
        ? getLocalNxVersion(workspace)
        : null;
    const GLOBAL_NX_VERSION = isLocalInstall
        ? null
        : require('../package.json').version;
    globalThis.GLOBAL_NX_VERSION ??= GLOBAL_NX_VERSION;
    return { LOCAL_NX_VERSION, GLOBAL_NX_VERSION };
}
function resolveNx(workspace) {
    // root relative to location of the nx bin
    const globalsRoot = (0, path_1.join)(__dirname, '../../../');
    // prefer Nx installed in .nx/installation
    try {
        return require.resolve('nx/bin/nx.js', {
            paths: [(0, installation_directory_1.getNxInstallationPath)(workspace ? workspace.dir : globalsRoot)],
        });
    }
    catch { }
    // check for root install
    return require.resolve('nx/bin/nx.js', {
        paths: [workspace ? workspace.dir : globalsRoot],
    });
}
function handleMissingLocalInstallation() {
    output_1.output.error({
        title: `Could not find Nx modules in this workspace.`,
        bodyLines: [`Have you run ${chalk.bold.white(`npm/yarn install`)}?`],
    });
    process.exit(1);
}
/**
 * Assumes currently running Nx is global install.
 * Warns if out of date by 1 major version or more.
 */
function warnIfUsingOutdatedGlobalInstall(globalNxVersion, localNxVersion) {
    // Never display this warning if Nx is already running via Nx
    if (process.env.NX_CLI_SET) {
        return;
    }
    const isOutdatedGlobalInstall = checkOutdatedGlobalInstallation(globalNxVersion, localNxVersion);
    // Using a global Nx Install
    if (isOutdatedGlobalInstall) {
        const bodyLines = localNxVersion
            ? [
                `Your repository uses a higher version of Nx (${localNxVersion}) than your global CLI version (${globalNxVersion})`,
            ]
            : [];
        bodyLines.push('For more information, see https://nx.dev/more-concepts/global-nx');
        output_1.output.warn({
            title: `It's time to update Nx 🎉`,
            bodyLines,
        });
    }
}
function checkOutdatedGlobalInstallation(globalNxVersion, localNxVersion) {
    // We aren't running a global install, so we can't know if its outdated.
    if (!globalNxVersion) {
        return false;
    }
    if (localNxVersion) {
        // If the global Nx install is at least a major version behind the local install, warn.
        return (0, semver_1.major)(globalNxVersion) < (0, semver_1.major)(localNxVersion);
    }
    // No local installation was detected. This can happen if the user is running a global install
    // that contains an older version of Nx, which is unable to detect the local installation. The most
    // recent case where this would have happened would be when we stopped generating workspace.json by default,
    // as older global installations used it to determine the workspace root. This only be hit in rare cases,
    // but can provide valuable insights for troubleshooting.
    const latestVersionOfNx = getLatestVersionOfNx();
    if (latestVersionOfNx && (0, semver_1.major)(globalNxVersion) < (0, semver_1.major)(latestVersionOfNx)) {
        return true;
    }
}
function getLocalNxVersion(workspace) {
    try {
        const { packageJson } = (0, package_json_1.readModulePackageJson)('nx', (0, installation_directory_1.getNxRequirePaths)(workspace.dir));
        return packageJson.version;
    }
    catch { }
}
function _getLatestVersionOfNx() {
    try {
        return (0, child_process_1.execSync)('npm view nx@latest version', {
            windowsHide: false,
        })
            .toString()
            .trim();
    }
    catch {
        try {
            return (0, child_process_1.execSync)('pnpm view nx@latest version', {
                windowsHide: false,
            })
                .toString()
                .trim();
        }
        catch {
            return null;
        }
    }
}
const getLatestVersionOfNx = ((fn) => {
    let cache = null;
    return () => cache || (cache = fn());
})(_getLatestVersionOfNx);
function nxCleanup(signal) {
    (0, db_connection_1.removeDbConnections)();
    if (signal) {
        process.exit((0, exit_codes_1.signalToCode)(signal));
    }
    else {
        process.exit();
    }
}
process.on('exit', () => {
    nxCleanup();
});
process.on('SIGINT', () => {
    nxCleanup('SIGINT');
});
process.on('SIGTERM', () => {
    nxCleanup('SIGTERM');
});
process.on('SIGHUP', () => {
    nxCleanup('SIGHUP');
});
main();
