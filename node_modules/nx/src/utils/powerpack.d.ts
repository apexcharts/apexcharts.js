export declare function printPowerpackLicense(): Promise<void>;
export declare function getPowerpackLicenseInformation(): Promise<import("@nx/powerpack-license").PowerpackLicense>;
export declare class NxPowerpackNotInstalledError extends Error {
    constructor(e: Error);
}
