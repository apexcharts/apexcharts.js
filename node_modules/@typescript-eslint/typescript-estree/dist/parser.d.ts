import type * as ts from 'typescript';
import type { ParserServices, TSESTreeOptions } from './parser-options';
import type { TSESTree } from './ts-estree';
declare function clearProgramCache(): void;
declare function clearDefaultProjectMatchedFiles(): void;
type AST<T extends TSESTreeOptions> = (T['comment'] extends true ? {
    comments: TSESTree.Comment[];
} : {}) & (T['tokens'] extends true ? {
    tokens: TSESTree.Token[];
} : {}) & TSESTree.Program;
interface ParseAndGenerateServicesResult<T extends TSESTreeOptions> {
    ast: AST<T>;
    services: ParserServices;
}
declare function parse<T extends TSESTreeOptions = TSESTreeOptions>(code: string, options?: T): AST<T>;
declare function clearParseAndGenerateServicesCalls(): void;
declare function parseAndGenerateServices<T extends TSESTreeOptions = TSESTreeOptions>(code: string | ts.SourceFile, tsestreeOptions: T): ParseAndGenerateServicesResult<T>;
export { type AST, clearDefaultProjectMatchedFiles, clearParseAndGenerateServicesCalls, clearProgramCache, parse, parseAndGenerateServices, type ParseAndGenerateServicesResult, };
//# sourceMappingURL=parser.d.ts.map