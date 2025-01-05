import { FileData } from '../config/project-graph';
import { ProjectsConfigurations } from '../config/workspace-json-project-json';
import type { NxArgs } from '../utils/command-line-utils';
export interface Change {
    type: string;
}
export interface FileChange<T extends Change = Change> extends FileData {
    getChanges: () => T[];
}
export declare class WholeFileChange implements Change {
    type: string;
}
export declare class DeletedFileChange implements Change {
    type: string;
}
export declare function isWholeFileChange(change: Change): change is WholeFileChange;
export declare function isDeletedFileChange(change: Change): change is DeletedFileChange;
export declare function calculateFileChanges(files: string[], allWorkspaceFiles: FileData[], nxArgs?: NxArgs, readFileAtRevision?: (f: string, r: void | string) => string, ignore?: ReturnType<typeof ignore>): FileChange[];
export declare const TEN_MEGABYTES: number;
/**
 * TODO(v21): Remove this function
 * @deprecated To get projects use {@link retrieveProjectConfigurations} instead. This will be removed in v21.
 */
export declare function readWorkspaceConfig(opts: {
    format: 'angularCli' | 'nx';
    path?: string;
}): ProjectsConfigurations;
export declare function defaultFileRead(filePath: string): string | null;
export declare function readPackageJson(root?: string): any;
export { FileData };
