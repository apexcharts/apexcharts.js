"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.printDiff = printDiff;
exports.printAndFlushChanges = printAndFlushChanges;
const chalk = require("chalk");
const jest_diff_1 = require("jest-diff");
const node_fs_1 = require("node:fs");
const tree_1 = require("../../../generators/tree");
const workspace_root_1 = require("../../../utils/workspace-root");
const path_1 = require("../../../utils/path");
const logger_1 = require("../../../utils/logger");
// jest-diff does not export this constant
const NO_DIFF_MESSAGE = 'Compared values have no visual difference.';
function printDiff(before, after, contextLines = 1, noDiffMessage = NO_DIFF_MESSAGE) {
    const diffOutput = (0, jest_diff_1.diff)(before, after, {
        omitAnnotationLines: true,
        contextLines,
        expand: false,
        aColor: chalk.red,
        bColor: chalk.green,
        patchColor: (s) => '',
    });
    // It is not an exact match because of the color codes
    if (diffOutput.includes(NO_DIFF_MESSAGE)) {
        console.log(noDiffMessage);
    }
    else {
        console.log(diffOutput);
    }
    console.log('');
}
function printAndFlushChanges(tree, isDryRun, diffContextLines = 1, shouldPrintDryRunMessage = true, noDiffMessage, changePredicate) {
    changePredicate = changePredicate || (() => true);
    const changes = tree.listChanges();
    console.log('');
    if (changes.length === 0 && noDiffMessage) {
        console.log(noDiffMessage);
        return;
    }
    // Print the changes
    changes.filter(changePredicate).forEach((f) => {
        if (f.type === 'CREATE') {
            console.error(`${chalk.green('CREATE')} ${f.path}${isDryRun ? chalk.keyword('orange')(' [dry-run]') : ''}`);
            printDiff('', f.content?.toString() || '', diffContextLines, noDiffMessage);
        }
        else if (f.type === 'UPDATE') {
            console.error(`${chalk.white('UPDATE')} ${f.path}${isDryRun ? chalk.keyword('orange')(' [dry-run]') : ''}`);
            const currentContentsOnDisk = (0, node_fs_1.readFileSync)((0, path_1.joinPathFragments)(tree.root, f.path)).toString();
            printDiff(currentContentsOnDisk, f.content?.toString() || '', diffContextLines, noDiffMessage);
        }
        else if (f.type === 'DELETE') {
            throw new Error('Unexpected DELETE change, please report this as an issue');
        }
    });
    if (!isDryRun) {
        (0, tree_1.flushChanges)(workspace_root_1.workspaceRoot, changes);
    }
    if (isDryRun && shouldPrintDryRunMessage) {
        logger_1.logger.warn(`\nNOTE: The "dryRun" flag means no changes were made.`);
    }
}
