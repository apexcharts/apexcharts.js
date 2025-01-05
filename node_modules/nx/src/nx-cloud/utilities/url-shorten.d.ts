/**
 * This is currently duplicated in Nx Console. Please let @MaxKless know if you make changes here.
 */
export declare function createNxCloudOnboardingURL(onboardingSource: string, accessToken?: string, usesGithub?: boolean, meta?: string): Promise<string>;
export declare function repoUsesGithub(github?: boolean, githubSlug?: string, apiUrl?: string): Promise<boolean>;
export declare function getURLifShortenFailed(usesGithub: boolean, githubSlug: string | null, apiUrl: string, source: string, accessToken?: string): string;
export declare function getNxCloudVersion(apiUrl: string): Promise<string | null>;
export declare function removeVersionModifier(versionString: string): string;
export declare function versionIsValid(version: string): boolean;
export declare function compareCleanCloudVersions(version1: string, version2: string): number;
