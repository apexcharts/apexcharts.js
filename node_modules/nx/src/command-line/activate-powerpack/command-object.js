"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.yargsActivatePowerpackCommand = void 0;
const shared_options_1 = require("../yargs-utils/shared-options");
const handle_errors_1 = require("../../utils/handle-errors");
exports.yargsActivatePowerpackCommand = {
    command: 'activate-powerpack <license>',
    describe: false,
    // describe: 'Activate a Nx Powerpack license.',
    builder: (yargs) => (0, shared_options_1.withVerbose)(yargs)
        .parserConfiguration({
        'strip-dashed': true,
        'unknown-options-as-args': true,
    })
        .positional('license', {
        type: 'string',
        description: 'This is a License Key for Nx Powerpack.',
    })
        .example('$0 activate-powerpack <license key>', 'Activate a Nx Powerpack license'),
    handler: async (args) => {
        const exitCode = await (0, handle_errors_1.handleErrors)(args.verbose, async () => {
            return (await Promise.resolve().then(() => require('./activate-powerpack'))).handleActivatePowerpack(args);
        });
        process.exit(exitCode);
    },
};
