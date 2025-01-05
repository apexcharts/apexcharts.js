import { NxReleaseChangelogConfiguration } from '../../../config/nx-json';
import { Reference } from './git';
import { ReleaseVersion } from './shared';
export type RepoSlug = `${string}/${string}`;
interface GithubRequestConfig {
    repo: string;
    hostname: string;
    apiBaseUrl: string;
    token: string | null;
}
interface GithubRelease {
    id?: string;
    tag_name: string;
    target_commitish?: string;
    name?: string;
    body?: string;
    draft?: boolean;
    prerelease?: boolean;
    make_latest?: 'legacy' | boolean;
}
export interface GithubRepoData {
    hostname: string;
    slug: RepoSlug;
    apiBaseUrl: string;
}
export declare function getGitHubRepoData(remoteName: string, createReleaseConfig: NxReleaseChangelogConfiguration['createRelease']): GithubRepoData | null;
export declare function createOrUpdateGithubRelease(createReleaseConfig: NxReleaseChangelogConfiguration['createRelease'], releaseVersion: ReleaseVersion, changelogContents: string, latestCommit: string, { dryRun }: {
    dryRun: boolean;
}): Promise<void>;
export declare function getGithubReleaseByTag(config: GithubRequestConfig, tag: string): Promise<GithubRelease>;
export declare function formatReferences(references: Reference[], repoData: GithubRepoData): string;
export {};
