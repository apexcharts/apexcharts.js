import { LoadedNxPlugin } from './internal-api';
export declare function getPlugins(): Promise<LoadedNxPlugin[]>;
export declare function getOnlyDefaultPlugins(): Promise<LoadedNxPlugin[]>;
export declare function cleanupPlugins(): void;
