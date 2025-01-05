"use strict";
/**
 * @license
 * Copyright 2017 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.canDownload = exports.getInstalledBrowsers = exports.uninstall = exports.install = void 0;
const assert_1 = __importDefault(require("assert"));
const fs_1 = require("fs");
const promises_1 = require("fs/promises");
const os_1 = __importDefault(require("os"));
const path_1 = __importDefault(require("path"));
const browser_data_js_1 = require("./browser-data/browser-data.js");
const Cache_js_1 = require("./Cache.js");
const debug_js_1 = require("./debug.js");
const detectPlatform_js_1 = require("./detectPlatform.js");
const fileUtil_js_1 = require("./fileUtil.js");
const httpUtil_js_1 = require("./httpUtil.js");
const debugInstall = (0, debug_js_1.debug)('puppeteer:browsers:install');
const times = new Map();
function debugTime(label) {
    times.set(label, process.hrtime());
}
function debugTimeEnd(label) {
    const end = process.hrtime();
    const start = times.get(label);
    if (!start) {
        return;
    }
    const duration = end[0] * 1000 + end[1] / 1e6 - (start[0] * 1000 + start[1] / 1e6); // calculate duration in milliseconds
    debugInstall(`Duration for ${label}: ${duration}ms`);
}
async function install(options) {
    options.platform ??= (0, detectPlatform_js_1.detectBrowserPlatform)();
    options.unpack ??= true;
    if (!options.platform) {
        throw new Error(`Cannot download a binary for the provided platform: ${os_1.default.platform()} (${os_1.default.arch()})`);
    }
    const url = getDownloadUrl(options.browser, options.platform, options.buildId, options.baseUrl);
    try {
        return await installUrl(url, options);
    }
    catch (err) {
        // If custom baseUrl is provided, do not fall back to CfT dashboard.
        if (options.baseUrl && !options.forceFallbackForTesting) {
            throw err;
        }
        debugInstall(`Error downloading from ${url}.`);
        switch (options.browser) {
            case browser_data_js_1.Browser.CHROME:
            case browser_data_js_1.Browser.CHROMEDRIVER:
            case browser_data_js_1.Browser.CHROMEHEADLESSSHELL: {
                debugInstall(`Trying to find download URL via https://googlechromelabs.github.io/chrome-for-testing.`);
                const version = (await (0, httpUtil_js_1.getJSON)(new URL(`https://googlechromelabs.github.io/chrome-for-testing/${options.buildId}.json`)));
                let platform = '';
                switch (options.platform) {
                    case browser_data_js_1.BrowserPlatform.LINUX:
                        platform = 'linux64';
                        break;
                    case browser_data_js_1.BrowserPlatform.MAC_ARM:
                        platform = 'mac-arm64';
                        break;
                    case browser_data_js_1.BrowserPlatform.MAC:
                        platform = 'mac-x64';
                        break;
                    case browser_data_js_1.BrowserPlatform.WIN32:
                        platform = 'win32';
                        break;
                    case browser_data_js_1.BrowserPlatform.WIN64:
                        platform = 'win64';
                        break;
                }
                const url = version.downloads[options.browser]?.find(link => {
                    return link['platform'] === platform;
                })?.url;
                if (url) {
                    debugInstall(`Falling back to downloading from ${url}.`);
                    return await installUrl(new URL(url), options);
                }
                throw err;
            }
            default:
                throw err;
        }
    }
}
exports.install = install;
async function installUrl(url, options) {
    options.platform ??= (0, detectPlatform_js_1.detectBrowserPlatform)();
    if (!options.platform) {
        throw new Error(`Cannot download a binary for the provided platform: ${os_1.default.platform()} (${os_1.default.arch()})`);
    }
    const fileName = url.toString().split('/').pop();
    (0, assert_1.default)(fileName, `A malformed download URL was found: ${url}.`);
    const cache = new Cache_js_1.Cache(options.cacheDir);
    const browserRoot = cache.browserRoot(options.browser);
    const archivePath = path_1.default.join(browserRoot, `${options.buildId}-${fileName}`);
    if (!(0, fs_1.existsSync)(browserRoot)) {
        await (0, promises_1.mkdir)(browserRoot, { recursive: true });
    }
    if (!options.unpack) {
        if ((0, fs_1.existsSync)(archivePath)) {
            return archivePath;
        }
        debugInstall(`Downloading binary from ${url}`);
        debugTime('download');
        await (0, httpUtil_js_1.downloadFile)(url, archivePath, options.downloadProgressCallback);
        debugTimeEnd('download');
        return archivePath;
    }
    const outputPath = cache.installationDir(options.browser, options.platform, options.buildId);
    try {
        if ((0, fs_1.existsSync)(outputPath)) {
            const installedBrowser = new Cache_js_1.InstalledBrowser(cache, options.browser, options.buildId, options.platform);
            if (!(0, fs_1.existsSync)(installedBrowser.executablePath)) {
                throw new Error(`The browser folder (${outputPath}) exists but the executable (${installedBrowser.executablePath}) is missing`);
            }
            return installedBrowser;
        }
        debugInstall(`Downloading binary from ${url}`);
        try {
            debugTime('download');
            await (0, httpUtil_js_1.downloadFile)(url, archivePath, options.downloadProgressCallback);
        }
        finally {
            debugTimeEnd('download');
        }
        debugInstall(`Installing ${archivePath} to ${outputPath}`);
        try {
            debugTime('extract');
            await (0, fileUtil_js_1.unpackArchive)(archivePath, outputPath);
        }
        finally {
            debugTimeEnd('extract');
        }
        const installedBrowser = new Cache_js_1.InstalledBrowser(cache, options.browser, options.buildId, options.platform);
        if (options.buildIdAlias) {
            const metadata = installedBrowser.readMetadata();
            metadata.aliases[options.buildIdAlias] = options.buildId;
            installedBrowser.writeMetadata(metadata);
        }
        return installedBrowser;
    }
    finally {
        if ((0, fs_1.existsSync)(archivePath)) {
            await (0, promises_1.unlink)(archivePath);
        }
    }
}
/**
 *
 * @public
 */
async function uninstall(options) {
    options.platform ??= (0, detectPlatform_js_1.detectBrowserPlatform)();
    if (!options.platform) {
        throw new Error(`Cannot detect the browser platform for: ${os_1.default.platform()} (${os_1.default.arch()})`);
    }
    new Cache_js_1.Cache(options.cacheDir).uninstall(options.browser, options.platform, options.buildId);
}
exports.uninstall = uninstall;
/**
 * Returns metadata about browsers installed in the cache directory.
 *
 * @public
 */
async function getInstalledBrowsers(options) {
    return new Cache_js_1.Cache(options.cacheDir).getInstalledBrowsers();
}
exports.getInstalledBrowsers = getInstalledBrowsers;
/**
 * @public
 */
async function canDownload(options) {
    options.platform ??= (0, detectPlatform_js_1.detectBrowserPlatform)();
    if (!options.platform) {
        throw new Error(`Cannot download a binary for the provided platform: ${os_1.default.platform()} (${os_1.default.arch()})`);
    }
    return await (0, httpUtil_js_1.headHttpRequest)(getDownloadUrl(options.browser, options.platform, options.buildId, options.baseUrl));
}
exports.canDownload = canDownload;
function getDownloadUrl(browser, platform, buildId, baseUrl) {
    return new URL(browser_data_js_1.downloadUrls[browser](platform, buildId, baseUrl));
}
//# sourceMappingURL=install.js.map