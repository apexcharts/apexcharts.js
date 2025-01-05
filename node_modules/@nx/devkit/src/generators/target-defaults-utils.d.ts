import { type Tree } from 'nx/src/devkit-exports';
export declare function addBuildTargetDefaults(tree: Tree, executorName: string, buildTargetName?: string): void;
export declare function addE2eCiTargetDefaults(tree: Tree, e2ePlugin: string, buildTarget: string, pathToE2EConfigFile: string): Promise<void>;
