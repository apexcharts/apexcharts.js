import { NxReleaseConfiguration } from '../../config/nx-json';
import { ChangelogOptions } from './command-object';
import { NxReleaseConfig } from './config/config';
import { Reference } from './utils/git';
import { ReleaseVersion } from './utils/shared';
export interface NxReleaseChangelogResult {
    workspaceChangelog?: {
        releaseVersion: ReleaseVersion;
        contents: string;
    };
    projectChangelogs?: {
        [projectName: string]: {
            releaseVersion: ReleaseVersion;
            contents: string;
        };
    };
}
export interface ChangelogChange {
    type: string;
    scope: string;
    description: string;
    affectedProjects: string[] | '*';
    body?: string;
    isBreaking?: boolean;
    githubReferences?: Reference[];
    authors?: {
        name: string;
        email: string;
    }[];
    shortHash?: string;
    revertedHashes?: string[];
}
export declare const releaseChangelogCLIHandler: (args: ChangelogOptions) => Promise<number>;
export declare function createAPI(overrideReleaseConfig: NxReleaseConfiguration): (args: ChangelogOptions) => Promise<NxReleaseChangelogResult>;
export declare function shouldCreateGitHubRelease(changelogConfig: NxReleaseConfig['changelog']['workspaceChangelog'] | NxReleaseConfig['changelog']['projectChangelogs'] | NxReleaseConfig['groups'][number]['changelog'], createReleaseArg?: ChangelogOptions['createRelease'] | undefined): boolean;
