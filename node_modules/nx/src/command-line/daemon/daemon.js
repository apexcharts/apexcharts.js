"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.daemonHandler = daemonHandler;
const tmp_dir_1 = require("../../daemon/tmp-dir");
const output_1 = require("../../utils/output");
const generate_help_output_1 = require("../../daemon/client/generate-help-output");
async function daemonHandler(args) {
    if (args.start) {
        const { daemonClient } = await Promise.resolve().then(() => require('../../daemon/client/client'));
        const pid = await daemonClient.startInBackground();
        output_1.output.log({
            title: `Daemon Server - Started in a background process...`,
            bodyLines: [
                `${output_1.output.dim('Logs from the Daemon process (')}ID: ${pid}${output_1.output.dim(') can be found here:')} ${tmp_dir_1.DAEMON_OUTPUT_LOG_FILE}\n`,
            ],
        });
    }
    else if (args.stop) {
        const { daemonClient } = await Promise.resolve().then(() => require('../../daemon/client/client'));
        await daemonClient.stop();
        output_1.output.log({ title: 'Daemon Server - Stopped' });
    }
    else {
        console.log((0, generate_help_output_1.generateDaemonHelpOutput)());
    }
}
