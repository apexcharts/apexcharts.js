"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.yargsSyncCheckCommand = exports.yargsSyncCommand = void 0;
const shared_options_1 = require("../yargs-utils/shared-options");
exports.yargsSyncCommand = {
    command: 'sync',
    describe: 'Sync the workspace files by running all the sync generators.',
    builder: (yargs) => (0, shared_options_1.withVerbose)(yargs),
    handler: async (args) => {
        process.exit(await Promise.resolve().then(() => require('./sync')).then((m) => m.syncHandler(args)));
    },
};
exports.yargsSyncCheckCommand = {
    command: 'sync:check',
    describe: 'Check that no changes are required after running all sync generators.',
    builder: (yargs) => (0, shared_options_1.withVerbose)(yargs),
    handler: async (args) => {
        process.exit(await Promise.resolve().then(() => require('./sync')).then((m) => m.syncHandler({ ...args, check: true })));
    },
};
