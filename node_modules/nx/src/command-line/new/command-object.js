"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.yargsNewCommand = void 0;
exports.yargsNewCommand = {
    command: 'new [_..]',
    describe: false,
    builder: (yargs) => withNewOptions(yargs),
    handler: async (args) => {
        args._ = args._.slice(1);
        process.exit(await (await Promise.resolve().then(() => require('./new'))).newWorkspace(args['nxWorkspaceRoot'], args));
    },
};
function withNewOptions(yargs) {
    return yargs
        .option('nxWorkspaceRoot', {
        describe: 'The folder where the new workspace is going to be created.',
        type: 'string',
        required: true,
    })
        .option('interactive', {
        describe: 'When false disables interactive input prompts for options.',
        type: 'boolean',
        default: true,
    });
}
