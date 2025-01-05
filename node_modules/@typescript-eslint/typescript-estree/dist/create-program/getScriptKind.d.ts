import * as ts from 'typescript';
declare function getScriptKind(filePath: string, jsx: boolean): ts.ScriptKind;
declare function getLanguageVariant(scriptKind: ts.ScriptKind): ts.LanguageVariant;
export { getLanguageVariant, getScriptKind };
//# sourceMappingURL=getScriptKind.d.ts.map