"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginHandler = loginHandler;
const update_manager_1 = require("../../nx-cloud/update-manager");
const get_cloud_options_1 = require("../../nx-cloud/utilities/get-cloud-options");
const handle_errors_1 = require("../../utils/handle-errors");
const resolution_helpers_1 = require("../../nx-cloud/resolution-helpers");
function loginHandler(args) {
    if (args.nxCloudUrl) {
        process.env.NX_CLOUD_API = args.nxCloudUrl;
    }
    return (0, handle_errors_1.handleErrors)(args.verbose, async () => {
        const nxCloudClient = (await (0, update_manager_1.verifyOrUpdateNxCloudClient)((0, get_cloud_options_1.getCloudOptions)()))
            .nxCloudClient;
        const paths = (0, resolution_helpers_1.findAncestorNodeModules)(__dirname, []);
        nxCloudClient.configureLightClientRequire()(paths);
        await nxCloudClient.commands.login();
    });
}
