import type { ExecutorContext, Target } from 'nx/src/devkit-exports';
/**
 * Reads and combines options for a given target.
 *
 * Works as if you invoked the target yourself without passing any command lint overrides.
 */
export declare function readTargetOptions<T = any>({ project, target, configuration }: Target, context: ExecutorContext): T;
