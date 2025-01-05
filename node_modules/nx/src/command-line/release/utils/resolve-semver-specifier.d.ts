import { ProjectGraph } from '../../../config/project-graph';
import { NxReleaseConfig } from '../config/config';
export declare function resolveSemverSpecifierFromConventionalCommits(from: string, projectGraph: ProjectGraph, projectNames: string[], conventionalCommitsConfig: NxReleaseConfig['conventionalCommits']): Promise<string | null>;
export declare function resolveSemverSpecifierFromPrompt(selectionMessage: string, customVersionMessage: string): Promise<string>;
