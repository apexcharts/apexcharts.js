"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTouchedProjectsFromLockFile = void 0;
const configuration_1 = require("../../../../config/configuration");
const config_1 = require("../../utils/config");
const find_matching_projects_1 = require("../../../../utils/find-matching-projects");
const getTouchedProjectsFromLockFile = (fileChanges, projectGraphNodes) => {
    const nxJson = (0, configuration_1.readNxJson)();
    const { projectsAffectedByDependencyUpdates } = (0, config_1.jsPluginConfig)(nxJson);
    if (projectsAffectedByDependencyUpdates === 'auto') {
        return [];
    }
    else if (Array.isArray(projectsAffectedByDependencyUpdates)) {
        return (0, find_matching_projects_1.findMatchingProjects)(projectsAffectedByDependencyUpdates, projectGraphNodes);
    }
    const lockFiles = [
        'package-lock.json',
        'yarn.lock',
        'pnpm-lock.yaml',
        'pnpm-lock.yml',
        'bun.lockb',
    ];
    if (fileChanges.some((f) => lockFiles.includes(f.file))) {
        return Object.values(projectGraphNodes).map((p) => p.name);
    }
    return [];
};
exports.getTouchedProjectsFromLockFile = getTouchedProjectsFromLockFile;
