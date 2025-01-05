import type { Executor } from 'nx/src/devkit-exports';
/**
 * Convert an Nx Executor into an Angular Devkit Builder
 *
 * Use this to expose a compatible Angular Builder
 */
export declare function convertNxExecutor(executor: Executor): any;
