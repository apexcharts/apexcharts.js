import { ProjectConfiguration } from '../src/config/workspace-json-project-json';
export type PackageJsonConfigurationCache = {
    [hash: string]: ProjectConfiguration;
};
export declare function readPackageJsonConfigurationCache(): PackageJsonConfigurationCache;
