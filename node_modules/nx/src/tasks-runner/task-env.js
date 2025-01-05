"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEnvVariablesForBatchProcess = getEnvVariablesForBatchProcess;
exports.getTaskSpecificEnv = getTaskSpecificEnv;
exports.getEnvVariablesForTask = getEnvVariablesForTask;
exports.loadAndExpandDotEnvFile = loadAndExpandDotEnvFile;
exports.unloadDotEnvFile = unloadDotEnvFile;
const dotenv_1 = require("dotenv");
const dotenv_expand_1 = require("dotenv-expand");
const workspace_root_1 = require("../utils/workspace-root");
const node_path_1 = require("node:path");
function getEnvVariablesForBatchProcess(skipNxCache, captureStderr) {
    return {
        // User Process Env Variables override Dotenv Variables
        ...process.env,
        // Nx Env Variables overrides everything
        ...getNxEnvVariablesForForkedProcess(process.env.FORCE_COLOR === undefined ? 'true' : process.env.FORCE_COLOR, skipNxCache, captureStderr),
    };
}
function getTaskSpecificEnv(task) {
    // Unload any dot env files at the root of the workspace that were loaded on init of Nx.
    const taskEnv = unloadDotEnvFiles({ ...process.env });
    return process.env.NX_LOAD_DOT_ENV_FILES === 'true'
        ? loadDotEnvFilesForTask(task, taskEnv)
        : // If not loading dot env files, ensure env vars created by system are still loaded
            taskEnv;
}
function getEnvVariablesForTask(task, taskSpecificEnv, forceColor, skipNxCache, captureStderr, outputPath, streamOutput) {
    const res = {
        // Start With Dotenv Variables
        ...taskSpecificEnv,
        // Nx Env Variables overrides everything
        ...getNxEnvVariablesForTask(task, forceColor, skipNxCache, captureStderr, outputPath, streamOutput),
    };
    // we have to delete it because if we invoke Nx from within Nx, we need to reset those values
    if (!outputPath) {
        delete res.NX_TERMINAL_OUTPUT_PATH;
        delete res.NX_STREAM_OUTPUT;
        delete res.NX_PREFIX_OUTPUT;
    }
    // we don't reset NX_BASE or NX_HEAD because those are set by the user and should be preserved
    delete res.NX_SET_CLI;
    return res;
}
function getNxEnvVariablesForForkedProcess(forceColor, skipNxCache, captureStderr, outputPath, streamOutput) {
    const env = {
        FORCE_COLOR: forceColor,
        NX_WORKSPACE_ROOT: workspace_root_1.workspaceRoot,
        NX_SKIP_NX_CACHE: skipNxCache ? 'true' : undefined,
    };
    if (outputPath) {
        env.NX_TERMINAL_OUTPUT_PATH = outputPath;
        if (captureStderr) {
            env.NX_TERMINAL_CAPTURE_STDERR = 'true';
        }
        if (streamOutput) {
            env.NX_STREAM_OUTPUT = 'true';
        }
    }
    return env;
}
function getNxEnvVariablesForTask(task, forceColor, skipNxCache, captureStderr, outputPath, streamOutput) {
    const env = {
        NX_TASK_TARGET_PROJECT: task.target.project,
        NX_TASK_TARGET_TARGET: task.target.target,
        NX_TASK_TARGET_CONFIGURATION: task.target.configuration ?? undefined,
        NX_TASK_HASH: task.hash,
        // used when Nx is invoked via Lerna
        LERNA_PACKAGE_NAME: task.target.project,
    };
    // TODO: remove this once we have a reasonable way to configure it
    if (task.target.target === 'test') {
        env.NX_TERMINAL_CAPTURE_STDERR = 'true';
    }
    return {
        ...getNxEnvVariablesForForkedProcess(forceColor, skipNxCache, captureStderr, outputPath, streamOutput),
        ...env,
    };
}
/**
 * This function loads a .env file and expands the variables in it.
 * @param filename the .env file to load
 * @param environmentVariables the object to load environment variables into
 * @param override whether to override existing environment variables
 */
function loadAndExpandDotEnvFile(filename, environmentVariables, override = false) {
    const myEnv = (0, dotenv_1.config)({
        path: filename,
        processEnv: environmentVariables,
        override,
    });
    return (0, dotenv_expand_1.expand)({
        ...myEnv,
        processEnv: environmentVariables,
    });
}
/**
 * This function unloads a .env file and removes the variables in it from the environmentVariables.
 * @param filename
 * @param environmentVariables
 */
function unloadDotEnvFile(filename, environmentVariables, override = false) {
    const parsedDotEnvFile = {};
    loadAndExpandDotEnvFile(filename, parsedDotEnvFile, override);
    Object.keys(parsedDotEnvFile).forEach((envVarKey) => {
        if (environmentVariables[envVarKey] === parsedDotEnvFile[envVarKey]) {
            delete environmentVariables[envVarKey];
        }
    });
}
function getEnvFilesForTask(task) {
    // Collect dot env files that may pertain to a task
    return [
        // Load DotEnv Files for a configuration in the project root
        ...(task.target.configuration
            ? [
                `${task.projectRoot}/.env.${task.target.target}.${task.target.configuration}.local`,
                `${task.projectRoot}/.env.${task.target.target}.${task.target.configuration}`,
                `${task.projectRoot}/.env.${task.target.configuration}.local`,
                `${task.projectRoot}/.env.${task.target.configuration}`,
                `${task.projectRoot}/.${task.target.target}.${task.target.configuration}.local.env`,
                `${task.projectRoot}/.${task.target.target}.${task.target.configuration}.env`,
                `${task.projectRoot}/.${task.target.configuration}.local.env`,
                `${task.projectRoot}/.${task.target.configuration}.env`,
            ]
            : []),
        // Load DotEnv Files for a target in the project root
        `${task.projectRoot}/.env.${task.target.target}.local`,
        `${task.projectRoot}/.env.${task.target.target}`,
        `${task.projectRoot}/.${task.target.target}.local.env`,
        `${task.projectRoot}/.${task.target.target}.env`,
        `${task.projectRoot}/.env.local`,
        `${task.projectRoot}/.local.env`,
        `${task.projectRoot}/.env`,
        // Load DotEnv Files for a configuration in the workspace root
        ...(task.target.configuration
            ? [
                `.env.${task.target.target}.${task.target.configuration}.local`,
                `.env.${task.target.target}.${task.target.configuration}`,
                `.env.${task.target.configuration}.local`,
                `.env.${task.target.configuration}`,
                `.${task.target.target}.${task.target.configuration}.local.env`,
                `.${task.target.target}.${task.target.configuration}.env`,
                `.${task.target.configuration}.local.env`,
                `.${task.target.configuration}.env`,
            ]
            : []),
        // Load DotEnv Files for a target in the workspace root
        `.env.${task.target.target}.local`,
        `.env.${task.target.target}`,
        `.${task.target.target}.local.env`,
        `.${task.target.target}.env`,
        // Load base DotEnv Files at workspace root
        `.local.env`,
        `.env.local`,
        `.env`,
    ];
}
function loadDotEnvFilesForTask(task, environmentVariables) {
    const dotEnvFiles = getEnvFilesForTask(task);
    for (const file of dotEnvFiles) {
        loadAndExpandDotEnvFile((0, node_path_1.join)(workspace_root_1.workspaceRoot, file), environmentVariables);
    }
    return environmentVariables;
}
function unloadDotEnvFiles(environmentVariables) {
    for (const file of ['.env', '.local.env', '.env.local']) {
        unloadDotEnvFile((0, node_path_1.join)(workspace_root_1.workspaceRoot, file), environmentVariables);
    }
    return environmentVariables;
}
