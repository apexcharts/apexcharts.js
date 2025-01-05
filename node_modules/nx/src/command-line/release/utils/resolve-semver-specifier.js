"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveSemverSpecifierFromConventionalCommits = resolveSemverSpecifierFromConventionalCommits;
exports.resolveSemverSpecifierFromPrompt = resolveSemverSpecifierFromPrompt;
const enquirer_1 = require("enquirer");
const semver_1 = require("semver");
const git_1 = require("./git");
const semver_2 = require("./semver");
const shared_1 = require("./shared");
async function resolveSemverSpecifierFromConventionalCommits(from, projectGraph, projectNames, conventionalCommitsConfig) {
    const commits = await (0, git_1.getGitDiff)(from);
    const parsedCommits = (0, git_1.parseCommits)(commits);
    const relevantCommits = await (0, shared_1.getCommitsRelevantToProjects)(projectGraph, parsedCommits, projectNames);
    return (0, semver_2.determineSemverChange)(relevantCommits, conventionalCommitsConfig);
}
async function resolveSemverSpecifierFromPrompt(selectionMessage, customVersionMessage) {
    try {
        const reply = await (0, enquirer_1.prompt)([
            {
                name: 'specifier',
                message: selectionMessage,
                type: 'select',
                choices: [
                    ...semver_1.RELEASE_TYPES.map((t) => ({ name: t, message: t })),
                    {
                        name: 'custom',
                        message: 'Custom exact version',
                    },
                ],
            },
        ]);
        if (reply.specifier !== 'custom') {
            return reply.specifier;
        }
        else {
            const reply = await (0, enquirer_1.prompt)([
                {
                    name: 'specifier',
                    message: customVersionMessage,
                    type: 'input',
                    validate: (input) => {
                        if ((0, semver_1.valid)(input)) {
                            return true;
                        }
                        return 'Please enter a valid semver version';
                    },
                },
            ]);
            return reply.specifier;
        }
    }
    catch {
        // TODO: log the error to the user?
        // We need to catch the error from enquirer prompt, otherwise yargs will print its help
        process.exit(1);
    }
}
