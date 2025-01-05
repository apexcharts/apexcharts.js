import type { Tree } from 'nx/src/devkit-exports';
import type { ModuleKind, ScriptTarget } from 'typescript';
export type ToJSOptions = {
    extension?: '.js' | '.mjs' | '.cjs';
    module?: ModuleKind;
    target?: ScriptTarget;
    useJsx?: boolean;
};
/**
 * Rename and transpile any new typescript files created to javascript files
 */
export declare function toJS(tree: Tree, options?: ToJSOptions): void;
