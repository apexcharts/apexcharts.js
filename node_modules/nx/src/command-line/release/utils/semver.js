"use strict";
/**
 * Special thanks to changelogen for the original inspiration for many of these utilities:
 * https://github.com/unjs/changelogen
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.isRelativeVersionKeyword = isRelativeVersionKeyword;
exports.isValidSemverSpecifier = isValidSemverSpecifier;
exports.determineSemverChange = determineSemverChange;
exports.deriveNewSemverVersion = deriveNewSemverVersion;
const semver_1 = require("semver");
function isRelativeVersionKeyword(val) {
    return semver_1.RELEASE_TYPES.includes(val);
}
function isValidSemverSpecifier(specifier) {
    return (specifier && !!((0, semver_1.valid)(specifier) || isRelativeVersionKeyword(specifier)));
}
// https://github.com/unjs/changelogen/blob/main/src/semver.ts
function determineSemverChange(commits, config) {
    let [hasMajor, hasMinor, hasPatch] = [false, false, false];
    for (const commit of commits) {
        const semverType = config.types[commit.type]?.semverBump;
        if (semverType === 'major' || commit.isBreaking) {
            hasMajor = true;
        }
        else if (semverType === 'minor') {
            hasMinor = true;
        }
        else if (semverType === 'patch') {
            hasPatch = true;
        }
        else if (semverType === 'none' || !semverType) {
            // do not report a change
        }
    }
    return hasMajor ? 'major' : hasMinor ? 'minor' : hasPatch ? 'patch' : null;
}
function deriveNewSemverVersion(currentSemverVersion, semverSpecifier, preid) {
    if (!(0, semver_1.valid)(currentSemverVersion)) {
        throw new Error(`Invalid semver version "${currentSemverVersion}" provided.`);
    }
    let newVersion = semverSpecifier;
    if (isRelativeVersionKeyword(semverSpecifier)) {
        // Derive the new version from the current version combined with the new version specifier.
        const derivedVersion = (0, semver_1.inc)(currentSemverVersion, semverSpecifier, preid);
        if (!derivedVersion) {
            throw new Error(`Unable to derive new version from current version "${currentSemverVersion}" and version specifier "${semverSpecifier}"`);
        }
        newVersion = derivedVersion;
    }
    else {
        // Ensure the new version specifier is a valid semver version, given it is not a valid semver keyword
        if (!(0, semver_1.valid)(semverSpecifier)) {
            throw new Error(`Invalid semver version specifier "${semverSpecifier}" provided. Please provide either a valid semver version or a valid semver version keyword.`);
        }
    }
    return newVersion;
}
