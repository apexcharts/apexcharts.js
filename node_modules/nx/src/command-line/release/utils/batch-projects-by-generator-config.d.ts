import { ProjectGraph } from '../../../config/project-graph';
import { ReleaseGroupWithName } from '../config/filter-release-groups';
/**
 * To be most efficient with our invocations of runVersionOnProjects, we want to batch projects by their generator and generator options
 * within any given release group.
 */
export declare function batchProjectsByGeneratorConfig(projectGraph: ProjectGraph, releaseGroup: ReleaseGroupWithName, projectNamesToBatch: string[]): Map<string, string[]>;
