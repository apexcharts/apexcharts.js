import type { TSESTree } from '@typescript-eslint/types';
import { DefinitionBase } from './DefinitionBase';
import { DefinitionType } from './DefinitionType';
declare class TSModuleNameDefinition extends DefinitionBase<DefinitionType.TSModuleName, TSESTree.TSModuleDeclaration, null, TSESTree.Identifier> {
    readonly isTypeDefinition = true;
    readonly isVariableDefinition = true;
    constructor(name: TSESTree.Identifier, node: TSModuleNameDefinition['node']);
}
export { TSModuleNameDefinition };
//# sourceMappingURL=TSModuleNameDefinition.d.ts.map