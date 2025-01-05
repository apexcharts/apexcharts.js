interface Tarball {
    name: string;
    version: any;
    filename: string;
    files: any[];
    bundled: any[];
    size: any;
    unpackedSize: any;
    shasum: any;
    integrity: any;
    entryCount: number;
}
export declare function logPacked(tarball: Tarball): void;
export {};
