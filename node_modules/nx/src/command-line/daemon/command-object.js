"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.yargsDaemonCommand = void 0;
const documentation_1 = require("../yargs-utils/documentation");
exports.yargsDaemonCommand = {
    command: 'daemon',
    describe: 'Prints information about the Nx Daemon process or starts a daemon process.',
    builder: (yargs) => (0, documentation_1.linkToNxDevAndExamples)(withDaemonOptions(yargs), 'daemon'),
    handler: async (args) => (await Promise.resolve().then(() => require('./daemon'))).daemonHandler(args),
};
function withDaemonOptions(yargs) {
    return yargs
        .option('start', {
        type: 'boolean',
        default: false,
    })
        .option('stop', {
        type: 'boolean',
        default: false,
    });
}
