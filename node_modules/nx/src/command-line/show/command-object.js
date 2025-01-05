"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.yargsShowCommand = void 0;
const yargs_1 = require("yargs");
const shared_options_1 = require("../yargs-utils/shared-options");
const handle_errors_1 = require("../../utils/handle-errors");
exports.yargsShowCommand = {
    command: 'show',
    describe: 'Show information about the workspace (e.g., list of projects).',
    builder: (yargs) => yargs
        .command(showProjectsCommand)
        .command(showProjectCommand)
        .demandCommand()
        .option('json', {
        type: 'boolean',
        description: 'Output JSON.',
    })
        .example('$0 show projects', 'Show a list of all projects in the workspace')
        .example('$0 show projects --with-target serve', 'Show a list of all projects in the workspace that have a "serve" target')
        .example('$0 show project [projectName]', 'Shows the resolved configuration for [projectName]'),
    handler: async (args) => {
        (0, yargs_1.showHelp)();
        process.exit(1);
    },
};
const showProjectsCommand = {
    command: 'projects',
    describe: 'Show a list of projects in the workspace.',
    builder: (yargs) => (0, shared_options_1.withVerbose)((0, shared_options_1.withAffectedOptions)(yargs))
        .option('affected', {
        type: 'boolean',
        description: 'Show only affected projects.',
    })
        .option('projects', {
        type: 'string',
        alias: ['p'],
        description: 'Show only projects that match a given pattern.',
        coerce: shared_options_1.parseCSV,
    })
        .option('withTarget', {
        type: 'string',
        alias: ['t'],
        description: 'Show only projects that have a specific target.',
        coerce: shared_options_1.parseCSV,
    })
        .option('type', {
        type: 'string',
        description: 'Select only projects of the given type.',
        choices: ['app', 'lib', 'e2e'],
    })
        .option('sep', {
        type: 'string',
        description: 'Outputs projects with the specified seperator.',
    })
        .implies('untracked', 'affected')
        .implies('uncommitted', 'affected')
        .implies('files', 'affected')
        .implies('base', 'affected')
        .implies('head', 'affected')
        .conflicts('sep', 'json')
        .conflicts('json', 'sep')
        .example('$0 show projects --projects "apps/*"', 'Show all projects in the apps directory')
        .example('$0 show projects --projects "shared-*"', 'Show all projects that start with "shared-"')
        .example('$0 show projects --affected', 'Show affected projects in the workspace')
        .example('$0 show projects --type app --affected', 'Show affected apps in the workspace')
        .example('$0 show projects --affected --exclude=*-e2e', 'Show affected projects in the workspace, excluding end-to-end projects'),
    handler: async (args) => {
        const exitCode = await (0, handle_errors_1.handleErrors)(args.verbose, async () => {
            const { showProjectsHandler } = await Promise.resolve().then(() => require('./projects'));
            await showProjectsHandler(args);
        });
        process.exit(exitCode);
    },
};
const showProjectCommand = {
    command: 'project <projectName>',
    describe: 'Shows resolved project configuration for a given project.',
    builder: (yargs) => (0, shared_options_1.withVerbose)(yargs)
        .positional('projectName', {
        type: 'string',
        alias: 'p',
        description: 'Which project should be viewed?.',
    })
        .option('web', {
        type: 'boolean',
        description: 'Show project details in the browser. (default when interactive).',
    })
        .option('open', {
        type: 'boolean',
        description: 'Set to false to prevent the browser from opening when using --web.',
        implies: 'web',
    })
        .check((argv) => {
        // If TTY is enabled, default to web. Otherwise, default to JSON.
        const alreadySpecified = argv.web !== undefined || argv.json !== undefined;
        if (!alreadySpecified) {
            if (process.stdout.isTTY) {
                argv.web = true;
            }
            else {
                argv.json = true;
            }
        }
        return true;
    })
        .example('$0 show project my-app', 'View project information for my-app in JSON format')
        .example('$0 show project my-app --web', 'View project information for my-app in the browser'),
    handler: async (args) => {
        const exitCode = await (0, handle_errors_1.handleErrors)(args.verbose, async () => {
            const { showProjectHandler } = await Promise.resolve().then(() => require('./project'));
            await showProjectHandler(args);
        });
        process.exit(exitCode);
    },
};
