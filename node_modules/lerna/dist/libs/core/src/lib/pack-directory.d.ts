import { IntegrityMap } from "ssri";
import log from "./npmlog";
import { Package } from "./package";
interface PackConfig {
    log?: typeof log;
    lernaCommand?: string;
    ignorePrepublish?: boolean;
}
export interface Packed {
    id: string;
    name: string;
    version: string;
    size: number;
    unpackedSize: number;
    shasum: string;
    integrity: IntegrityMap;
    filename: string;
    files: string[];
    entryCount: number;
    bundled: unknown[];
    tarFilePath: string;
}
/**
 * Pack a directory suitable for publishing, writing tarball to a tempfile.
 * @param _pkg Package instance or path to manifest
 * @param dir to pack
 * @param options
 */
export declare function packDirectory(_pkg: Package | string, dir: string, options: PackConfig): Promise<Packed>;
export {};
