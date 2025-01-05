"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkForCustomWebpackSetup = checkForCustomWebpackSetup;
const fileutils_1 = require("../../../../utils/fileutils");
function checkForCustomWebpackSetup() {
    const packageJson = (0, fileutils_1.readJsonFile)('package.json');
    const combinedDeps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies,
    };
    ['react-app-rewired', '@craco/craco'].forEach((pkg) => {
        if (combinedDeps[pkg]) {
            console.log(`Skipping migration due to custom webpack setup. Found "${pkg}" usage. Use --force to continue anyway.`);
            process.exit(1);
        }
    });
}
