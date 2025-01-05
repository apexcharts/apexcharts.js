import type { NxJsonConfiguration } from '../../config/nx-json';
import type { Tree } from '../tree';
/**
 * @deprecated You must pass a {@link Tree}. This will be removed in Nx 21.
 */
export declare function readNxJson(): NxJsonConfiguration | null;
export declare function readNxJson(tree: Tree): NxJsonConfiguration | null;
/**
 * Update nx.json
 */
export declare function updateNxJson(tree: Tree, nxJson: NxJsonConfiguration): void;
