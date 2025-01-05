export declare function makeFileFinder(rootPath: string, packageConfigs: any[]): (fileName: string, fileMapper: any, customGlobOpts: any) => Promise<any>;
export declare function makeSyncFileFinder(rootPath: string, packageConfigs: any[]): <T>(fileName: string, fileMapper: (filePath: string) => T) => T[];
