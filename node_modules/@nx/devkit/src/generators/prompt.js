"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.promptWhenInteractive = promptWhenInteractive;
const enquirer_1 = require("enquirer");
const devkit_internals_1 = require("nx/src/devkit-internals");
async function promptWhenInteractive(questions, defaultValue) {
    if (!isInteractive()) {
        return defaultValue;
    }
    return await (0, enquirer_1.prompt)(questions);
}
function isInteractive() {
    return (!(0, devkit_internals_1.isCI)() && !!process.stdout.isTTY && process.env.NX_INTERACTIVE === 'true');
}
