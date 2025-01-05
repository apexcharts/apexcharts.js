import { Package, RawManifest } from "@lerna/core";
/**
 * Symlink bins of srcPackage to node_modules/.bin in destPackage
 */
export declare function symlinkBinary(srcPackageRef: string | Package | RawManifest, destPackageRef: string | Package | RawManifest): Promise<[Package, Package]>;
