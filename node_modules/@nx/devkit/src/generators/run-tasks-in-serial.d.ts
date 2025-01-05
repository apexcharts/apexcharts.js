import type { GeneratorCallback } from 'nx/src/devkit-exports';
/**
 * Run tasks in serial
 *
 * @param tasks The tasks to run in serial.
 */
export declare function runTasksInSerial(...tasks: GeneratorCallback[]): GeneratorCallback;
