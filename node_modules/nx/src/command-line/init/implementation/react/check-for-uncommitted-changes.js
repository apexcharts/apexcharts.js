"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkForUncommittedChanges = checkForUncommittedChanges;
const child_process_1 = require("child_process");
function checkForUncommittedChanges() {
    const gitResult = (0, child_process_1.execSync)('git status --porcelain', {
        windowsHide: false,
    }).toString();
    const filteredResults = gitResult
        .split('\n')
        .filter((line) => !line.includes('.nx') && line.trim().length > 0);
    if (filteredResults.length > 0) {
        console.log('❗️ Careful!');
        console.log('You have uncommitted changes in your repository.');
        console.log('');
        console.log(filteredResults.join('\n').toString());
        console.log('Please commit your changes before running the migrator!');
        process.exit(1);
    }
}
