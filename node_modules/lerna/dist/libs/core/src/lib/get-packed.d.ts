import ssri from "ssri";
export declare function getPacked(pkg: any, tarFilePath: any): Promise<{
    id: string;
    name: any;
    version: any;
    size: number;
    unpackedSize: number;
    shasum: any;
    integrity: ssri.IntegrityMap;
    filename: string;
    files: any[];
    entryCount: number;
    bundled: unknown[];
    tarFilePath: any;
}>;
