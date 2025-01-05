import { Package } from "../package";
import { BaseChangelogOptions, VersioningStrategy } from "./constants";
export declare function recommendVersion(pkg: Package, type: VersioningStrategy, { changelogPreset, rootPath, tagPrefix, prereleaseId, conventionalBumpPrerelease, buildMetadata, }: BaseChangelogOptions & {
    prereleaseId?: string;
    buildMetadata?: string;
}, premajorVersionBump: "default" | "force-patch"): Promise<string>;
