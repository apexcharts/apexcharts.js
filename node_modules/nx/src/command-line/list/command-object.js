"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.yargsListCommand = void 0;
exports.yargsListCommand = {
    command: 'list [plugin]',
    describe: 'Lists installed plugins, capabilities of installed plugins and other available plugins.',
    builder: (yargs) => yargs.positional('plugin', {
        type: 'string',
        description: 'The name of an installed plugin to query.',
    }),
    handler: async (args) => {
        await (await Promise.resolve().then(() => require('./list'))).listHandler(args);
        process.exit(0);
    },
};
