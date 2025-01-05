import { logging, Path, PathFragment, virtualFs } from '@angular-devkit/core';
import { FileBuffer } from '@angular-devkit/core/src/virtual-fs/host/interface';
import { Observable } from 'rxjs';
import type { GenerateOptions } from '../command-line/generate/generate';
import { ProjectConfiguration } from '../config/workspace-json-project-json';
import { Tree } from '../generators/tree';
import { ExecutorContext, GeneratorCallback } from '../config/misc-interfaces';
export declare function createBuilderContext(builderInfo: {
    builderName: string;
    description: string;
    optionSchema: any;
}, context: ExecutorContext): Promise<import("@angular-devkit/architect").BuilderContext>;
export declare function scheduleTarget(root: string, opts: {
    project: string;
    target: string;
    configuration: string;
    runOptions: any;
    projects: Record<string, ProjectConfiguration>;
}, verbose: boolean): Promise<Observable<import('@angular-devkit/architect').BuilderOutput>>;
type AngularProjectConfiguration = ProjectConfiguration & {
    prefix?: string;
};
export declare class NxScopedHost extends virtualFs.ScopedHost<any> {
    private root;
    constructor(root: string);
    read(path: Path): Observable<FileBuffer>;
    protected readMergedWorkspaceConfiguration(): Observable<any>;
    write(path: Path, content: FileBuffer): Observable<void>;
    isFile(path: Path): Observable<boolean>;
    exists(path: Path): Observable<boolean>;
    mergeProjectConfiguration(existing: AngularProjectConfiguration, updated: AngularProjectConfiguration, projectName: string): AngularProjectConfiguration;
    readExistingAngularJson(): Observable<any>;
    protected readJson<T = any>(path: string): Observable<T>;
}
/**
 * Host used by Angular CLI builders. It reads the project configurations from
 * the project graph to access the expanded targets.
 */
export declare class NxScopedHostForBuilders extends NxScopedHost {
    protected readMergedWorkspaceConfiguration(): Observable<any>;
}
export declare function arrayBufferToString(buffer: any): string;
/**
 * Host used by Angular CLI schematics. It reads the project configurations from
 * the project configuration files.
 */
export declare class NxScopeHostUsedForWrappedSchematics extends NxScopedHost {
    private readonly host;
    constructor(root: string, host: Tree);
    read(path: Path): Observable<FileBuffer>;
    exists(path: Path): Observable<boolean>;
    isDirectory(path: Path): Observable<boolean>;
    isFile(path: Path): Observable<boolean>;
    list(path: Path): Observable<PathFragment[]>;
}
export declare function generate(root: string, opts: GenerateOptions, projects: Record<string, ProjectConfiguration>, verbose: boolean): Promise<number>;
export declare function runMigration(root: string, packageName: string, migrationName: string, projects: Record<string, ProjectConfiguration>, isVerbose: boolean): Promise<{
    loggingQueue: string[];
    madeChanges: boolean;
}>;
/**
 * If you have an Nx Devkit generator invoking the wrapped Angular Devkit schematic,
 * and you don't want the Angular Devkit schematic to run, you can mock it up using this function.
 *
 * Unfortunately, there are some edge cases in the Nx-Angular devkit integration that
 * can be seen in the unit tests context. This function is useful for handling that as well.
 *
 * In this case, you can mock it up.
 *
 * Example:
 *
 * ```typescript
 *   mockSchematicsForTesting({
 *     'mycollection:myschematic': (tree, params) => {
 *        tree.write("README.md");
 *     }
 *   });
 *
 * ```
 */
export declare function mockSchematicsForTesting(schematics: {
    [name: string]: (host: Tree, generatorOptions: {
        [k: string]: any;
    }) => Promise<void>;
}): void;
export declare function wrapAngularDevkitSchematic(collectionName: string, generatorName: string): (host: Tree, generatorOptions: {
    [k: string]: any;
}) => Promise<GeneratorCallback>;
export declare const getLogger: (isVerbose?: boolean) => logging.Logger;
export {};
