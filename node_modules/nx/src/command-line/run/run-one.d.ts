import { TargetDependencyConfig } from '../../config/workspace-json-project-json';
export declare function runOne(cwd: string, args: {
    [k: string]: any;
}, extraTargetDependencies?: Record<string, (TargetDependencyConfig | string)[]>, extraOptions?: {
    excludeTaskDependencies: boolean;
    loadDotEnvFiles: boolean;
}): Promise<void>;
