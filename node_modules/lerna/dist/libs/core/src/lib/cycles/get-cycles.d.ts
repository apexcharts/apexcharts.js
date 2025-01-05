/**
 * Get all cycles within the given dependencies.
 * @param dependencies project dependencies grouped by source
 * @returns a list of cycles, where each cycle is a list of project names
 */
export declare function getCycles(dependencies: Record<string, Set<string>>): string[][];
