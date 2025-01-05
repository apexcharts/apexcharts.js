"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("@typescript-eslint/utils");
const tsutils = __importStar(require("ts-api-utils"));
const ts = __importStar(require("typescript"));
const util_1 = require("../util");
exports.default = (0, util_1.createRule)({
    name: 'prefer-nullish-coalescing',
    meta: {
        type: 'suggestion',
        docs: {
            description: 'Enforce using the nullish coalescing operator instead of logical assignments or chaining',
            recommended: 'stylistic',
            requiresTypeChecking: true,
        },
        hasSuggestions: true,
        messages: {
            noStrictNullCheck: 'This rule requires the `strictNullChecks` compiler option to be turned on to function correctly.',
            preferNullishOverOr: 'Prefer using nullish coalescing operator (`??{{ equals }}`) instead of a logical {{ description }} (`||{{ equals }}`), as it is a safer operator.',
            preferNullishOverTernary: 'Prefer using nullish coalescing operator (`??{{ equals }}`) instead of a ternary expression, as it is simpler to read.',
            suggestNullish: 'Fix to nullish coalescing operator (`??{{ equals }}`).',
        },
        schema: [
            {
                type: 'object',
                additionalProperties: false,
                properties: {
                    allowRuleToRunWithoutStrictNullChecksIKnowWhatIAmDoing: {
                        type: 'boolean',
                        description: 'Unless this is set to `true`, the rule will error on every file whose `tsconfig.json` does _not_ have the `strictNullChecks` compiler option (or `strict`) set to `true`.',
                    },
                    ignoreBooleanCoercion: {
                        type: 'boolean',
                        description: 'Whether to ignore arguments to the `Boolean` constructor',
                    },
                    ignoreConditionalTests: {
                        type: 'boolean',
                        description: 'Whether to ignore cases that are located within a conditional test.',
                    },
                    ignoreMixedLogicalExpressions: {
                        type: 'boolean',
                        description: 'Whether to ignore any logical or expressions that are part of a mixed logical expression (with `&&`).',
                    },
                    ignorePrimitives: {
                        description: 'Whether to ignore all (`true`) or some (an object with properties) primitive types.',
                        oneOf: [
                            {
                                type: 'object',
                                description: 'Which primitives types may be ignored.',
                                properties: {
                                    bigint: {
                                        type: 'boolean',
                                        description: 'Ignore bigint primitive types.',
                                    },
                                    boolean: {
                                        type: 'boolean',
                                        description: 'Ignore boolean primitive types.',
                                    },
                                    number: {
                                        type: 'boolean',
                                        description: 'Ignore number primitive types.',
                                    },
                                    string: {
                                        type: 'boolean',
                                        description: 'Ignore string primitive types.',
                                    },
                                },
                            },
                            {
                                type: 'boolean',
                                description: 'Ignore all primitive types.',
                                enum: [true],
                            },
                        ],
                    },
                    ignoreTernaryTests: {
                        type: 'boolean',
                        description: 'Whether to ignore any ternary expressions that could be simplified by using the nullish coalescing operator.',
                    },
                },
            },
        ],
    },
    defaultOptions: [
        {
            allowRuleToRunWithoutStrictNullChecksIKnowWhatIAmDoing: false,
            ignoreBooleanCoercion: false,
            ignoreConditionalTests: true,
            ignoreMixedLogicalExpressions: false,
            ignorePrimitives: {
                bigint: false,
                boolean: false,
                number: false,
                string: false,
            },
            ignoreTernaryTests: false,
        },
    ],
    create(context, [{ allowRuleToRunWithoutStrictNullChecksIKnowWhatIAmDoing, ignoreBooleanCoercion, ignoreConditionalTests, ignoreMixedLogicalExpressions, ignorePrimitives, ignoreTernaryTests, },]) {
        const parserServices = (0, util_1.getParserServices)(context);
        const compilerOptions = parserServices.program.getCompilerOptions();
        const checker = parserServices.program.getTypeChecker();
        const isStrictNullChecks = tsutils.isStrictCompilerOptionEnabled(compilerOptions, 'strictNullChecks');
        if (!isStrictNullChecks &&
            allowRuleToRunWithoutStrictNullChecksIKnowWhatIAmDoing !== true) {
            context.report({
                loc: {
                    start: { column: 0, line: 0 },
                    end: { column: 0, line: 0 },
                },
                messageId: 'noStrictNullCheck',
            });
        }
        // todo: rename to something more specific?
        function checkAssignmentOrLogicalExpression(node, description, equals) {
            const tsNode = parserServices.esTreeNodeToTSNodeMap.get(node);
            const type = checker.getTypeAtLocation(tsNode.left);
            if (!(0, util_1.isTypeFlagSet)(type, ts.TypeFlags.Null | ts.TypeFlags.Undefined)) {
                return;
            }
            if (ignoreConditionalTests === true && isConditionalTest(node)) {
                return;
            }
            if (ignoreMixedLogicalExpressions === true &&
                isMixedLogicalExpression(node)) {
                return;
            }
            // https://github.com/typescript-eslint/typescript-eslint/issues/5439
            /* eslint-disable @typescript-eslint/no-non-null-assertion */
            const ignorableFlags = [
                (ignorePrimitives === true || ignorePrimitives.bigint) &&
                    ts.TypeFlags.BigIntLike,
                (ignorePrimitives === true || ignorePrimitives.boolean) &&
                    ts.TypeFlags.BooleanLike,
                (ignorePrimitives === true || ignorePrimitives.number) &&
                    ts.TypeFlags.NumberLike,
                (ignorePrimitives === true || ignorePrimitives.string) &&
                    ts.TypeFlags.StringLike,
            ]
                .filter((flag) => typeof flag === 'number')
                .reduce((previous, flag) => previous | flag, 0);
            if (type.flags !== ts.TypeFlags.Null &&
                type.flags !== ts.TypeFlags.Undefined &&
                type.types.some(t => tsutils
                    .intersectionTypeParts(t)
                    .some(t => tsutils.isTypeFlagSet(t, ignorableFlags)))) {
                return;
            }
            /* eslint-enable @typescript-eslint/no-non-null-assertion */
            const barBarOperator = (0, util_1.nullThrows)(context.sourceCode.getTokenAfter(node.left, token => token.type === utils_1.AST_TOKEN_TYPES.Punctuator &&
                token.value === node.operator), util_1.NullThrowsReasons.MissingToken('operator', node.type));
            function* fix(fixer) {
                if ((0, util_1.isLogicalOrOperator)(node.parent)) {
                    // '&&' and '??' operations cannot be mixed without parentheses (e.g. a && b ?? c)
                    if (node.left.type === utils_1.AST_NODE_TYPES.LogicalExpression &&
                        !(0, util_1.isLogicalOrOperator)(node.left.left)) {
                        yield fixer.insertTextBefore(node.left.right, '(');
                    }
                    else {
                        yield fixer.insertTextBefore(node.left, '(');
                    }
                    yield fixer.insertTextAfter(node.right, ')');
                }
                yield fixer.replaceText(barBarOperator, node.operator.replace('||', '??'));
            }
            context.report({
                node: barBarOperator,
                messageId: 'preferNullishOverOr',
                data: { description, equals },
                suggest: [
                    {
                        messageId: 'suggestNullish',
                        data: { equals },
                        fix,
                    },
                ],
            });
        }
        return {
            'AssignmentExpression[operator = "||="]'(node) {
                checkAssignmentOrLogicalExpression(node, 'assignment', '=');
            },
            ConditionalExpression(node) {
                if (ignoreTernaryTests) {
                    return;
                }
                let operator;
                let nodesInsideTestExpression = [];
                if (node.test.type === utils_1.AST_NODE_TYPES.BinaryExpression) {
                    nodesInsideTestExpression = [node.test.left, node.test.right];
                    if (node.test.operator === '==' ||
                        node.test.operator === '!=' ||
                        node.test.operator === '===' ||
                        node.test.operator === '!==') {
                        operator = node.test.operator;
                    }
                }
                else if (node.test.type === utils_1.AST_NODE_TYPES.LogicalExpression &&
                    node.test.left.type === utils_1.AST_NODE_TYPES.BinaryExpression &&
                    node.test.right.type === utils_1.AST_NODE_TYPES.BinaryExpression) {
                    nodesInsideTestExpression = [
                        node.test.left.left,
                        node.test.left.right,
                        node.test.right.left,
                        node.test.right.right,
                    ];
                    if (['||', '||='].includes(node.test.operator)) {
                        if (node.test.left.operator === '===' &&
                            node.test.right.operator === '===') {
                            operator = '===';
                        }
                        else if (((node.test.left.operator === '===' ||
                            node.test.right.operator === '===') &&
                            (node.test.left.operator === '==' ||
                                node.test.right.operator === '==')) ||
                            (node.test.left.operator === '==' &&
                                node.test.right.operator === '==')) {
                            operator = '==';
                        }
                    }
                    else if (node.test.operator === '&&') {
                        if (node.test.left.operator === '!==' &&
                            node.test.right.operator === '!==') {
                            operator = '!==';
                        }
                        else if (((node.test.left.operator === '!==' ||
                            node.test.right.operator === '!==') &&
                            (node.test.left.operator === '!=' ||
                                node.test.right.operator === '!=')) ||
                            (node.test.left.operator === '!=' &&
                                node.test.right.operator === '!=')) {
                            operator = '!=';
                        }
                    }
                }
                if (!operator) {
                    return;
                }
                let identifier;
                let hasUndefinedCheck = false;
                let hasNullCheck = false;
                // we check that the test only contains null, undefined and the identifier
                for (const testNode of nodesInsideTestExpression) {
                    if ((0, util_1.isNullLiteral)(testNode)) {
                        hasNullCheck = true;
                    }
                    else if ((0, util_1.isUndefinedIdentifier)(testNode)) {
                        hasUndefinedCheck = true;
                    }
                    else if ((operator === '!==' || operator === '!=') &&
                        (0, util_1.isNodeEqual)(testNode, node.consequent)) {
                        identifier = testNode;
                    }
                    else if ((operator === '===' || operator === '==') &&
                        (0, util_1.isNodeEqual)(testNode, node.alternate)) {
                        identifier = testNode;
                    }
                    else {
                        return;
                    }
                }
                if (!identifier) {
                    return;
                }
                const isFixable = (() => {
                    // it is fixable if we check for both null and undefined, or not if neither
                    if (hasUndefinedCheck === hasNullCheck) {
                        return hasUndefinedCheck;
                    }
                    // it is fixable if we loosely check for either null or undefined
                    if (operator === '==' || operator === '!=') {
                        return true;
                    }
                    const tsNode = parserServices.esTreeNodeToTSNodeMap.get(identifier);
                    const type = checker.getTypeAtLocation(tsNode);
                    const flags = (0, util_1.getTypeFlags)(type);
                    if (flags & (ts.TypeFlags.Any | ts.TypeFlags.Unknown)) {
                        return false;
                    }
                    const hasNullType = (flags & ts.TypeFlags.Null) !== 0;
                    // it is fixable if we check for undefined and the type is not nullable
                    if (hasUndefinedCheck && !hasNullType) {
                        return true;
                    }
                    const hasUndefinedType = (flags & ts.TypeFlags.Undefined) !== 0;
                    // it is fixable if we check for null and the type can't be undefined
                    return hasNullCheck && !hasUndefinedType;
                })();
                if (isFixable) {
                    context.report({
                        node,
                        messageId: 'preferNullishOverTernary',
                        // TODO: also account for = in the ternary clause
                        data: { equals: '' },
                        suggest: [
                            {
                                messageId: 'suggestNullish',
                                data: { equals: '' },
                                fix(fixer) {
                                    const [left, right] = operator === '===' || operator === '=='
                                        ? [node.alternate, node.consequent]
                                        : [node.consequent, node.alternate];
                                    return fixer.replaceText(node, `${(0, util_1.getTextWithParentheses)(context.sourceCode, left)} ?? ${(0, util_1.getTextWithParentheses)(context.sourceCode, right)}`);
                                },
                            },
                        ],
                    });
                }
            },
            'LogicalExpression[operator = "||"]'(node) {
                if (ignoreBooleanCoercion === true &&
                    isBooleanConstructorContext(node, context)) {
                    return;
                }
                checkAssignmentOrLogicalExpression(node, 'or', '');
            },
        };
    },
});
function isConditionalTest(node) {
    const parent = node.parent;
    if (parent == null) {
        return false;
    }
    if (parent.type === utils_1.AST_NODE_TYPES.LogicalExpression) {
        return isConditionalTest(parent);
    }
    if (parent.type === utils_1.AST_NODE_TYPES.ConditionalExpression &&
        (parent.consequent === node || parent.alternate === node)) {
        return isConditionalTest(parent);
    }
    if (parent.type === utils_1.AST_NODE_TYPES.SequenceExpression &&
        parent.expressions.at(-1) === node) {
        return isConditionalTest(parent);
    }
    if (parent.type === utils_1.AST_NODE_TYPES.UnaryExpression &&
        parent.operator === '!') {
        return isConditionalTest(parent);
    }
    if ((parent.type === utils_1.AST_NODE_TYPES.ConditionalExpression ||
        parent.type === utils_1.AST_NODE_TYPES.DoWhileStatement ||
        parent.type === utils_1.AST_NODE_TYPES.IfStatement ||
        parent.type === utils_1.AST_NODE_TYPES.ForStatement ||
        parent.type === utils_1.AST_NODE_TYPES.WhileStatement) &&
        parent.test === node) {
        return true;
    }
    return false;
}
function isBooleanConstructorContext(node, context) {
    const parent = node.parent;
    if (parent == null) {
        return false;
    }
    if (parent.type === utils_1.AST_NODE_TYPES.LogicalExpression) {
        return isBooleanConstructorContext(parent, context);
    }
    if (parent.type === utils_1.AST_NODE_TYPES.ConditionalExpression &&
        (parent.consequent === node || parent.alternate === node)) {
        return isBooleanConstructorContext(parent, context);
    }
    if (parent.type === utils_1.AST_NODE_TYPES.SequenceExpression &&
        parent.expressions.at(-1) === node) {
        return isBooleanConstructorContext(parent, context);
    }
    return isBuiltInBooleanCall(parent, context);
}
function isBuiltInBooleanCall(node, context) {
    if (node.type === utils_1.AST_NODE_TYPES.CallExpression &&
        node.callee.type === utils_1.AST_NODE_TYPES.Identifier &&
        // eslint-disable-next-line @typescript-eslint/internal/prefer-ast-types-enum
        node.callee.name === 'Boolean' &&
        node.arguments[0]) {
        const scope = context.sourceCode.getScope(node);
        const variable = scope.set.get(utils_1.AST_TOKEN_TYPES.Boolean);
        return variable == null || variable.defs.length === 0;
    }
    return false;
}
function isMixedLogicalExpression(node) {
    const seen = new Set();
    const queue = [node.parent, node.left, node.right];
    for (const current of queue) {
        if (seen.has(current)) {
            continue;
        }
        seen.add(current);
        if (current.type === utils_1.AST_NODE_TYPES.LogicalExpression) {
            if (current.operator === '&&') {
                return true;
            }
            if (['||', '||='].includes(current.operator)) {
                // check the pieces of the node to catch cases like `a || b || c && d`
                queue.push(current.parent, current.left, current.right);
            }
        }
    }
    return false;
}
//# sourceMappingURL=prefer-nullish-coalescing.js.map