"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.yargsImportCommand = void 0;
const documentation_1 = require("../yargs-utils/documentation");
const shared_options_1 = require("../yargs-utils/shared-options");
const handle_errors_1 = require("../../utils/handle-errors");
exports.yargsImportCommand = {
    command: 'import [sourceRepository] [destinationDirectory]',
    describe: 'Import code and git history from another repository into this repository.',
    builder: (yargs) => (0, documentation_1.linkToNxDevAndExamples)((0, shared_options_1.withVerbose)(yargs
        .positional('sourceRepository', {
        type: 'string',
        description: 'The remote URL of the source to import.',
    })
        .positional('destinationDirectory', {
        type: 'string',
        alias: 'destination',
        description: 'The directory in the current workspace to import into.',
    })
        .option('sourceDirectory', {
        type: 'string',
        alias: 'source',
        description: 'The directory in the source repository to import from.',
    })
        .option('ref', {
        type: 'string',
        description: 'The branch from the source repository to import.',
    })
        .option('depth', {
        type: 'number',
        description: 'The depth to clone the source repository (limit this for faster git clone).',
    })
        .option('interactive', {
        type: 'boolean',
        description: 'Interactive mode.',
        default: true,
    })), 'import'),
    handler: async (args) => {
        const exitCode = await (0, handle_errors_1.handleErrors)(args.verbose, async () => {
            return (await Promise.resolve().then(() => require('./import'))).importHandler(args);
        });
        process.exit(exitCode);
    },
};
