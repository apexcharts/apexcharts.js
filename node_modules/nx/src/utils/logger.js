"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = exports.NX_ERROR = exports.NX_PREFIX = void 0;
exports.stripIndent = stripIndent;
const chalk = require("chalk");
exports.NX_PREFIX = chalk.inverse(chalk.bold(chalk.cyan(' NX ')));
exports.NX_ERROR = chalk.inverse(chalk.bold(chalk.red(' ERROR ')));
exports.logger = {
    warn: (s) => console.warn(chalk.bold(chalk.yellow(s))),
    error: (s) => {
        if (typeof s === 'string' && s.startsWith('NX ')) {
            console.error(`\n${exports.NX_ERROR} ${chalk.bold(chalk.red(s.slice(3)))}\n`);
        }
        else if (s instanceof Error && s.stack) {
            console.error(chalk.bold(chalk.red(s.stack)));
        }
        else {
            console.error(chalk.bold(chalk.red(s)));
        }
    },
    info: (s) => {
        if (typeof s === 'string' && s.startsWith('NX ')) {
            console.info(`\n${exports.NX_PREFIX} ${chalk.bold(s.slice(3))}\n`);
        }
        else {
            console.info(s);
        }
    },
    log: (...s) => {
        console.log(...s);
    },
    debug: (...s) => {
        console.debug(...s);
    },
    fatal: (...s) => {
        console.error(...s);
    },
    verbose: (...s) => {
        if (process.env.NX_VERBOSE_LOGGING === 'true') {
            console.log(...s);
        }
    },
};
function stripIndent(str) {
    const match = str.match(/^[ \t]*(?=\S)/gm);
    if (!match) {
        return str;
    }
    const indent = match.reduce((r, a) => Math.min(r, a.length), Infinity);
    const regex = new RegExp(`^[ \\t]{${indent}}`, 'gm');
    return str.replace(regex, '');
}
