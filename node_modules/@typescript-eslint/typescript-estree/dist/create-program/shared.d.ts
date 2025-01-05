import type { Program } from 'typescript';
import * as ts from 'typescript';
import type { ParseSettings } from '../parseSettings';
interface ASTAndNoProgram {
    ast: ts.SourceFile;
    program: null;
}
interface ASTAndDefiniteProgram {
    ast: ts.SourceFile;
    program: ts.Program;
}
type ASTAndProgram = ASTAndDefiniteProgram | ASTAndNoProgram;
/**
 * Compiler options required to avoid critical functionality issues
 */
declare const CORE_COMPILER_OPTIONS: ts.CompilerOptions;
declare const DEFAULT_EXTRA_FILE_EXTENSIONS: Set<string>;
declare function createDefaultCompilerOptionsFromExtra(parseSettings: ParseSettings): ts.CompilerOptions;
type CanonicalPath = {
    __brand: unknown;
} & string;
declare function getCanonicalFileName(filePath: string): CanonicalPath;
declare function ensureAbsolutePath(p: string, tsconfigRootDir: string): string;
declare function canonicalDirname(p: CanonicalPath): CanonicalPath;
declare function getAstFromProgram(currentProgram: Program, filePath: string): ASTAndDefiniteProgram | undefined;
/**
 * Hash content for compare content.
 * @param content hashed contend
 * @returns hashed result
 */
declare function createHash(content: string): string;
export { type ASTAndDefiniteProgram, type ASTAndNoProgram, type ASTAndProgram, canonicalDirname, type CanonicalPath, CORE_COMPILER_OPTIONS, createDefaultCompilerOptionsFromExtra, createHash, DEFAULT_EXTRA_FILE_EXTENSIONS, ensureAbsolutePath, getAstFromProgram, getCanonicalFileName, };
//# sourceMappingURL=shared.d.ts.map