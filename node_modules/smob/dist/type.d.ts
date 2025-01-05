import type { PriorityName } from './constants';
type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends ((k: infer I) => void) ? I : never;
export type Options = {
    /**
     * Merge object array properties.
     *
     * default: true
     */
    array: boolean;
    /**
     * Remove duplicates, when merging array elements.
     *
     * default: false
     */
    arrayDistinct: boolean;
    /**
     * Merge sources from left-to-right or right-to-left.
     * From v2 upwards default to left independent of the option priority.
     *
     * default: left (aka. options.priority)
     */
    arrayPriority: `${PriorityName}`;
    /**
     * Strategy to merge different object keys.
     *
     * @param target
     * @param key
     * @param value
     */
    strategy?: (target: Record<string, any>, key: string, value: unknown) => Record<string, any> | undefined;
    /**
     * Merge sources in place.
     *
     * default: false
     */
    inPlace?: boolean;
    /**
     * Deep clone input sources.
     *
     * default: false
     */
    clone?: boolean;
    /**
     * Merge sources from left-to-right or right-to-left.
     * From v2 upwards default to right.
     *
     * default: left
     */
    priority: `${PriorityName}`;
};
export type OptionsInput = Partial<Options>;
export type MergerSource = any[] | Record<string, any>;
export type MergerSourceUnwrap<T extends MergerSource> = T extends Array<infer Return> ? Return : T;
export type MergerResult<B extends MergerSource> = UnionToIntersection<MergerSourceUnwrap<B>>;
export type MergerContext = {
    options: Options;
    map: WeakMap<any, any>;
};
export type Merger = <B extends MergerSource[]>(...sources: B) => MergerResult<B>;
export {};
