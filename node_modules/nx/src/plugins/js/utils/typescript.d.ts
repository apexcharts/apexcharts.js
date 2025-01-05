import type * as ts from 'typescript';
import type { Node, SyntaxKind } from 'typescript';
export declare function readTsConfig(tsConfigPath: string): ts.ParsedCommandLine;
/**
 * Find a module based on its import
 *
 * @param importExpr Import used to resolve to a module
 * @param filePath
 * @param tsConfigPath
 */
export declare function resolveModuleByImport(importExpr: string, filePath: string, tsConfigPath: string): string;
export declare function getRootTsConfigFileName(): string | null;
export declare function getRootTsConfigPath(): string | null;
export declare function findNodes(node: Node, kind: SyntaxKind | SyntaxKind[], max?: number): Node[];
