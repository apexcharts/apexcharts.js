export type VersioningStrategy = "independent" | "fixed";
export type ChangelogType = "fixed" | "independent" | "root";
export type ChangelogPresetConfig = string | {
    name: string;
    [key: string]: unknown;
};
export type BaseChangelogOptions = {
    changelogPreset?: ChangelogPresetConfig;
    changelogEntryAdditionalMarkdown?: string;
    rootPath: string;
    tagPrefix?: string;
    conventionalBumpPrerelease?: boolean;
};
export declare const EOL = "\n";
export declare const BLANK_LINE: string;
export declare const COMMIT_GUIDELINE = "See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.";
export declare const CHANGELOG_HEADER: string;
