"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stringifyShell = void 0;
exports.parseShell = parseShell;
exports.stringifyShellLine = stringifyShellLine;
exports.stringifyShell = stringifyShellLine;
exports.stringifyCommandLine = stringifyCommandLine;
exports.stringifyCommandLineThen = stringifyCommandLineThen;
exports.stringifyCommandChain = stringifyCommandChain;
exports.stringifyCommandChainThen = stringifyCommandChainThen;
exports.stringifyCommand = stringifyCommand;
exports.stringifyEnvSegment = stringifyEnvSegment;
exports.stringifyArgument = stringifyArgument;
exports.stringifyRedirectArgument = stringifyRedirectArgument;
exports.stringifyValueArgument = stringifyValueArgument;
exports.stringifyArgumentSegment = stringifyArgumentSegment;
exports.stringifyArithmeticExpression = stringifyArithmeticExpression;
const shell_1 = require("./grammars/shell");
function parseShell(source, options = { isGlobPattern: () => false }) {
    try {
        return (0, shell_1.parse)(source, options);
    }
    catch (error) {
        if (error.location)
            error.message = error.message.replace(/(\.)?$/, ` (line ${error.location.start.line}, column ${error.location.start.column})$1`);
        throw error;
    }
}
function stringifyShellLine(shellLine, { endSemicolon = false } = {}) {
    return shellLine
        .map(({ command, type }, index) => `${stringifyCommandLine(command)}${type === `;`
        ? (index !== shellLine.length - 1 || endSemicolon ? `;` : ``)
        : ` &`}`)
        .join(` `);
}
function stringifyCommandLine(commandLine) {
    return `${stringifyCommandChain(commandLine.chain)}${commandLine.then ? ` ${stringifyCommandLineThen(commandLine.then)}` : ``}`;
}
function stringifyCommandLineThen(commandLineThen) {
    return `${commandLineThen.type} ${stringifyCommandLine(commandLineThen.line)}`;
}
function stringifyCommandChain(commandChain) {
    return `${stringifyCommand(commandChain)}${commandChain.then ? ` ${stringifyCommandChainThen(commandChain.then)}` : ``}`;
}
function stringifyCommandChainThen(commandChainThen) {
    return `${commandChainThen.type} ${stringifyCommandChain(commandChainThen.chain)}`;
}
function stringifyCommand(command) {
    switch (command.type) {
        case `command`:
            return `${command.envs.length > 0 ? `${command.envs.map(env => stringifyEnvSegment(env)).join(` `)} ` : ``}${command.args.map(argument => stringifyArgument(argument)).join(` `)}`;
        case `subshell`:
            return `(${stringifyShellLine(command.subshell)})${command.args.length > 0 ? ` ${command.args.map(argument => stringifyRedirectArgument(argument)).join(` `)}` : ``}`;
        case `group`:
            return `{ ${stringifyShellLine(command.group, { /* Bash compat */ endSemicolon: true })} }${command.args.length > 0 ? ` ${command.args.map(argument => stringifyRedirectArgument(argument)).join(` `)}` : ``}`;
        case `envs`:
            return command.envs.map(env => stringifyEnvSegment(env)).join(` `);
        default:
            throw new Error(`Unsupported command type:  "${command.type}"`);
    }
}
function stringifyEnvSegment(envSegment) {
    return `${envSegment.name}=${envSegment.args[0] ? stringifyValueArgument(envSegment.args[0]) : ``}`;
}
function stringifyArgument(argument) {
    switch (argument.type) {
        case `redirection`:
            return stringifyRedirectArgument(argument);
        case `argument`:
            return stringifyValueArgument(argument);
        default:
            throw new Error(`Unsupported argument type: "${argument.type}"`);
    }
}
function stringifyRedirectArgument(argument) {
    return `${argument.subtype} ${argument.args.map(argument => stringifyValueArgument(argument)).join(` `)}`;
}
function stringifyValueArgument(argument) {
    return argument.segments.map(segment => stringifyArgumentSegment(segment)).join(``);
}
const ESCAPED_CONTROL_CHARS = new Map([
    [`\f`, `\\f`],
    [`\n`, `\\n`],
    [`\r`, `\\r`],
    [`\t`, `\\t`],
    [`\v`, `\\v`],
    [`\0`, `\\0`],
]);
const ESCAPED_DBL_CHARS = new Map([
    [`\\`, `\\\\`],
    [`$`, `\\$`],
    [`"`, `\\"`],
    ...Array.from(ESCAPED_CONTROL_CHARS, ([c, replacement]) => {
        return [c, `"$'${replacement}'"`];
    }),
]);
const getEscapedControlChar = (c) => {
    return ESCAPED_CONTROL_CHARS.get(c) ?? `\\x${c.charCodeAt(0).toString(16).padStart(2, `0`)}`;
};
const getEscapedDblChar = (match) => {
    return ESCAPED_DBL_CHARS.get(match) ?? `"$'${getEscapedControlChar(match)}'"`;
};
function stringifyArgumentSegment(argumentSegment) {
    const doubleQuoteIfRequested = (string, quote) => quote
        ? `"${string}"`
        : string;
    const quoteIfNeeded = (text) => {
        if (text === ``)
            return `''`;
        if (!text.match(/[()}<>$|&;"'\n\t ]/))
            return text;
        if (!text.match(/['\t\p{C}]/u))
            return `'${text}'`;
        if (!text.match(/'/)) {
            return `$'${text.replace(/[\t\p{C}]/u, getEscapedControlChar)}'`;
        }
        else {
            return `"${text.replace(/["$\t\p{C}]/u, getEscapedDblChar)}"`;
        }
    };
    switch (argumentSegment.type) {
        case `text`:
            return quoteIfNeeded(argumentSegment.text);
        case `glob`:
            return argumentSegment.pattern;
        case `shell`:
            return doubleQuoteIfRequested(`$(${stringifyShellLine(argumentSegment.shell)})`, argumentSegment.quoted);
        case `variable`:
            return doubleQuoteIfRequested(typeof argumentSegment.defaultValue === `undefined`
                ? typeof argumentSegment.alternativeValue === `undefined`
                    ? `\${${argumentSegment.name}}`
                    : argumentSegment.alternativeValue.length === 0
                        ? `\${${argumentSegment.name}:+}`
                        : `\${${argumentSegment.name}:+${argumentSegment.alternativeValue.map(argument => stringifyValueArgument(argument)).join(` `)}}`
                : argumentSegment.defaultValue.length === 0
                    ? `\${${argumentSegment.name}:-}`
                    : `\${${argumentSegment.name}:-${argumentSegment.defaultValue.map(argument => stringifyValueArgument(argument)).join(` `)}}`, argumentSegment.quoted);
        case `arithmetic`:
            return `$(( ${stringifyArithmeticExpression(argumentSegment.arithmetic)} ))`;
        default:
            throw new Error(`Unsupported argument segment type: "${argumentSegment.type}"`);
    }
}
function stringifyArithmeticExpression(argument) {
    const getOperator = (type) => {
        switch (type) {
            case `addition`:
                return `+`;
            case `subtraction`:
                return `-`;
            case `multiplication`:
                return `*`;
            case `division`:
                return `/`;
            default:
                throw new Error(`Can't extract operator from arithmetic expression of type "${type}"`);
        }
    };
    const parenthesizeIfRequested = (string, parenthesize) => parenthesize ? `( ${string} )` : string;
    const stringifyAndParenthesizeIfNeeded = (expression) => 
    // Right now we parenthesize all arithmetic operator expressions because it's easier
    parenthesizeIfRequested(stringifyArithmeticExpression(expression), ![`number`, `variable`].includes(expression.type));
    switch (argument.type) {
        case `number`:
            return String(argument.value);
        case `variable`:
            return argument.name;
        default:
            return `${stringifyAndParenthesizeIfNeeded(argument.left)} ${getOperator(argument.type)} ${stringifyAndParenthesizeIfNeeded(argument.right)}`;
    }
}
