/**
 * Returns an array of distinct values. Order is not guaranteed.
 * @param values - The values to filter. Should be JSON-serializable.
 * @return - An array of distinct values.
 */
export declare function distinctValues<T>(values: T[]): T[];
/**
 * Returns a stringified version of the object with keys sorted. This is required to
 * ensure that the stringified version of an object is deterministic independent of the
 * order of keys.
 * @param obj
 * @return {string}
 */
export declare function deterministicJSONStringify(obj: unknown): string;
