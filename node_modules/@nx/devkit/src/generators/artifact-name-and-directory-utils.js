"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.determineArtifactNameAndDirectoryOptions = determineArtifactNameAndDirectoryOptions;
exports.getRelativeCwd = getRelativeCwd;
exports.setCwd = setCwd;
const devkit_exports_1 = require("nx/src/devkit-exports");
const devkit_internals_1 = require("nx/src/devkit-internals");
const path_1 = require("path");
const DEFAULT_ALLOWED_JS_FILE_EXTENSIONS = ['js', 'cjs', 'mjs', 'jsx'];
const DEFAULT_ALLOWED_TS_FILE_EXTENSIONS = ['ts', 'cts', 'mts', 'tsx'];
const DEFAULT_ALLOWED_FILE_EXTENSIONS = [
    ...DEFAULT_ALLOWED_JS_FILE_EXTENSIONS,
    ...DEFAULT_ALLOWED_TS_FILE_EXTENSIONS,
    'vue',
];
async function determineArtifactNameAndDirectoryOptions(tree, options) {
    const normalizedOptions = getNameAndDirectoryOptions(tree, options);
    validateResolvedProject(normalizedOptions.project, normalizedOptions.directory);
    return normalizedOptions;
}
function getNameAndDirectoryOptions(tree, options) {
    const path = options.path
        ? (0, devkit_exports_1.normalizePath)(options.path.replace(/^\.?\//, ''))
        : undefined;
    let { name: extractedName, directory } = extractNameAndDirectoryFromPath(path);
    const relativeCwd = getRelativeCwd();
    // append the directory to the current working directory if it doesn't start with it
    if (directory !== relativeCwd && !directory.startsWith(`${relativeCwd}/`)) {
        directory = (0, devkit_exports_1.joinPathFragments)(relativeCwd, directory);
    }
    const project = findProjectFromPath(tree, directory);
    let fileName = extractedName;
    let fileExtension = options.fileExtension ?? 'ts';
    const allowedFileExtensions = options.allowedFileExtensions ?? DEFAULT_ALLOWED_FILE_EXTENSIONS;
    const fileExtensionRegex = new RegExp(`\\.(${allowedFileExtensions.join('|')})$`);
    const fileExtensionMatch = fileName.match(fileExtensionRegex);
    if (fileExtensionMatch) {
        fileExtension = fileExtensionMatch[1];
        fileName = fileName.replace(fileExtensionRegex, '');
        extractedName = fileName;
    }
    else if (options.suffix) {
        fileName = `${fileName}.${options.suffix}`;
    }
    const filePath = (0, devkit_exports_1.joinPathFragments)(directory, `${fileName}.${fileExtension}`);
    const fileExtensionType = getFileExtensionType(fileExtension);
    validateFileExtension(fileExtension, allowedFileExtensions, options.js, options.jsOptionName);
    return {
        artifactName: options.name ?? extractedName,
        directory,
        fileName,
        fileExtension,
        fileExtensionType,
        filePath,
        project,
    };
}
function validateResolvedProject(project, normalizedDirectory) {
    if (project) {
        return;
    }
    throw new Error(`The provided directory resolved relative to the current working directory "${normalizedDirectory}" does not exist under any project root. ` +
        `Please make sure to navigate to a location or provide a directory that exists under a project root.`);
}
function findProjectFromPath(tree, path) {
    const projectConfigurations = {};
    const projects = (0, devkit_exports_1.getProjects)(tree);
    for (const [projectName, project] of projects) {
        projectConfigurations[projectName] = project;
    }
    const projectRootMappings = (0, devkit_internals_1.createProjectRootMappingsFromProjectConfigurations)(projectConfigurations);
    return (0, devkit_internals_1.findProjectForPath)(path, projectRootMappings);
}
function getRelativeCwd() {
    return (0, devkit_exports_1.normalizePath)((0, path_1.relative)(devkit_exports_1.workspaceRoot, getCwd()));
}
/**
 * Function for setting cwd during testing
 */
function setCwd(path) {
    process.env.INIT_CWD = (0, path_1.join)(devkit_exports_1.workspaceRoot, path);
}
function getCwd() {
    return process.env.INIT_CWD?.startsWith(devkit_exports_1.workspaceRoot)
        ? process.env.INIT_CWD
        : process.cwd();
}
function extractNameAndDirectoryFromPath(path) {
    // Remove trailing slash
    path = path.replace(/\/$/, '');
    const parsedPath = (0, devkit_exports_1.normalizePath)(path).split('/');
    const name = parsedPath.pop();
    const directory = parsedPath.join('/');
    return { name, directory };
}
function getFileExtensionType(fileExtension) {
    if (DEFAULT_ALLOWED_JS_FILE_EXTENSIONS.includes(fileExtension)) {
        return 'js';
    }
    if (DEFAULT_ALLOWED_TS_FILE_EXTENSIONS.includes(fileExtension)) {
        return 'ts';
    }
    return 'other';
}
function validateFileExtension(fileExtension, allowedFileExtensions, js, jsOptionName) {
    const fileExtensionType = getFileExtensionType(fileExtension);
    if (!allowedFileExtensions.includes(fileExtension)) {
        throw new Error(`The provided file path has an extension (.${fileExtension}) that is not supported by this generator.
The supported extensions are: ${allowedFileExtensions
            .map((ext) => `.${ext}`)
            .join(', ')}.`);
    }
    if (js !== undefined) {
        jsOptionName = jsOptionName ?? 'js';
        if (js && fileExtensionType === 'ts') {
            throw new Error(`The provided file path has an extension (.${fileExtension}) that conflicts with the provided "--${jsOptionName}" option.`);
        }
        if (!js && fileExtensionType === 'js') {
            throw new Error(`The provided file path has an extension (.${fileExtension}) that conflicts with the provided "--${jsOptionName}" option.`);
        }
    }
    return fileExtensionType;
}
