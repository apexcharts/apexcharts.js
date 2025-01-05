import { CreateNodes, Tree } from 'nx/src/devkit-exports';
export declare function replaceProjectConfigurationsWithPlugin<T = unknown>(tree: Tree, rootMappings: Map<string, string>, pluginPath: string, createNodes: CreateNodes<T>, pluginOptions: T): Promise<void>;
