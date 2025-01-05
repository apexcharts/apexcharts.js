import { ExecutorContext, ProjectGraph, Target } from 'nx/src/devkit-exports';
/**
 * Parses a target string into {project, target, configuration}
 *
 * Examples:
 * ```typescript
 * parseTargetString("proj:test", graph) // returns { project: "proj", target: "test" }
 * parseTargetString("proj:test:production", graph) // returns { project: "proj", target: "test", configuration: "production" }
 * ```
 *
 * @param targetString - target reference
 */
export declare function parseTargetString(targetString: string, projectGraph: ProjectGraph): Target;
/**
 * Parses a target string into {project, target, configuration}. Passing a full
 * {@link ExecutorContext} enables the targetString to reference the current project.
 *
 * Examples:
 * ```typescript
 * parseTargetString("test", executorContext) // returns { project: "proj", target: "test" }
 * parseTargetString("proj:test", executorContext) // returns { project: "proj", target: "test" }
 * parseTargetString("proj:test:production", executorContext) // returns { project: "proj", target: "test", configuration: "production" }
 * ```
 */
export declare function parseTargetString(targetString: string, ctx: ExecutorContext): Target;
/**
 * Returns a string in the format "project:target[:configuration]" for the target
 *
 * @param target - target object
 *
 * Examples:
 *
 * ```typescript
 * targetToTargetString({ project: "proj", target: "test" }) // returns "proj:test"
 * targetToTargetString({ project: "proj", target: "test", configuration: "production" }) // returns "proj:test:production"
 * ```
 */
export declare function targetToTargetString({ project, target, configuration, }: Target): string;
