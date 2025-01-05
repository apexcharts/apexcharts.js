"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProjectsAndGlobalChanges = getProjectsAndGlobalChanges;
const perf_hooks_1 = require("perf_hooks");
const project_graph_incremental_recomputation_1 = require("../project-graph-incremental-recomputation");
function getProjectsAndGlobalChanges(createdFiles, updatedFiles, deletedFiles) {
    const projectAndGlobalChanges = {
        projects: {},
        globalFiles: [],
    };
    perf_hooks_1.performance.mark('changed-projects:start');
    const allChangedFiles = [
        ...(createdFiles ?? []).map((c) => ({
            path: c,
            type: 'create',
        })),
        ...(updatedFiles ?? []).map((c) => ({
            path: c,
            type: 'update',
        })),
        ...(deletedFiles ?? []).map((c) => ({
            path: c,
            type: 'delete',
        })),
    ];
    const fileToProjectMap = {};
    for (const [projectName, projectFiles] of Object.entries(project_graph_incremental_recomputation_1.fileMapWithFiles?.fileMap?.projectFileMap ?? {})) {
        for (const projectFile of projectFiles) {
            fileToProjectMap[projectFile.file] = projectName;
        }
    }
    for (const changedFile of allChangedFiles) {
        const project = fileToProjectMap[changedFile.path];
        if (project) {
            (projectAndGlobalChanges.projects[project] ??= []).push(changedFile);
        }
        else {
            projectAndGlobalChanges.globalFiles.push(changedFile);
        }
    }
    perf_hooks_1.performance.mark('changed-projects:end');
    perf_hooks_1.performance.measure('changed-projects', 'changed-projects:start', 'changed-projects:end');
    return projectAndGlobalChanges;
}
