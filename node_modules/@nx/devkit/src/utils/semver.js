"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkAndCleanWithSemver = checkAndCleanWithSemver;
const semver_1 = require("semver");
function checkAndCleanWithSemver(pkgName, version) {
    let newVersion = version;
    if ((0, semver_1.valid)(newVersion)) {
        return newVersion;
    }
    if (version.startsWith('~') || version.startsWith('^')) {
        newVersion = version.substring(1);
    }
    if (!(0, semver_1.valid)(newVersion)) {
        throw new Error(`The package.json lists a version of ${pkgName} that Nx is unable to validate - (${version})`);
    }
    return newVersion;
}
