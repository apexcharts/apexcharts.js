import type { InputDefinition } from 'nx/src/config/workspace-json-project-json';
import { CreateNodesContext, CreateNodesContextV2 } from 'nx/src/devkit-exports';
/**
 * Get the named inputs available for a directory
 */
export declare function getNamedInputs(directory: string, context: CreateNodesContext | CreateNodesContextV2): {
    [inputName: string]: (string | InputDefinition)[];
};
