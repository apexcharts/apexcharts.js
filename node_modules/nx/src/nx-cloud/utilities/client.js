"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnknownCommandError = void 0;
exports.getCloudClient = getCloudClient;
const resolution_helpers_1 = require("../resolution-helpers");
const update_manager_1 = require("../update-manager");
class UnknownCommandError extends Error {
    constructor(command, availableCommands) {
        super(`Unknown Command "${command}"`);
        this.command = command;
        this.availableCommands = availableCommands;
    }
}
exports.UnknownCommandError = UnknownCommandError;
async function getCloudClient(options) {
    const { nxCloudClient } = await (0, update_manager_1.verifyOrUpdateNxCloudClient)(options);
    const paths = (0, resolution_helpers_1.findAncestorNodeModules)(__dirname, []);
    nxCloudClient.configureLightClientRequire()(paths);
    return {
        invoke: (command) => {
            if (command in nxCloudClient.commands) {
                nxCloudClient.commands[command]()
                    .then(() => process.exit(0))
                    .catch((e) => {
                    console.error(e);
                    process.exit(1);
                });
            }
            else {
                throw new UnknownCommandError(command, Object.keys(nxCloudClient.commands));
            }
        },
        availableCommands: Object.keys(nxCloudClient.commands),
    };
}
