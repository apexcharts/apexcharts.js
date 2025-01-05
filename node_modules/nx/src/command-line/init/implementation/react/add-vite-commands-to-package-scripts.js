"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addViteCommandsToPackageScripts = addViteCommandsToPackageScripts;
const fileutils_1 = require("../../../../utils/fileutils");
function addViteCommandsToPackageScripts(appName, isStandalone) {
    const packageJsonPath = isStandalone
        ? 'package.json'
        : `apps/${appName}/package.json`;
    const packageJson = (0, fileutils_1.readJsonFile)(packageJsonPath);
    packageJson.scripts = {
        ...packageJson.scripts,
        start: 'nx exec -- vite',
        serve: 'nx exec -- vite',
        build: `nx exec -- vite build`,
        test: 'nx exec -- vitest',
    };
    (0, fileutils_1.writeJsonFile)(packageJsonPath, packageJson, { spaces: 2 });
}
