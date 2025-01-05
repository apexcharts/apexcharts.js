"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.yargsViewLogsCommand = exports.yargsConnectCommand = void 0;
const documentation_1 = require("../yargs-utils/documentation");
const versions_1 = require("../../utils/versions");
const shared_options_1 = require("../yargs-utils/shared-options");
exports.yargsConnectCommand = {
    command: 'connect',
    aliases: ['connect-to-nx-cloud'],
    describe: `Connect workspace to Nx Cloud.`,
    builder: (yargs) => (0, documentation_1.linkToNxDevAndExamples)(withConnectOptions(yargs), 'connect-to-nx-cloud'),
    handler: async (args) => {
        await (await Promise.resolve().then(() => require('./connect-to-nx-cloud'))).connectToNxCloudCommand(args);
        await (await Promise.resolve().then(() => require('../../utils/ab-testing'))).recordStat({
            command: 'connect',
            nxVersion: versions_1.nxVersion,
            useCloud: true,
        });
        process.exit(0);
    },
};
function withConnectOptions(yargs) {
    return (0, shared_options_1.withVerbose)(yargs).option('generateToken', {
        type: 'boolean',
        description: 'Explicitly asks for a token to be created, do not override existing tokens from Nx Cloud.',
    });
}
exports.yargsViewLogsCommand = {
    command: 'view-logs',
    describe: 'Enables you to view and interact with the logs via the advanced analytic UI from Nx Cloud to help you debug your issue. To do this, Nx needs to connect your workspace to Nx Cloud and upload the most recent run details. Only the metrics are uploaded, not the artefacts.',
    handler: async () => process.exit(await (await Promise.resolve().then(() => require('./view-logs'))).viewLogs()),
};
