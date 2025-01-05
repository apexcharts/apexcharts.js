import { PackageJson } from '../../../utils/package-json';
import { PackageManagerCommands } from '../../../utils/package-manager';
export declare function createNxJsonFile(repoRoot: string, topologicalTargets: string[], cacheableOperations: string[], scriptOutputs: {
    [name: string]: string;
}): void;
export declare function addDepsToPackageJson(repoRoot: string, additionalPackages?: string[]): void;
export declare function updateGitIgnore(root: string): void;
export declare function runInstall(repoRoot: string, pmc?: PackageManagerCommands): void;
export declare function initCloud(installationSource: 'nx-init' | 'nx-init-angular' | 'nx-init-cra' | 'nx-init-monorepo' | 'nx-init-nest' | 'nx-init-npm-repo'): Promise<void>;
export declare function addVsCodeRecommendedExtensions(repoRoot: string, extensions: string[]): void;
export declare function markRootPackageJsonAsNxProjectLegacy(repoRoot: string, cacheableScripts: string[], pmc: PackageManagerCommands): void;
export declare function markPackageJsonAsNxProject(packageJsonPath: string): void;
export declare function printFinalMessage({ learnMoreLink, }: {
    learnMoreLink?: string;
}): void;
export declare function isMonorepo(packageJson: PackageJson): boolean;
