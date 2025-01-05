"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.yargsInternalMigrateCommand = exports.yargsMigrateCommand = void 0;
const documentation_1 = require("../yargs-utils/documentation");
const shared_options_1 = require("../yargs-utils/shared-options");
exports.yargsMigrateCommand = {
    command: 'migrate [packageAndVersion]',
    describe: `Creates a migrations file or runs migrations from the migrations file.
  - Migrate packages and create migrations.json (e.g., nx migrate @nx/workspace@latest)
  - Run migrations (e.g., nx migrate --run-migrations=migrations.json). Use flag --if-exists to run migrations only if the migrations file exists.`,
    builder: (yargs) => (0, documentation_1.linkToNxDevAndExamples)(withMigrationOptions(yargs), 'migrate'),
    handler: async () => {
        (await Promise.resolve().then(() => require('./migrate'))).runMigration();
        process.exit(0);
    },
};
exports.yargsInternalMigrateCommand = {
    command: '_migrate [packageAndVersion]',
    describe: false,
    builder: (yargs) => withMigrationOptions(yargs),
    handler: async (args) => process.exit(await (await Promise.resolve().then(() => require('./migrate'))).migrate(process.cwd(), args, process.argv.slice(3))),
};
function withMigrationOptions(yargs) {
    const defaultCommitPrefix = 'chore: [nx migration] ';
    return (0, shared_options_1.withVerbose)(yargs)
        .positional('packageAndVersion', {
        describe: `The target package and version (e.g, @nx/workspace@16.0.0).`,
        type: 'string',
    })
        .option('runMigrations', {
        describe: `Execute migrations from a file (when the file isn't provided, execute migrations from migrations.json).`,
        type: 'string',
    })
        .option('ifExists', {
        describe: `Run migrations only if the migrations file exists, if not continues successfully.`,
        type: 'boolean',
        default: false,
    })
        .option('from', {
        describe: 'Use the provided versions for packages instead of the ones installed in node_modules (e.g., --from="@nx/react@16.0.0,@nx/js@16.0.0").',
        type: 'string',
    })
        .option('to', {
        describe: 'Use the provided versions for packages instead of the ones calculated by the migrator (e.g., --to="@nx/react@16.0.0,@nx/js@16.0.0").',
        type: 'string',
    })
        .option('createCommits', {
        describe: 'Automatically create a git commit after each migration runs.',
        type: 'boolean',
        alias: ['C'],
        default: false,
    })
        .option('commitPrefix', {
        describe: 'Commit prefix to apply to the commit for each migration, when --create-commits is enabled.',
        type: 'string',
        default: defaultCommitPrefix,
    })
        .option('interactive', {
        describe: 'Enable prompts to confirm whether to collect optional package updates and migrations.',
        type: 'boolean',
        default: false,
    })
        .option('excludeAppliedMigrations', {
        describe: 'Exclude migrations that should have been applied on previous updates. To be used with --from.',
        type: 'boolean',
        default: false,
    })
        .check(({ createCommits, commitPrefix, from, excludeAppliedMigrations }) => {
        if (!createCommits && commitPrefix !== defaultCommitPrefix) {
            throw new Error('Error: Providing a custom commit prefix requires --create-commits to be enabled');
        }
        if (excludeAppliedMigrations && !from) {
            throw new Error('Error: Excluding migrations that should have been previously applied requires --from to be set');
        }
        return true;
    });
}
