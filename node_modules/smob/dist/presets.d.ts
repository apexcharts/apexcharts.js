import type { MergerResult } from './type';
/**
 * Assign source attributes to a target object.
 *
 * @param target
 * @param sources
 */
export declare function assign<A extends Record<string, any>, B extends Record<string, any>[]>(target: A, ...sources: B): A & MergerResult<B>;
