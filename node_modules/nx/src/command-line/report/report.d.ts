import { PackageManager } from '../../utils/package-manager';
import { PackageJson } from '../../utils/package-json';
import { NxJsonConfiguration } from '../../config/nx-json';
import type { PowerpackLicense } from '@nx/powerpack-license';
export declare const packagesWeCareAbout: string[];
export declare const patternsWeIgnoreInCommunityReport: Array<string | RegExp>;
/**
 * Reports relevant version numbers for adding to an Nx issue report
 *
 * @remarks
 *
 * Must be run within an Nx workspace
 *
 */
export declare function reportHandler(): Promise<void>;
export interface ReportData {
    pm: PackageManager;
    pmVersion: string;
    powerpackLicense: PowerpackLicense | null;
    powerpackError: Error | null;
    powerpackPlugins: PackageJson[];
    localPlugins: string[];
    communityPlugins: PackageJson[];
    registeredPlugins: string[];
    packageVersionsWeCareAbout: {
        package: string;
        version: string;
    }[];
    outOfSyncPackageGroup?: {
        basePackage: string;
        misalignedPackages: {
            name: string;
            version: string;
        }[];
        migrateTarget: string;
    };
    projectGraphError?: Error | null;
    nativeTarget: string | null;
}
export declare function getReportData(): Promise<ReportData>;
interface OutOfSyncPackageGroup {
    basePackage: string;
    misalignedPackages: {
        name: string;
        version: string;
    }[];
    migrateTarget: string;
}
export declare function findMisalignedPackagesForPackage(base: PackageJson): undefined | OutOfSyncPackageGroup;
export declare function findInstalledPowerpackPlugins(): PackageJson[];
export declare function findInstalledCommunityPlugins(): PackageJson[];
export declare function findRegisteredPluginsBeingUsed(nxJson: NxJsonConfiguration): string[];
export declare function findInstalledPackagesWeCareAbout(): {
    package: string;
    version: string;
}[];
export {};
