import { PriorityName } from '../constants';
import type { Options, OptionsInput } from '../type';
export declare function buildOptions(options?: OptionsInput): Options;
export declare function togglePriority(priority: `${PriorityName}`): "left" | "right";
