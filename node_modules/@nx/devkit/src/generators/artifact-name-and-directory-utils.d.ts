import { type Tree } from 'nx/src/devkit-exports';
export type ArtifactGenerationOptions = {
    path: string;
    name?: string;
    fileExtension?: string;
    suffix?: string;
    allowedFileExtensions?: string[];
    /**
     * @deprecated Provide the full file path including the file extension in the `path` option. This option will be removed in Nx v21.
     */
    js?: boolean;
    /**
     * @deprecated Provide the full file path including the file extension in the `path` option. This option will be removed in Nx v21.
     */
    jsOptionName?: string;
};
export type FileExtensionType = 'js' | 'ts' | 'other';
export type NameAndDirectoryOptions = {
    /**
     * Normalized artifact name.
     */
    artifactName: string;
    /**
     * Normalized directory path where the artifact will be generated.
     */
    directory: string;
    /**
     * Normalized file name of the artifact without the extension.
     */
    fileName: string;
    /**
     * Normalized file extension.
     */
    fileExtension: string;
    /**
     * Normalized file extension type.
     */
    fileExtensionType: FileExtensionType;
    /**
     * Normalized full file path of the artifact.
     */
    filePath: string;
    /**
     * Project name where the artifact will be generated.
     */
    project: string;
};
export declare function determineArtifactNameAndDirectoryOptions(tree: Tree, options: ArtifactGenerationOptions): Promise<NameAndDirectoryOptions>;
export declare function getRelativeCwd(): string;
/**
 * Function for setting cwd during testing
 */
export declare function setCwd(path: string): void;
