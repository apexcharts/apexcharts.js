"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.linkToNxDevAndExamples = linkToNxDevAndExamples;
const chalk = require("chalk");
const examples_1 = require("../examples");
function linkToNxDevAndExamples(yargs, command) {
    (examples_1.examples[command] || []).forEach((t) => {
        yargs = yargs.example(t.command, t.description);
    });
    return yargs.epilog(chalk.bold(`Find more information and examples at https://nx.dev/nx/${command.replace(':', '-')}`));
}
