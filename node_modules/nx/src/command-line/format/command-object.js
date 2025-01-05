"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.yargsFormatWriteCommand = exports.yargsFormatCheckCommand = void 0;
const documentation_1 = require("../yargs-utils/documentation");
const shared_options_1 = require("../yargs-utils/shared-options");
exports.yargsFormatCheckCommand = {
    command: 'format:check',
    describe: 'Check for un-formatted files.',
    builder: (yargs) => (0, documentation_1.linkToNxDevAndExamples)(withFormatOptions(yargs), 'format:check'),
    handler: async (args) => {
        await (await Promise.resolve().then(() => require('./format'))).format('check', args);
        process.exit(0);
    },
};
exports.yargsFormatWriteCommand = {
    command: 'format:write',
    describe: 'Overwrite un-formatted files.',
    aliases: ['format'],
    builder: (yargs) => (0, documentation_1.linkToNxDevAndExamples)(withFormatOptions(yargs), 'format:write'),
    handler: async (args) => {
        await (await Promise.resolve().then(() => require('./format'))).format('write', args);
        process.exit(0);
    },
};
function withFormatOptions(yargs) {
    return (0, shared_options_1.withAffectedOptions)(yargs)
        .parserConfiguration({
        'camel-case-expansion': true,
    })
        .option('libs-and-apps', {
        describe: 'Format only libraries and applications files.',
        type: 'boolean',
    })
        .option('projects', {
        describe: 'Projects to format (comma/space delimited).',
        type: 'string',
        coerce: shared_options_1.parseCSV,
    })
        .option('sort-root-tsconfig-paths', {
        describe: `Ensure the workspace's tsconfig compilerOptions.paths are sorted. Warning: This will cause comments in the tsconfig to be lost.`,
        type: 'boolean',
        /**
         * TODO(v21): Stop sorting tsconfig paths by default, paths are now less common/important
         * in Nx workspace setups, and the sorting causes comments to be lost.
         */
        default: true,
    })
        .option('all', {
        describe: 'Format all projects.',
        type: 'boolean',
    })
        .conflicts({
        all: 'projects',
    });
}
