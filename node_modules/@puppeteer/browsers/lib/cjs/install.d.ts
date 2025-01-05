/**
 * @license
 * Copyright 2017 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
import { Browser, BrowserPlatform } from './browser-data/browser-data.js';
import { InstalledBrowser } from './Cache.js';
/**
 * @public
 */
export interface InstallOptions {
    /**
     * Determines the path to download browsers to.
     */
    cacheDir: string;
    /**
     * Determines which platform the browser will be suited for.
     *
     * @defaultValue **Auto-detected.**
     */
    platform?: BrowserPlatform;
    /**
     * Determines which browser to install.
     */
    browser: Browser;
    /**
     * Determines which buildId to download. BuildId should uniquely identify
     * binaries and they are used for caching.
     */
    buildId: string;
    /**
     * An alias for the provided `buildId`. It will be used to maintain local
     * metadata to support aliases in the `launch` command.
     *
     * @example 'canary'
     */
    buildIdAlias?: string;
    /**
     * Provides information about the progress of the download.
     */
    downloadProgressCallback?: (downloadedBytes: number, totalBytes: number) => void;
    /**
     * Determines the host that will be used for downloading.
     *
     * @defaultValue Either
     *
     * - https://storage.googleapis.com/chrome-for-testing-public or
     * - https://archive.mozilla.org/pub/firefox/nightly/latest-mozilla-central
     *
     */
    baseUrl?: string;
    /**
     * Whether to unpack and install browser archives.
     *
     * @defaultValue `true`
     */
    unpack?: boolean;
    /**
     * @internal
     * @defaultValue `false`
     */
    forceFallbackForTesting?: boolean;
}
/**
 * @public
 */
export declare function install(options: InstallOptions & {
    unpack?: true;
}): Promise<InstalledBrowser>;
/**
 * @public
 */
export declare function install(options: InstallOptions & {
    unpack: false;
}): Promise<string>;
/**
 * @public
 */
export interface UninstallOptions {
    /**
     * Determines the platform for the browser binary.
     *
     * @defaultValue **Auto-detected.**
     */
    platform?: BrowserPlatform;
    /**
     * The path to the root of the cache directory.
     */
    cacheDir: string;
    /**
     * Determines which browser to uninstall.
     */
    browser: Browser;
    /**
     * The browser build to uninstall
     */
    buildId: string;
}
/**
 *
 * @public
 */
export declare function uninstall(options: UninstallOptions): Promise<void>;
/**
 * @public
 */
export interface GetInstalledBrowsersOptions {
    /**
     * The path to the root of the cache directory.
     */
    cacheDir: string;
}
/**
 * Returns metadata about browsers installed in the cache directory.
 *
 * @public
 */
export declare function getInstalledBrowsers(options: GetInstalledBrowsersOptions): Promise<InstalledBrowser[]>;
/**
 * @public
 */
export declare function canDownload(options: InstallOptions): Promise<boolean>;
//# sourceMappingURL=install.d.ts.map