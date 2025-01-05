"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseResolution = parseResolution;
exports.stringifyResolution = stringifyResolution;
const resolution_1 = require("./grammars/resolution");
function parseResolution(source) {
    const legacyResolution = source.match(/^\*{1,2}\/(.*)/);
    if (legacyResolution)
        throw new Error(`The override for '${source}' includes a glob pattern. Glob patterns have been removed since their behaviours don't match what you'd expect. Set the override to '${legacyResolution[1]}' instead.`);
    try {
        return (0, resolution_1.parse)(source);
    }
    catch (error) {
        if (error.location)
            error.message = error.message.replace(/(\.)?$/, ` (line ${error.location.start.line}, column ${error.location.start.column})$1`);
        throw error;
    }
}
function stringifyResolution(resolution) {
    let str = ``;
    if (resolution.from) {
        str += resolution.from.fullName;
        if (resolution.from.description)
            str += `@${resolution.from.description}`;
        str += `/`;
    }
    str += resolution.descriptor.fullName;
    if (resolution.descriptor.description)
        str += `@${resolution.descriptor.description}`;
    return str;
}
