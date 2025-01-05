"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.yargsExecCommand = void 0;
const shared_options_1 = require("../yargs-utils/shared-options");
exports.yargsExecCommand = {
    command: 'exec',
    describe: 'Executes any command as if it was a target on the project.',
    builder: (yargs) => (0, shared_options_1.withRunManyOptions)(yargs),
    handler: async (args) => {
        try {
            await (await Promise.resolve().then(() => require('./exec'))).nxExecCommand((0, shared_options_1.withOverrides)(args));
            process.exit(0);
        }
        catch (e) {
            console.error(e);
            process.exit(1);
        }
    },
};
