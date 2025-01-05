import { Task } from '../config/task-graph';
export declare function getEnvVariablesForBatchProcess(skipNxCache: boolean, captureStderr: boolean): NodeJS.ProcessEnv;
export declare function getTaskSpecificEnv(task: Task): NodeJS.ProcessEnv;
export declare function getEnvVariablesForTask(task: Task, taskSpecificEnv: NodeJS.ProcessEnv, forceColor: string, skipNxCache: boolean, captureStderr: boolean, outputPath: string, streamOutput: boolean): {
    [x: string]: string;
    TZ?: string;
};
/**
 * This function loads a .env file and expands the variables in it.
 * @param filename the .env file to load
 * @param environmentVariables the object to load environment variables into
 * @param override whether to override existing environment variables
 */
export declare function loadAndExpandDotEnvFile(filename: string, environmentVariables: NodeJS.ProcessEnv, override?: boolean): import("dotenv-expand").DotenvExpandOutput;
/**
 * This function unloads a .env file and removes the variables in it from the environmentVariables.
 * @param filename
 * @param environmentVariables
 */
export declare function unloadDotEnvFile(filename: string, environmentVariables: NodeJS.ProcessEnv, override?: boolean): void;
