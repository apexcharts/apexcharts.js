import { type Tree, type PluginConfiguration } from 'nx/src/devkit-exports';
export declare function findPluginForConfigFile(tree: Tree, pluginName: string, pathToConfigFile: string): Promise<PluginConfiguration>;
