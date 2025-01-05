"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addCracoCommandsToPackageScripts = addCracoCommandsToPackageScripts;
const fileutils_1 = require("../../../../utils/fileutils");
function addCracoCommandsToPackageScripts(appName, isStandalone) {
    const packageJsonPath = isStandalone
        ? 'package.json'
        : `apps/${appName}/package.json`;
    const distPath = isStandalone
        ? `dist/${appName}`
        : `../../dist/apps/${appName}`;
    const packageJson = (0, fileutils_1.readJsonFile)(packageJsonPath);
    packageJson.scripts = {
        ...packageJson.scripts,
        start: 'nx exec -- craco start',
        serve: 'npm start',
        build: `cross-env BUILD_PATH=${distPath} nx exec -- craco build`,
        test: 'nx exec -- craco test',
    };
    (0, fileutils_1.writeJsonFile)(packageJsonPath, packageJson);
}
