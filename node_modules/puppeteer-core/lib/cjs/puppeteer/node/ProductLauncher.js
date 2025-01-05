"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductLauncher = void 0;
/**
 * @license
 * Copyright 2017 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
const fs_1 = require("fs");
const os_1 = require("os");
const path_1 = require("path");
const browsers_1 = require("@puppeteer/browsers");
const rxjs_js_1 = require("../../third_party/rxjs/rxjs.js");
const Browser_js_1 = require("../cdp/Browser.js");
const Connection_js_1 = require("../cdp/Connection.js");
const Errors_js_1 = require("../common/Errors.js");
const util_js_1 = require("../common/util.js");
const NodeWebSocketTransport_js_1 = require("./NodeWebSocketTransport.js");
const PipeTransport_js_1 = require("./PipeTransport.js");
/**
 * Describes a launcher - a class that is able to create and launch a browser instance.
 *
 * @public
 */
class ProductLauncher {
    #product;
    /**
     * @internal
     */
    puppeteer;
    /**
     * @internal
     */
    actualBrowserRevision;
    /**
     * @internal
     */
    constructor(puppeteer, product) {
        this.puppeteer = puppeteer;
        this.#product = product;
    }
    get product() {
        return this.#product;
    }
    async launch(options = {}) {
        const { dumpio = false, env = process.env, handleSIGINT = true, handleSIGTERM = true, handleSIGHUP = true, ignoreHTTPSErrors = false, defaultViewport = util_js_1.DEFAULT_VIEWPORT, slowMo = 0, timeout = 30000, waitForInitialPage = true, protocolTimeout, protocol, } = options;
        const launchArgs = await this.computeLaunchArguments(options);
        if (!(0, fs_1.existsSync)(launchArgs.executablePath)) {
            throw new Error(`Browser was not found at the configured executablePath (${launchArgs.executablePath})`);
        }
        const usePipe = launchArgs.args.includes('--remote-debugging-pipe');
        const onProcessExit = async () => {
            await this.cleanUserDataDir(launchArgs.userDataDir, {
                isTemp: launchArgs.isTempUserDataDir,
            });
        };
        if (this.#product === 'firefox' &&
            protocol !== 'webDriverBiDi' &&
            this.puppeteer.configuration.logLevel === 'warn') {
            console.warn(`Chrome DevTools Protocol (CDP) support for Firefox is deprecated in Puppeteer ` +
                `and it will be eventually removed. ` +
                `Use WebDriver BiDi instead (see https://pptr.dev/webdriver-bidi#get-started).`);
        }
        const browserProcess = (0, browsers_1.launch)({
            executablePath: launchArgs.executablePath,
            args: launchArgs.args,
            handleSIGHUP,
            handleSIGTERM,
            handleSIGINT,
            dumpio,
            env,
            pipe: usePipe,
            onExit: onProcessExit,
        });
        let browser;
        let cdpConnection;
        let closing = false;
        const browserCloseCallback = async () => {
            if (closing) {
                return;
            }
            closing = true;
            await this.closeBrowser(browserProcess, cdpConnection);
        };
        try {
            if (this.#product === 'firefox' && protocol === 'webDriverBiDi') {
                browser = await this.createBiDiBrowser(browserProcess, browserCloseCallback, {
                    timeout,
                    protocolTimeout,
                    slowMo,
                    defaultViewport,
                    ignoreHTTPSErrors,
                });
            }
            else {
                if (usePipe) {
                    cdpConnection = await this.createCdpPipeConnection(browserProcess, {
                        timeout,
                        protocolTimeout,
                        slowMo,
                    });
                }
                else {
                    cdpConnection = await this.createCdpSocketConnection(browserProcess, {
                        timeout,
                        protocolTimeout,
                        slowMo,
                    });
                }
                if (protocol === 'webDriverBiDi') {
                    browser = await this.createBiDiOverCdpBrowser(browserProcess, cdpConnection, browserCloseCallback, {
                        timeout,
                        protocolTimeout,
                        slowMo,
                        defaultViewport,
                        ignoreHTTPSErrors,
                    });
                }
                else {
                    browser = await Browser_js_1.CdpBrowser._create(this.product, cdpConnection, [], ignoreHTTPSErrors, defaultViewport, browserProcess.nodeProcess, browserCloseCallback, options.targetFilter);
                }
            }
        }
        catch (error) {
            void browserCloseCallback();
            if (error instanceof browsers_1.TimeoutError) {
                throw new Errors_js_1.TimeoutError(error.message);
            }
            throw error;
        }
        if (waitForInitialPage && protocol !== 'webDriverBiDi') {
            await this.waitForPageTarget(browser, timeout);
        }
        return browser;
    }
    /**
     * Set only for Firefox, after the launcher resolves the `latest` revision to
     * the actual revision.
     * @internal
     */
    getActualBrowserRevision() {
        return this.actualBrowserRevision;
    }
    /**
     * @internal
     */
    async closeBrowser(browserProcess, cdpConnection) {
        if (cdpConnection) {
            // Attempt to close the browser gracefully
            try {
                await cdpConnection.closeBrowser();
                await browserProcess.hasClosed();
            }
            catch (error) {
                (0, util_js_1.debugError)(error);
                await browserProcess.close();
            }
        }
        else {
            // Wait for a possible graceful shutdown.
            await (0, rxjs_js_1.firstValueFrom)((0, rxjs_js_1.race)((0, rxjs_js_1.from)(browserProcess.hasClosed()), (0, rxjs_js_1.timer)(5000).pipe((0, rxjs_js_1.map)(() => {
                return (0, rxjs_js_1.from)(browserProcess.close());
            }))));
        }
    }
    /**
     * @internal
     */
    async waitForPageTarget(browser, timeout) {
        try {
            await browser.waitForTarget(t => {
                return t.type() === 'page';
            }, { timeout });
        }
        catch (error) {
            await browser.close();
            throw error;
        }
    }
    /**
     * @internal
     */
    async createCdpSocketConnection(browserProcess, opts) {
        const browserWSEndpoint = await browserProcess.waitForLineOutput(browsers_1.CDP_WEBSOCKET_ENDPOINT_REGEX, opts.timeout);
        const transport = await NodeWebSocketTransport_js_1.NodeWebSocketTransport.create(browserWSEndpoint);
        return new Connection_js_1.Connection(browserWSEndpoint, transport, opts.slowMo, opts.protocolTimeout);
    }
    /**
     * @internal
     */
    async createCdpPipeConnection(browserProcess, opts) {
        // stdio was assigned during start(), and the 'pipe' option there adds the
        // 4th and 5th items to stdio array
        const { 3: pipeWrite, 4: pipeRead } = browserProcess.nodeProcess.stdio;
        const transport = new PipeTransport_js_1.PipeTransport(pipeWrite, pipeRead);
        return new Connection_js_1.Connection('', transport, opts.slowMo, opts.protocolTimeout);
    }
    /**
     * @internal
     */
    async createBiDiOverCdpBrowser(browserProcess, connection, closeCallback, opts) {
        // TODO: use other options too.
        const BiDi = await Promise.resolve().then(() => __importStar(require(/* webpackIgnore: true */ '../bidi/bidi.js')));
        const bidiConnection = await BiDi.connectBidiOverCdp(connection, {
            acceptInsecureCerts: opts.ignoreHTTPSErrors ?? false,
        });
        return await BiDi.BidiBrowser.create({
            connection: bidiConnection,
            closeCallback,
            process: browserProcess.nodeProcess,
            defaultViewport: opts.defaultViewport,
            ignoreHTTPSErrors: opts.ignoreHTTPSErrors,
        });
    }
    /**
     * @internal
     */
    async createBiDiBrowser(browserProcess, closeCallback, opts) {
        const browserWSEndpoint = (await browserProcess.waitForLineOutput(browsers_1.WEBDRIVER_BIDI_WEBSOCKET_ENDPOINT_REGEX, opts.timeout)) + '/session';
        const transport = await NodeWebSocketTransport_js_1.NodeWebSocketTransport.create(browserWSEndpoint);
        const BiDi = await Promise.resolve().then(() => __importStar(require(/* webpackIgnore: true */ '../bidi/bidi.js')));
        const bidiConnection = new BiDi.BidiConnection(browserWSEndpoint, transport, opts.slowMo, opts.protocolTimeout);
        // TODO: use other options too.
        return await BiDi.BidiBrowser.create({
            connection: bidiConnection,
            closeCallback,
            process: browserProcess.nodeProcess,
            defaultViewport: opts.defaultViewport,
            ignoreHTTPSErrors: opts.ignoreHTTPSErrors,
        });
    }
    /**
     * @internal
     */
    getProfilePath() {
        return (0, path_1.join)(this.puppeteer.configuration.temporaryDirectory ?? (0, os_1.tmpdir)(), `puppeteer_dev_${this.product}_profile-`);
    }
    /**
     * @internal
     */
    resolveExecutablePath(headless) {
        let executablePath = this.puppeteer.configuration.executablePath;
        if (executablePath) {
            if (!(0, fs_1.existsSync)(executablePath)) {
                throw new Error(`Tried to find the browser at the configured path (${executablePath}), but no executable was found.`);
            }
            return executablePath;
        }
        function productToBrowser(product, headless) {
            switch (product) {
                case 'chrome':
                    if (headless === 'shell') {
                        return browsers_1.Browser.CHROMEHEADLESSSHELL;
                    }
                    return browsers_1.Browser.CHROME;
                case 'firefox':
                    return browsers_1.Browser.FIREFOX;
            }
            return browsers_1.Browser.CHROME;
        }
        executablePath = (0, browsers_1.computeExecutablePath)({
            cacheDir: this.puppeteer.defaultDownloadPath,
            browser: productToBrowser(this.product, headless),
            buildId: this.puppeteer.browserRevision,
        });
        if (!(0, fs_1.existsSync)(executablePath)) {
            if (this.puppeteer.configuration.browserRevision) {
                throw new Error(`Tried to find the browser at the configured path (${executablePath}) for revision ${this.puppeteer.browserRevision}, but no executable was found.`);
            }
            switch (this.product) {
                case 'chrome':
                    throw new Error(`Could not find Chrome (ver. ${this.puppeteer.browserRevision}). This can occur if either\n` +
                        ' 1. you did not perform an installation before running the script (e.g. `npx puppeteer browsers install chrome`) or\n' +
                        ` 2. your cache path is incorrectly configured (which is: ${this.puppeteer.configuration.cacheDirectory}).\n` +
                        'For (2), check out our guide on configuring puppeteer at https://pptr.dev/guides/configuration.');
                case 'firefox':
                    throw new Error(`Could not find Firefox (rev. ${this.puppeteer.browserRevision}). This can occur if either\n` +
                        ' 1. you did not perform an installation for Firefox before running the script (e.g. `npx puppeteer browsers install firefox`) or\n' +
                        ` 2. your cache path is incorrectly configured (which is: ${this.puppeteer.configuration.cacheDirectory}).\n` +
                        'For (2), check out our guide on configuring puppeteer at https://pptr.dev/guides/configuration.');
            }
        }
        return executablePath;
    }
}
exports.ProductLauncher = ProductLauncher;
//# sourceMappingURL=ProductLauncher.js.map