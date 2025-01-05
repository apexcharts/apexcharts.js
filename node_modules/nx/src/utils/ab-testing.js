"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.messages = exports.PromptMessages = void 0;
exports.recordStat = recordStat;
const node_child_process_1 = require("node:child_process");
const is_ci_1 = require("./is-ci");
const package_manager_1 = require("./package-manager");
const get_cloud_options_1 = require("../nx-cloud/utilities/get-cloud-options");
const messageOptions = {
    setupNxCloud: [
        {
            code: 'enable-caching',
            message: `Would you like remote caching to make your build faster?`,
            initial: 0,
            choices: [
                { value: 'yes', name: 'Yes' },
                { value: 'skip', name: 'Skip for now' },
            ],
            footer: '\nWatch a short video on Nx Cloud at https://nx.dev/ci/intro/why-nx-cloud',
            hint: `\n(it's free and can be disabled any time)`,
        },
    ],
    setupViewLogs: [
        {
            code: 'connect-to-view-logs',
            message: `To view the logs, Nx needs to connect your workspace to Nx Cloud and upload the most recent run details`,
            initial: 0,
            choices: [
                {
                    value: 'yes',
                    name: 'Yes',
                    hint: 'Connect to Nx Cloud and upload the run details',
                },
                { value: 'skip', name: 'No' },
            ],
            footer: '\nRead more about remote cache at https://nx.dev/ci/features/remote-cache',
            hint: `\n(it's free and can be disabled any time)`,
        },
    ],
};
class PromptMessages {
    constructor() {
        this.selectedMessages = {};
    }
    getPrompt(key) {
        if (this.selectedMessages[key] === undefined) {
            if (process.env.NX_GENERATE_DOCS_PROCESS === 'true') {
                this.selectedMessages[key] = 0;
            }
            else {
                this.selectedMessages[key] = Math.floor(Math.random() * messageOptions[key].length);
            }
        }
        return messageOptions[key][this.selectedMessages[key]];
    }
    codeOfSelectedPromptMessage(key) {
        if (this.selectedMessages[key] === undefined)
            return null;
        return messageOptions[key][this.selectedMessages[key]].code;
    }
}
exports.PromptMessages = PromptMessages;
exports.messages = new PromptMessages();
/**
 * We are incrementing a counter to track how often create-nx-workspace is used in CI
 * vs dev environments. No personal information is collected.
 */
async function recordStat(opts) {
    try {
        if (!shouldRecordStats()) {
            return;
        }
        const axios = require('axios');
        await (axios['default'] ?? axios)
            .create({
            baseURL: (0, get_cloud_options_1.getCloudUrl)(),
            timeout: 400,
        })
            .post('/nx-cloud/stats', {
            command: opts.command,
            isCI: (0, is_ci_1.isCI)(),
            useCloud: opts.useCloud,
            meta: opts.meta,
        });
    }
    catch (e) {
        if (process.env.NX_VERBOSE_LOGGING === 'true') {
            console.error(e);
        }
    }
}
function shouldRecordStats() {
    const pmc = (0, package_manager_1.getPackageManagerCommand)();
    if (!pmc.getRegistryUrl) {
        // Fallback on true as Package management doesn't support reading config for registry.
        // currently Bun doesn't support fetching config settings https://github.com/oven-sh/bun/issues/7140
        return true;
    }
    try {
        const stdout = (0, node_child_process_1.execSync)(pmc.getRegistryUrl, {
            encoding: 'utf-8',
            windowsHide: false,
        });
        const url = new URL(stdout.trim());
        // don't record stats when testing locally
        return url.hostname !== 'localhost';
    }
    catch {
        // fallback to true if we can't detect the registry
        return true;
    }
}
