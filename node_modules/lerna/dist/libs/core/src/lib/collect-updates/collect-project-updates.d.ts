import { ExecOptions } from "child_process";
import { ProjectGraphProjectNodeWithPackage, ProjectGraphWithPackages } from "../project-graph-with-packages";
export interface ProjectUpdateCollectorOptions {
    bump?: string;
    canary?: boolean;
    ignoreChanges?: string[];
    includeMergedTags?: boolean;
    forcePublish?: boolean | string | string[];
    since?: string;
    conventionalCommits?: boolean;
    conventionalGraduate?: string | boolean;
    forceConventionalGraduate?: boolean;
    excludeDependents?: boolean;
    tagVersionSeparator?: string;
}
/**
 * Create a list of graph nodes representing projects changed since the previous release, tagged or otherwise.
 */
export declare function collectProjectUpdates(filteredProjects: ProjectGraphProjectNodeWithPackage[], projectGraph: ProjectGraphWithPackages, execOpts: ExecOptions, commandOptions: ProjectUpdateCollectorOptions): ProjectGraphProjectNodeWithPackage[];
export interface ProjectCollectorOptions {
    isCandidate?: (node: ProjectGraphProjectNodeWithPackage, packageName: string) => boolean;
    onInclude?: (packageName: string) => void;
    excludeDependents?: boolean;
}
export declare function collectProjects(projects: ProjectGraphProjectNodeWithPackage[], projectGraph: ProjectGraphWithPackages, { isCandidate, onInclude, excludeDependents }?: ProjectCollectorOptions): ProjectGraphProjectNodeWithPackage[];
/**
 * Build a set of nodes that are dependents of the input set.
 */
export declare function collectDependents(nodes: Record<string, ProjectGraphProjectNodeWithPackage>, projectGraph: ProjectGraphWithPackages): Set<ProjectGraphProjectNodeWithPackage>;
