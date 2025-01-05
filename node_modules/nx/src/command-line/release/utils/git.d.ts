export interface GitCommitAuthor {
    name: string;
    email: string;
}
export interface RawGitCommit {
    message: string;
    body: string;
    shortHash: string;
    author: GitCommitAuthor;
}
export interface Reference {
    type: 'hash' | 'issue' | 'pull-request';
    value: string;
}
export interface GitCommit extends RawGitCommit {
    description: string;
    type: string;
    scope: string;
    references: Reference[];
    authors: GitCommitAuthor[];
    isBreaking: boolean;
    affectedFiles: string[];
    revertedHashes: string[];
}
export declare function getLatestGitTagForPattern(releaseTagPattern: string, additionalInterpolationData?: {}): Promise<{
    tag: string;
    extractedVersion: string;
} | null>;
export declare function getGitDiff(from: string | undefined, to?: string): Promise<RawGitCommit[]>;
export declare function gitAdd({ changedFiles, deletedFiles, dryRun, verbose, logFn, cwd, }: {
    changedFiles?: string[];
    deletedFiles?: string[];
    dryRun?: boolean;
    verbose?: boolean;
    cwd?: string;
    logFn?: (...messages: string[]) => void;
}): Promise<string>;
export declare function gitCommit({ messages, additionalArgs, dryRun, verbose, logFn, }: {
    messages: string[];
    additionalArgs?: string | string[];
    dryRun?: boolean;
    verbose?: boolean;
    logFn?: (message: string) => void;
}): Promise<string>;
export declare function gitTag({ tag, message, additionalArgs, dryRun, verbose, logFn, }: {
    tag: string;
    message?: string;
    additionalArgs?: string | string[];
    dryRun?: boolean;
    verbose?: boolean;
    logFn?: (message: string) => void;
}): Promise<string>;
export declare function gitPush({ gitRemote, dryRun, verbose, }: {
    gitRemote?: string;
    dryRun?: boolean;
    verbose?: boolean;
}): Promise<void>;
export declare function parseCommits(commits: RawGitCommit[]): GitCommit[];
export declare function parseConventionalCommitsMessage(message: string): {
    type: string;
    scope: string;
    description: string;
    breaking: boolean;
} | null;
export declare function parseGitCommit(commit: RawGitCommit, isVersionPlanCommit?: boolean): GitCommit | null;
export declare function getCommitHash(ref: string): Promise<string>;
export declare function getFirstGitCommit(): Promise<string>;
