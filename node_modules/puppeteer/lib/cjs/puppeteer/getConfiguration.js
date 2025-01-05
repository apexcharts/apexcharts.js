"use strict";
/**
 * @license
 * Copyright 2023 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getConfiguration = void 0;
const os_1 = require("os");
const path_1 = require("path");
const cosmiconfig_1 = require("cosmiconfig");
function getBooleanEnvVar(name) {
    const env = process.env[name];
    if (env === undefined) {
        return;
    }
    switch (env.toLowerCase()) {
        case '':
        case '0':
        case 'false':
        case 'off':
            return false;
        default:
            return true;
    }
}
/**
 * @internal
 */
function isSupportedProduct(product) {
    switch (product) {
        case 'chrome':
        case 'firefox':
            return true;
        default:
            return false;
    }
}
/**
 * @internal
 */
const getConfiguration = () => {
    const result = (0, cosmiconfig_1.cosmiconfigSync)('puppeteer', {
        searchStrategy: 'global',
    }).search();
    const configuration = result ? result.config : {};
    configuration.logLevel = (process.env['PUPPETEER_LOGLEVEL'] ??
        process.env['npm_config_LOGLEVEL'] ??
        process.env['npm_package_config_LOGLEVEL'] ??
        configuration.logLevel ??
        'warn');
    // Merging environment variables.
    configuration.defaultProduct = (process.env['PUPPETEER_PRODUCT'] ??
        process.env['npm_config_puppeteer_product'] ??
        process.env['npm_package_config_puppeteer_product'] ??
        configuration.defaultProduct ??
        'chrome');
    configuration.executablePath =
        process.env['PUPPETEER_EXECUTABLE_PATH'] ??
            process.env['npm_config_puppeteer_executable_path'] ??
            process.env['npm_package_config_puppeteer_executable_path'] ??
            configuration.executablePath;
    // Default to skipDownload if executablePath is set
    if (configuration.executablePath) {
        configuration.skipDownload = true;
    }
    // Set skipDownload explicitly or from default
    configuration.skipDownload = Boolean(getBooleanEnvVar('PUPPETEER_SKIP_DOWNLOAD') ??
        getBooleanEnvVar('npm_config_puppeteer_skip_download') ??
        getBooleanEnvVar('npm_package_config_puppeteer_skip_download') ??
        configuration.skipDownload);
    // Set skipChromeDownload explicitly or from default
    configuration.skipChromeDownload = Boolean(getBooleanEnvVar('PUPPETEER_SKIP_CHROME_DOWNLOAD') ??
        getBooleanEnvVar('npm_config_puppeteer_skip_chrome_download') ??
        getBooleanEnvVar('npm_package_config_puppeteer_skip_chrome_download') ??
        configuration.skipChromeDownload);
    // Set skipChromeDownload explicitly or from default
    configuration.skipChromeHeadlessShellDownload = Boolean(getBooleanEnvVar('PUPPETEER_SKIP_CHROME_HEADLESS_SHELL_DOWNLOAD') ??
        getBooleanEnvVar('npm_config_puppeteer_skip_chrome_headless_shell_download') ??
        getBooleanEnvVar('npm_package_config_puppeteer_skip_chrome_headless_shell_download') ??
        configuration.skipChromeHeadlessShellDownload);
    // Prepare variables used in browser downloading
    if (!configuration.skipDownload) {
        configuration.browserRevision =
            process.env['PUPPETEER_BROWSER_REVISION'] ??
                process.env['npm_config_puppeteer_browser_revision'] ??
                process.env['npm_package_config_puppeteer_browser_revision'] ??
                configuration.browserRevision;
        const downloadHost = process.env['PUPPETEER_DOWNLOAD_HOST'] ??
            process.env['npm_config_puppeteer_download_host'] ??
            process.env['npm_package_config_puppeteer_download_host'];
        if (downloadHost && configuration.logLevel === 'warn') {
            console.warn(`PUPPETEER_DOWNLOAD_HOST is deprecated. Use PUPPETEER_DOWNLOAD_BASE_URL instead.`);
        }
        configuration.downloadBaseUrl =
            process.env['PUPPETEER_DOWNLOAD_BASE_URL'] ??
                process.env['npm_config_puppeteer_download_base_url'] ??
                process.env['npm_package_config_puppeteer_download_base_url'] ??
                configuration.downloadBaseUrl ??
                downloadHost;
    }
    if (Object.keys(process.env).some(key => {
        return key.startsWith('npm_package_config_puppeteer_');
    }) &&
        configuration.logLevel === 'warn') {
        console.warn(`Configuring Puppeteer via npm/package.json is deprecated. Use https://pptr.dev/guides/configuration instead.`);
    }
    configuration.cacheDirectory =
        process.env['PUPPETEER_CACHE_DIR'] ??
            process.env['npm_config_puppeteer_cache_dir'] ??
            process.env['npm_package_config_puppeteer_cache_dir'] ??
            configuration.cacheDirectory ??
            (0, path_1.join)((0, os_1.homedir)(), '.cache', 'puppeteer');
    configuration.temporaryDirectory =
        process.env['PUPPETEER_TMP_DIR'] ??
            process.env['npm_config_puppeteer_tmp_dir'] ??
            process.env['npm_package_config_puppeteer_tmp_dir'] ??
            configuration.temporaryDirectory;
    configuration.experiments ??= {};
    // Validate configuration.
    if (!isSupportedProduct(configuration.defaultProduct)) {
        throw new Error(`Unsupported product ${configuration.defaultProduct}`);
    }
    return configuration;
};
exports.getConfiguration = getConfiguration;
//# sourceMappingURL=getConfiguration.js.map