/**
 * @license
 * Copyright 2023 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
/// <reference types="node" />
/// <reference types="node" />
import childProcess from 'child_process';
import { type Browser, type BrowserPlatform, type ChromeReleaseChannel } from './browser-data/browser-data.js';
/**
 * @public
 */
export interface ComputeExecutablePathOptions {
    /**
     * Root path to the storage directory.
     */
    cacheDir: string;
    /**
     * Determines which platform the browser will be suited for.
     *
     * @defaultValue **Auto-detected.**
     */
    platform?: BrowserPlatform;
    /**
     * Determines which browser to launch.
     */
    browser: Browser;
    /**
     * Determines which buildId to download. BuildId should uniquely identify
     * binaries and they are used for caching.
     */
    buildId: string;
}
/**
 * @public
 */
export declare function computeExecutablePath(options: ComputeExecutablePathOptions): string;
/**
 * @public
 */
export interface SystemOptions {
    /**
     * Determines which platform the browser will be suited for.
     *
     * @defaultValue **Auto-detected.**
     */
    platform?: BrowserPlatform;
    /**
     * Determines which browser to launch.
     */
    browser: Browser;
    /**
     * Release channel to look for on the system.
     */
    channel: ChromeReleaseChannel;
}
/**
 * @public
 */
export declare function computeSystemExecutablePath(options: SystemOptions): string;
/**
 * @public
 */
export interface LaunchOptions {
    executablePath: string;
    pipe?: boolean;
    dumpio?: boolean;
    args?: string[];
    env?: Record<string, string | undefined>;
    handleSIGINT?: boolean;
    handleSIGTERM?: boolean;
    handleSIGHUP?: boolean;
    detached?: boolean;
    onExit?: () => Promise<void>;
}
/**
 * @public
 */
export declare function launch(opts: LaunchOptions): Process;
/**
 * @public
 */
export declare const CDP_WEBSOCKET_ENDPOINT_REGEX: RegExp;
/**
 * @public
 */
export declare const WEBDRIVER_BIDI_WEBSOCKET_ENDPOINT_REGEX: RegExp;
/**
 * @public
 */
export declare class Process {
    #private;
    constructor(opts: LaunchOptions);
    get nodeProcess(): childProcess.ChildProcess;
    close(): Promise<void>;
    hasClosed(): Promise<void>;
    kill(): void;
    waitForLineOutput(regex: RegExp, timeout?: number): Promise<string>;
}
/**
 * @internal
 */
export interface ErrorLike extends Error {
    name: string;
    message: string;
}
/**
 * @internal
 */
export declare function isErrorLike(obj: unknown): obj is ErrorLike;
/**
 * @internal
 */
export declare function isErrnoException(obj: unknown): obj is NodeJS.ErrnoException;
/**
 * @public
 */
export declare class TimeoutError extends Error {
    /**
     * @internal
     */
    constructor(message?: string);
}
//# sourceMappingURL=launch.d.ts.map