"use strict";
/**
 * @license
 * Copyright 2023 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.compareVersions = exports.resolveSystemExecutablePath = exports.resolveBuildId = exports.getLastKnownGoodReleaseForBuild = exports.getLastKnownGoodReleaseForMilestone = exports.getLastKnownGoodReleaseForChannel = exports.relativeExecutablePath = exports.resolveDownloadPath = exports.resolveDownloadUrl = void 0;
const path_1 = __importDefault(require("path"));
const semver_1 = __importDefault(require("semver"));
const httpUtil_js_1 = require("../httpUtil.js");
const types_js_1 = require("./types.js");
function folder(platform) {
    switch (platform) {
        case types_js_1.BrowserPlatform.LINUX:
            return 'linux64';
        case types_js_1.BrowserPlatform.MAC_ARM:
            return 'mac-arm64';
        case types_js_1.BrowserPlatform.MAC:
            return 'mac-x64';
        case types_js_1.BrowserPlatform.WIN32:
            return 'win32';
        case types_js_1.BrowserPlatform.WIN64:
            return 'win64';
    }
}
function resolveDownloadUrl(platform, buildId, baseUrl = 'https://storage.googleapis.com/chrome-for-testing-public') {
    return `${baseUrl}/${resolveDownloadPath(platform, buildId).join('/')}`;
}
exports.resolveDownloadUrl = resolveDownloadUrl;
function resolveDownloadPath(platform, buildId) {
    return [buildId, folder(platform), `chrome-${folder(platform)}.zip`];
}
exports.resolveDownloadPath = resolveDownloadPath;
function relativeExecutablePath(platform, _buildId) {
    switch (platform) {
        case types_js_1.BrowserPlatform.MAC:
        case types_js_1.BrowserPlatform.MAC_ARM:
            return path_1.default.join('chrome-' + folder(platform), 'Google Chrome for Testing.app', 'Contents', 'MacOS', 'Google Chrome for Testing');
        case types_js_1.BrowserPlatform.LINUX:
            return path_1.default.join('chrome-linux64', 'chrome');
        case types_js_1.BrowserPlatform.WIN32:
        case types_js_1.BrowserPlatform.WIN64:
            return path_1.default.join('chrome-' + folder(platform), 'chrome.exe');
    }
}
exports.relativeExecutablePath = relativeExecutablePath;
async function getLastKnownGoodReleaseForChannel(channel) {
    const data = (await (0, httpUtil_js_1.getJSON)(new URL('https://googlechromelabs.github.io/chrome-for-testing/last-known-good-versions.json')));
    for (const channel of Object.keys(data.channels)) {
        data.channels[channel.toLowerCase()] = data.channels[channel];
        delete data.channels[channel];
    }
    return data.channels[channel];
}
exports.getLastKnownGoodReleaseForChannel = getLastKnownGoodReleaseForChannel;
async function getLastKnownGoodReleaseForMilestone(milestone) {
    const data = (await (0, httpUtil_js_1.getJSON)(new URL('https://googlechromelabs.github.io/chrome-for-testing/latest-versions-per-milestone.json')));
    return data.milestones[milestone];
}
exports.getLastKnownGoodReleaseForMilestone = getLastKnownGoodReleaseForMilestone;
async function getLastKnownGoodReleaseForBuild(
/**
 * @example `112.0.23`,
 */
buildPrefix) {
    const data = (await (0, httpUtil_js_1.getJSON)(new URL('https://googlechromelabs.github.io/chrome-for-testing/latest-patch-versions-per-build.json')));
    return data.builds[buildPrefix];
}
exports.getLastKnownGoodReleaseForBuild = getLastKnownGoodReleaseForBuild;
async function resolveBuildId(channel) {
    if (Object.values(types_js_1.ChromeReleaseChannel).includes(channel)) {
        return (await getLastKnownGoodReleaseForChannel(channel)).version;
    }
    if (channel.match(/^\d+$/)) {
        // Potentially a milestone.
        return (await getLastKnownGoodReleaseForMilestone(channel))?.version;
    }
    if (channel.match(/^\d+\.\d+\.\d+$/)) {
        // Potentially a build prefix without the patch version.
        return (await getLastKnownGoodReleaseForBuild(channel))?.version;
    }
    return;
}
exports.resolveBuildId = resolveBuildId;
function resolveSystemExecutablePath(platform, channel) {
    switch (platform) {
        case types_js_1.BrowserPlatform.WIN64:
        case types_js_1.BrowserPlatform.WIN32:
            switch (channel) {
                case types_js_1.ChromeReleaseChannel.STABLE:
                    return `${process.env['PROGRAMFILES']}\\Google\\Chrome\\Application\\chrome.exe`;
                case types_js_1.ChromeReleaseChannel.BETA:
                    return `${process.env['PROGRAMFILES']}\\Google\\Chrome Beta\\Application\\chrome.exe`;
                case types_js_1.ChromeReleaseChannel.CANARY:
                    return `${process.env['PROGRAMFILES']}\\Google\\Chrome SxS\\Application\\chrome.exe`;
                case types_js_1.ChromeReleaseChannel.DEV:
                    return `${process.env['PROGRAMFILES']}\\Google\\Chrome Dev\\Application\\chrome.exe`;
            }
        case types_js_1.BrowserPlatform.MAC_ARM:
        case types_js_1.BrowserPlatform.MAC:
            switch (channel) {
                case types_js_1.ChromeReleaseChannel.STABLE:
                    return '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
                case types_js_1.ChromeReleaseChannel.BETA:
                    return '/Applications/Google Chrome Beta.app/Contents/MacOS/Google Chrome Beta';
                case types_js_1.ChromeReleaseChannel.CANARY:
                    return '/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary';
                case types_js_1.ChromeReleaseChannel.DEV:
                    return '/Applications/Google Chrome Dev.app/Contents/MacOS/Google Chrome Dev';
            }
        case types_js_1.BrowserPlatform.LINUX:
            switch (channel) {
                case types_js_1.ChromeReleaseChannel.STABLE:
                    return '/opt/google/chrome/chrome';
                case types_js_1.ChromeReleaseChannel.BETA:
                    return '/opt/google/chrome-beta/chrome';
                case types_js_1.ChromeReleaseChannel.DEV:
                    return '/opt/google/chrome-unstable/chrome';
            }
    }
    throw new Error(`Unable to detect browser executable path for '${channel}' on ${platform}.`);
}
exports.resolveSystemExecutablePath = resolveSystemExecutablePath;
function compareVersions(a, b) {
    if (!semver_1.default.valid(a)) {
        throw new Error(`Version ${a} is not a valid semver version`);
    }
    if (!semver_1.default.valid(b)) {
        throw new Error(`Version ${b} is not a valid semver version`);
    }
    if (semver_1.default.gt(a, b)) {
        return 1;
    }
    else if (semver_1.default.lt(a, b)) {
        return -1;
    }
    else {
        return 0;
    }
}
exports.compareVersions = compareVersions;
//# sourceMappingURL=chrome.js.map