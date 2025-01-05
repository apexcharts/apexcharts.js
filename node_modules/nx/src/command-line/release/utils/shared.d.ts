import { ProjectGraph } from '../../../config/project-graph';
import { Tree } from '../../../generators/tree';
import type { ReleaseGroupWithName } from '../config/filter-release-groups';
import { GitCommit } from './git';
export declare const noDiffInChangelogMessage: string;
export type ReleaseVersionGeneratorResult = {
    data: VersionData;
    callback: (tree: Tree, opts: {
        dryRun?: boolean;
        verbose?: boolean;
        generatorOptions?: Record<string, unknown>;
    }) => Promise<string[] | {
        changedFiles: string[];
        deletedFiles: string[];
    }>;
};
export type VersionData = Record<string, {
    /**
     * newVersion will be null in the case that no changes are detected for the project,
     * e.g. when using conventional commits
     */
    newVersion: string | null;
    currentVersion: string;
    /**
     * The list of projects which depend upon the current project.
     * TODO: investigate generic type for this once more ecosystems are explored
     */
    dependentProjects: any[];
}>;
export declare class ReleaseVersion {
    rawVersion: string;
    gitTag: string;
    isPrerelease: boolean;
    constructor({ version, // short form version string with no prefixes or patterns, e.g. 1.0.0
    releaseTagPattern, // full pattern to interpolate, e.g. "v{version}" or "{projectName}@{version}"
    projectName, }: {
        version: string;
        releaseTagPattern: string;
        projectName?: string;
    });
}
export declare function commitChanges({ changedFiles, deletedFiles, isDryRun, isVerbose, gitCommitMessages, gitCommitArgs, }: {
    changedFiles?: string[];
    deletedFiles?: string[];
    isDryRun?: boolean;
    isVerbose?: boolean;
    gitCommitMessages?: string[];
    gitCommitArgs?: string | string[];
}): Promise<void>;
export declare function createCommitMessageValues(releaseGroups: ReleaseGroupWithName[], releaseGroupToFilteredProjects: Map<ReleaseGroupWithName, Set<string>>, versionData: VersionData, commitMessage: string): string[];
export declare function createGitTagValues(releaseGroups: ReleaseGroupWithName[], releaseGroupToFilteredProjects: Map<ReleaseGroupWithName, Set<string>>, versionData: VersionData): string[];
export declare function handleDuplicateGitTags(gitTagValues: string[]): void;
export declare function getCommitsRelevantToProjects(projectGraph: ProjectGraph, commits: GitCommit[], projects: string[]): Promise<GitCommit[]>;
