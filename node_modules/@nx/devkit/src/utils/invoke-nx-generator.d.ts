import { Generator } from 'nx/src/devkit-exports';
/**
 * Convert an Nx Generator into an Angular Devkit Schematic.
 * @param generator The Nx generator to convert to an Angular Devkit Schematic.
 */
export declare function convertNxGenerator<T = any>(generator: Generator<T>, skipWritingConfigInOldFormat?: boolean): (generatorOptions: T) => (tree: any, context: any) => Promise<any>;
