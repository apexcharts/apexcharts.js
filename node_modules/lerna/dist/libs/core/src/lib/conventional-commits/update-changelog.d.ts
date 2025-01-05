import { Package } from "../package";
import { BaseChangelogOptions, ChangelogType } from "./constants";
export declare function updateChangelog(pkg: Package, type: ChangelogType, { changelogPreset, changelogEntryAdditionalMarkdown, rootPath, tagPrefix, version, }: BaseChangelogOptions & {
    version?: string;
}): Promise<{
    logPath: string;
    newEntry: string;
}>;
