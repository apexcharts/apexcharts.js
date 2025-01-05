"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.yargsAffectedE2ECommand = exports.yargsAffectedLintCommand = exports.yargsAffectedBuildCommand = exports.yargsAffectedTestCommand = exports.yargsAffectedCommand = void 0;
const documentation_1 = require("../yargs-utils/documentation");
const shared_options_1 = require("../yargs-utils/shared-options");
const handle_errors_1 = require("../../utils/handle-errors");
exports.yargsAffectedCommand = {
    command: 'affected',
    describe: 'Run target for affected projects.',
    builder: (yargs) => (0, documentation_1.linkToNxDevAndExamples)((0, shared_options_1.withAffectedOptions)((0, shared_options_1.withRunOptions)((0, shared_options_1.withOutputStyleOption)((0, shared_options_1.withTargetAndConfigurationOption)((0, shared_options_1.withBatch)(yargs)))))
        .option('all', {
        type: 'boolean',
        deprecated: 'Use `nx run-many` instead',
    })
        .middleware((args) => {
        if (args.all !== undefined) {
            throw new Error("The '--all' option has been removed for `nx affected`. Use 'nx run-many' instead.");
        }
    }), 'affected'),
    handler: async (args) => {
        const exitCode = await (0, handle_errors_1.handleErrors)(args.verbose ?? process.env.NX_VERBOSE_LOGGING === 'true', async () => {
            return (await Promise.resolve().then(() => require('./affected'))).affected('affected', (0, shared_options_1.withOverrides)(args));
        });
        process.exit(exitCode);
    },
};
exports.yargsAffectedTestCommand = {
    command: 'affected:test',
    describe: false,
    builder: (yargs) => (0, documentation_1.linkToNxDevAndExamples)((0, shared_options_1.withAffectedOptions)((0, shared_options_1.withRunOptions)((0, shared_options_1.withOutputStyleOption)((0, shared_options_1.withConfiguration)(yargs)))), 'affected'),
    handler: async (args) => {
        const exitCode = await (0, handle_errors_1.handleErrors)(args.verbose ?? process.env.NX_VERBOSE_LOGGING === 'true', async () => {
            return (await Promise.resolve().then(() => require('./affected'))).affected('affected', {
                ...(0, shared_options_1.withOverrides)(args),
                target: 'test',
            });
        });
        process.exit(exitCode);
    },
};
exports.yargsAffectedBuildCommand = {
    command: 'affected:build',
    describe: false,
    builder: (yargs) => (0, documentation_1.linkToNxDevAndExamples)((0, shared_options_1.withAffectedOptions)((0, shared_options_1.withRunOptions)((0, shared_options_1.withOutputStyleOption)((0, shared_options_1.withConfiguration)(yargs)))), 'affected'),
    handler: async (args) => {
        const exitCode = await (0, handle_errors_1.handleErrors)(args.verbose ?? process.env.NX_VERBOSE_LOGGING === 'true', async () => {
            return (await Promise.resolve().then(() => require('./affected'))).affected('affected', {
                ...(0, shared_options_1.withOverrides)(args),
                target: 'build',
            });
        });
        process.exit(exitCode);
    },
};
exports.yargsAffectedLintCommand = {
    command: 'affected:lint',
    describe: false,
    builder: (yargs) => (0, documentation_1.linkToNxDevAndExamples)((0, shared_options_1.withAffectedOptions)((0, shared_options_1.withRunOptions)((0, shared_options_1.withOutputStyleOption)((0, shared_options_1.withConfiguration)(yargs)))), 'affected'),
    handler: async (args) => {
        const exitCode = await (0, handle_errors_1.handleErrors)(args.verbose ?? process.env.NX_VERBOSE_LOGGING === 'true', async () => {
            return (await Promise.resolve().then(() => require('./affected'))).affected('affected', {
                ...(0, shared_options_1.withOverrides)(args),
                target: 'lint',
            });
        });
        process.exit(exitCode);
    },
};
exports.yargsAffectedE2ECommand = {
    command: 'affected:e2e',
    describe: false,
    builder: (yargs) => (0, documentation_1.linkToNxDevAndExamples)((0, shared_options_1.withAffectedOptions)((0, shared_options_1.withRunOptions)((0, shared_options_1.withOutputStyleOption)((0, shared_options_1.withConfiguration)(yargs)))), 'affected'),
    handler: async (args) => {
        const exitCode = await (0, handle_errors_1.handleErrors)(args.verbose ?? process.env.NX_VERBOSE_LOGGING === 'true', async () => {
            return (await Promise.resolve().then(() => require('./affected'))).affected('affected', {
                ...(0, shared_options_1.withOverrides)(args),
                target: 'e2e',
            });
        });
        process.exit(exitCode);
    },
};
