import { ProjectGraph, Tree } from 'nx/src/devkit-exports';
type CallBack<T> = (currentValue: T, project: string, target: string, configuration?: string) => void;
/**
 * Calls a function for each different options that an executor is configured with
 */
export declare function forEachExecutorOptions<Options>(tree: Tree, 
/**
 * Name of the executor to update options for
 */
executorName: string, 
/**
 * Callback that is called for each options configured for a builder
 */
callback: CallBack<Options>): void;
/**
 * Calls a function for each different options that an executor is configured with via the project graph
 * this is helpful when you need to get the expaned configuration options from the nx.json
 **/
export declare function forEachExecutorOptionsInGraph<Options>(graph: ProjectGraph, executorName: string, callback: CallBack<Options>): void;
export {};
