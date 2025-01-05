import type { Program } from 'typescript';
import type { Lib } from './lib';
type DebugLevel = boolean | ('eslint' | 'typescript' | 'typescript-eslint')[];
type CacheDurationSeconds = number | 'Infinity';
type EcmaVersion = 'latest' | 3 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 2015 | 2016 | 2017 | 2018 | 2019 | 2020 | 2021 | 2022 | 2023 | 2024 | 2025 | undefined;
type SourceTypeClassic = 'module' | 'script';
type SourceType = 'commonjs' | SourceTypeClassic;
type JSDocParsingMode = 'all' | 'none' | 'type-info';
/**
 * Granular options to configure the project service.
 */
interface ProjectServiceOptions {
    /**
     * Globs of files to allow running with the default project compiler options
     * despite not being matched by the project service.
     */
    allowDefaultProject?: string[];
    /**
     * Path to a TSConfig to use instead of TypeScript's default project configuration.
     * @default 'tsconfig.json'
     */
    defaultProject?: string;
    /**
     * Whether to allow TypeScript plugins as configured in the TSConfig.
     */
    loadTypeScriptPlugins?: boolean;
    /**
     * The maximum number of files {@link allowDefaultProject} may match.
     * Each file match slows down linting, so if you do need to use this, please
     * file an informative issue on typescript-eslint explaining why - so we can
     * help you avoid using it!
     * @default 8
     */
    maximumDefaultProjectFileMatchCount_THIS_WILL_SLOW_DOWN_LINTING?: number;
}
interface ParserOptions {
    [additionalProperties: string]: unknown;
    cacheLifetime?: {
        glob?: CacheDurationSeconds;
    };
    debugLevel?: DebugLevel;
    ecmaFeatures?: {
        [key: string]: unknown;
        globalReturn?: boolean | undefined;
        jsx?: boolean | undefined;
    } | undefined;
    ecmaVersion?: EcmaVersion;
    emitDecoratorMetadata?: boolean;
    errorOnTypeScriptSyntacticAndSemanticIssues?: boolean;
    errorOnUnknownASTType?: boolean;
    experimentalDecorators?: boolean;
    extraFileExtensions?: string[];
    filePath?: string;
    jsDocParsingMode?: JSDocParsingMode;
    jsxFragmentName?: string | null;
    jsxPragma?: string | null;
    lib?: Lib[];
    programs?: Program[] | null;
    project?: boolean | string | string[] | null;
    projectFolderIgnoreList?: string[];
    projectService?: boolean | ProjectServiceOptions;
    range?: boolean;
    sourceType?: SourceType | undefined;
    tokens?: boolean;
    tsconfigRootDir?: string;
    warnOnUnsupportedTypeScriptVersion?: boolean;
}
export type { CacheDurationSeconds, DebugLevel, EcmaVersion, JSDocParsingMode, ParserOptions, ProjectServiceOptions, SourceType, };
//# sourceMappingURL=parser-options.d.ts.map