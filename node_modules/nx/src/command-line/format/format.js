"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.format = format;
const node_child_process_1 = require("node:child_process");
const path = require("node:path");
const file_utils_1 = require("../../project-graph/file-utils");
const command_line_utils_1 = require("../../utils/command-line-utils");
const fileutils_1 = require("../../utils/fileutils");
const ignore_1 = require("../../utils/ignore");
const configuration_1 = require("../../config/configuration");
const typescript_1 = require("../../plugins/js/utils/typescript");
const affected_project_graph_1 = require("../../project-graph/affected/affected-project-graph");
const project_graph_1 = require("../../project-graph/project-graph");
const all_file_data_1 = require("../../utils/all-file-data");
const chunkify_1 = require("../../utils/chunkify");
const object_sort_1 = require("../../utils/object-sort");
const output_1 = require("../../utils/output");
const package_json_1 = require("../../utils/package-json");
const workspace_root_1 = require("../../utils/workspace-root");
async function format(command, args) {
    try {
        require('prettier');
    }
    catch {
        output_1.output.error({
            title: 'Prettier is not installed.',
            bodyLines: [
                `Please install "prettier" and try again, or don't run the "nx format:${command}" command.`,
            ],
        });
        process.exit(1);
    }
    const { nxArgs } = (0, command_line_utils_1.splitArgsIntoNxArgsAndOverrides)(args, 'affected', { printWarnings: false }, (0, configuration_1.readNxJson)());
    const patterns = (await getPatterns({ ...args, ...nxArgs })).map(
    // prettier removes one of the \
    // prettier-ignore
    (p) => `"${p.replace(/\$/g, '\\\$')}"`);
    // Chunkify the patterns array to prevent crashing the windows terminal
    const chunkList = (0, chunkify_1.chunkify)(patterns);
    switch (command) {
        case 'write':
            if (nxArgs.sortRootTsconfigPaths) {
                sortTsConfig();
            }
            addRootConfigFiles(chunkList, nxArgs);
            chunkList.forEach((chunk) => write(chunk));
            break;
        case 'check': {
            const filesWithDifferentFormatting = [];
            for (const chunk of chunkList) {
                const files = await check(chunk);
                filesWithDifferentFormatting.push(...files);
            }
            if (filesWithDifferentFormatting.length > 0) {
                if (nxArgs.verbose) {
                    output_1.output.error({
                        title: 'The following files are not formatted correctly based on your Prettier configuration',
                        bodyLines: [
                            '- Run "nx format:write" and commit the resulting diff to fix these files.',
                            '- Please note, Prettier does not support a native way to diff the output of its check logic (https://github.com/prettier/prettier/issues/6885).',
                            '',
                            ...filesWithDifferentFormatting,
                        ],
                    });
                }
                else {
                    console.log(filesWithDifferentFormatting.join('\n'));
                }
                process.exit(1);
            }
            break;
        }
    }
}
async function getPatterns(args) {
    const graph = await (0, project_graph_1.createProjectGraphAsync)({ exitOnError: true });
    const allFilesPattern = ['.'];
    if (args.all) {
        return allFilesPattern;
    }
    try {
        if (args.projects && args.projects.length > 0) {
            return getPatternsFromProjects(args.projects, graph);
        }
        const p = (0, command_line_utils_1.parseFiles)(args);
        // In prettier v3 the getSupportInfo result is a promise
        const supportedExtensions = new Set((await require('prettier').getSupportInfo()).languages
            .flatMap((language) => language.extensions)
            .filter((extension) => !!extension)
            // Prettier supports ".swcrc" as a file instead of an extension
            // So we add ".swcrc" as a supported extension manually
            // which allows it to be considered for calculating "patterns"
            .concat('.swcrc'));
        const patterns = p.files
            .map((f) => path.relative(workspace_root_1.workspaceRoot, f))
            .filter((f) => (0, fileutils_1.fileExists)(f) && supportedExtensions.has(path.extname(f)));
        // exclude patterns in .nxignore or .gitignore
        const nonIgnoredPatterns = (0, ignore_1.getIgnoreObject)().filter(patterns);
        return args.libsAndApps
            ? await getPatternsFromApps(nonIgnoredPatterns, await (0, all_file_data_1.allFileData)(), graph)
            : nonIgnoredPatterns;
    }
    catch (err) {
        output_1.output.error({
            title: err?.message ||
                'Something went wrong when resolving the list of files for the formatter',
            bodyLines: [`Defaulting to all files pattern: "${allFilesPattern}"`],
        });
        return allFilesPattern;
    }
}
async function getPatternsFromApps(affectedFiles, allWorkspaceFiles, projectGraph) {
    const graph = await (0, project_graph_1.createProjectGraphAsync)({
        exitOnError: true,
    });
    const affectedGraph = await (0, affected_project_graph_1.filterAffected)(graph, (0, file_utils_1.calculateFileChanges)(affectedFiles, allWorkspaceFiles));
    return getPatternsFromProjects(Object.keys(affectedGraph.nodes), projectGraph);
}
function addRootConfigFiles(chunkList, nxArgs) {
    if (nxArgs.all) {
        return;
    }
    const chunk = [];
    const addToChunkIfNeeded = (file) => {
        if (chunkList.every((c) => !c.includes(`"${file}"`))) {
            chunk.push(file);
        }
    };
    // if (workspaceJsonPath) {
    //   addToChunkIfNeeded(workspaceJsonPath);
    // }
    ['nx.json', (0, typescript_1.getRootTsConfigFileName)()]
        .filter(Boolean)
        .forEach(addToChunkIfNeeded);
    if (chunk.length > 0) {
        chunkList.push(chunk);
    }
}
function getPatternsFromProjects(projects, projectGraph) {
    return (0, command_line_utils_1.getProjectRoots)(projects, projectGraph);
}
function write(patterns) {
    if (patterns.length > 0) {
        const [swcrcPatterns, regularPatterns] = patterns.reduce((result, pattern) => {
            result[pattern.includes('.swcrc') ? 0 : 1].push(pattern);
            return result;
        }, [[], []]);
        const prettierPath = getPrettierPath();
        (0, node_child_process_1.execSync)(`node "${prettierPath}" --write --list-different ${regularPatterns.join(' ')}`, {
            stdio: [0, 1, 2],
            windowsHide: false,
        });
        if (swcrcPatterns.length > 0) {
            (0, node_child_process_1.execSync)(`node "${prettierPath}" --write --list-different ${swcrcPatterns.join(' ')} --parser json`, {
                stdio: [0, 1, 2],
                windowsHide: false,
            });
        }
    }
}
async function check(patterns) {
    if (patterns.length === 0) {
        return [];
    }
    const prettierPath = getPrettierPath();
    return new Promise((resolve) => {
        (0, node_child_process_1.exec)(`node "${prettierPath}" --list-different ${patterns.join(' ')}`, { encoding: 'utf-8', windowsHide: false }, (error, stdout) => {
            if (error) {
                // The command failed so there are files with different formatting. Prettier writes them to stdout, newline separated.
                resolve(stdout.trim().split('\n'));
            }
            else {
                // The command succeeded so there are no files with different formatting
                resolve([]);
            }
        });
    });
}
function sortTsConfig() {
    try {
        const tsconfigPath = (0, typescript_1.getRootTsConfigPath)();
        const tsconfig = (0, fileutils_1.readJsonFile)(tsconfigPath);
        const sortedPaths = (0, object_sort_1.sortObjectByKeys)(tsconfig.compilerOptions.paths);
        tsconfig.compilerOptions.paths = sortedPaths;
        (0, fileutils_1.writeJsonFile)(tsconfigPath, tsconfig);
    }
    catch (e) {
        // catch noop
    }
}
let prettierPath;
function getPrettierPath() {
    if (prettierPath) {
        return prettierPath;
    }
    const { bin } = (0, package_json_1.readModulePackageJson)('prettier').packageJson;
    prettierPath = require.resolve(path.join('prettier', bin));
    return prettierPath;
}
