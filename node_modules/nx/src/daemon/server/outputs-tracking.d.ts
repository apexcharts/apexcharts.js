import { WatchEvent } from '../../native';
export declare function _recordOutputsHash(outputs: string[], hash: string): void;
export declare function _outputsHashesMatch(outputs: string[], hash: string): boolean;
export declare function recordedHash(output: string): string;
export declare function recordOutputsHash(_outputs: string[], hash: string): Promise<void>;
export declare function outputsHashesMatch(_outputs: string[], hash: string): Promise<boolean>;
export declare function processFileChangesInOutputs(changeEvents: WatchEvent[], now?: number): void;
export declare function disableOutputsTracking(): void;
