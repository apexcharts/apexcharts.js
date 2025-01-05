"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.yargsLoginCommand = void 0;
const shared_options_1 = require("../../command-line/yargs-utils/shared-options");
exports.yargsLoginCommand = {
    command: 'login [nxCloudUrl]',
    describe: 'Login to Nx Cloud. This command is an alias for [`nx-cloud login`](/ci/reference/nx-cloud-cli#npx-nxcloud-login).',
    builder: (yargs) => (0, shared_options_1.withVerbose)(yargs.positional('nxCloudUrl', {
        describe: 'The Nx Cloud URL of the instance you are trying to connect to. If no positional argument is provided, this command will connect to https://cloud.nx.app.',
        type: 'string',
        required: false,
    })),
    handler: async (args) => {
        process.exit(await (await Promise.resolve().then(() => require('./login'))).loginHandler(args));
    },
};
