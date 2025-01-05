/**
 * @license
 * Copyright 2022 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
/// <reference types="node" />
import type Protocol from 'devtools-protocol';
import type { CDPSession } from '../api/CDPSession.js';
import type { WaitForOptions } from '../api/Frame.js';
import type { HTTPResponse } from '../api/HTTPResponse.js';
import type { Credentials, GeolocationOptions, MediaFeature, PageEvents } from '../api/Page.js';
import { Page, type NewDocumentScriptEvaluation, type ScreenshotOptions } from '../api/Page.js';
import { Coverage } from '../cdp/Coverage.js';
import type { NetworkConditions } from '../cdp/NetworkManager.js';
import { Tracing } from '../cdp/Tracing.js';
import type { Cookie, CookieParam, DeleteCookiesRequest } from '../common/Cookie.js';
import { EventEmitter } from '../common/EventEmitter.js';
import type { PDFOptions } from '../common/PDFOptions.js';
import type { Awaitable } from '../common/types.js';
import type { Viewport } from '../common/Viewport.js';
import type { BidiBrowser } from './Browser.js';
import type { BidiBrowserContext } from './BrowserContext.js';
import type { BidiCdpSession } from './CDPSession.js';
import type { BrowsingContext } from './core/BrowsingContext.js';
import { BidiFrame } from './Frame.js';
import type { BidiHTTPResponse } from './HTTPResponse.js';
import { BidiKeyboard, BidiMouse, BidiTouchscreen } from './Input.js';
import type { BidiJSHandle } from './JSHandle.js';
import type { BidiWebWorker } from './WebWorker.js';
/**
 * Implements Page using WebDriver BiDi.
 *
 * @internal
 */
export declare class BidiPage extends Page {
    #private;
    static from(browserContext: BidiBrowserContext, browsingContext: BrowsingContext): BidiPage;
    accessor trustedEmitter: EventEmitter<PageEvents>;
    readonly keyboard: BidiKeyboard;
    readonly mouse: BidiMouse;
    readonly touchscreen: BidiTouchscreen;
    readonly tracing: Tracing;
    readonly coverage: Coverage;
    _client(): BidiCdpSession;
    private constructor();
    /**
     * @internal
     */
    _userAgentHeaders: Record<string, string>;
    setUserAgent(userAgent: string, userAgentMetadata?: Protocol.Emulation.UserAgentMetadata): Promise<void>;
    setBypassCSP(enabled: boolean): Promise<void>;
    queryObjects<Prototype>(prototypeHandle: BidiJSHandle<Prototype>): Promise<BidiJSHandle<Prototype[]>>;
    browser(): BidiBrowser;
    browserContext(): BidiBrowserContext;
    mainFrame(): BidiFrame;
    focusedFrame(): Promise<BidiFrame>;
    frames(): BidiFrame[];
    isClosed(): boolean;
    close(options?: {
        runBeforeUnload?: boolean;
    }): Promise<void>;
    reload(options?: WaitForOptions): Promise<BidiHTTPResponse | null>;
    setDefaultNavigationTimeout(timeout: number): void;
    setDefaultTimeout(timeout: number): void;
    getDefaultTimeout(): number;
    isJavaScriptEnabled(): boolean;
    setGeolocation(options: GeolocationOptions): Promise<void>;
    setJavaScriptEnabled(enabled: boolean): Promise<void>;
    emulateMediaType(type?: string): Promise<void>;
    emulateCPUThrottling(factor: number | null): Promise<void>;
    emulateMediaFeatures(features?: MediaFeature[]): Promise<void>;
    emulateTimezone(timezoneId?: string): Promise<void>;
    emulateIdleState(overrides?: {
        isUserActive: boolean;
        isScreenUnlocked: boolean;
    }): Promise<void>;
    emulateVisionDeficiency(type?: Protocol.Emulation.SetEmulatedVisionDeficiencyRequest['type']): Promise<void>;
    setViewport(viewport: Viewport | null): Promise<void>;
    viewport(): Viewport | null;
    pdf(options?: PDFOptions): Promise<Buffer>;
    createPDFStream(options?: PDFOptions | undefined): Promise<ReadableStream<Uint8Array>>;
    _screenshot(options: Readonly<ScreenshotOptions>): Promise<string>;
    createCDPSession(): Promise<CDPSession>;
    bringToFront(): Promise<void>;
    evaluateOnNewDocument<Params extends unknown[], Func extends (...args: Params) => unknown = (...args: Params) => unknown>(pageFunction: Func | string, ...args: Params): Promise<NewDocumentScriptEvaluation>;
    removeScriptToEvaluateOnNewDocument(id: string): Promise<void>;
    exposeFunction<Args extends unknown[], Ret>(name: string, pptrFunction: ((...args: Args) => Awaitable<Ret>) | {
        default: (...args: Args) => Awaitable<Ret>;
    }): Promise<void>;
    isDragInterceptionEnabled(): boolean;
    setCacheEnabled(enabled?: boolean): Promise<void>;
    cookies(...urls: string[]): Promise<Cookie[]>;
    isServiceWorkerBypassed(): never;
    target(): never;
    waitForFileChooser(): never;
    workers(): BidiWebWorker[];
    setRequestInterception(enable: boolean): Promise<void>;
    /**
     * @internal
     */
    _extraHTTPHeaders: Record<string, string>;
    setExtraHTTPHeaders(headers: Record<string, string>): Promise<void>;
    /**
     * @internal
     */
    _credentials: Credentials | null;
    authenticate(credentials: Credentials | null): Promise<void>;
    setDragInterception(): never;
    setBypassServiceWorker(): never;
    setOfflineMode(enabled: boolean): Promise<void>;
    emulateNetworkConditions(networkConditions: NetworkConditions | null): Promise<void>;
    setCookie(...cookies: CookieParam[]): Promise<void>;
    deleteCookie(...cookies: DeleteCookiesRequest[]): Promise<void>;
    removeExposedFunction(name: string): Promise<void>;
    metrics(): never;
    goBack(options?: WaitForOptions): Promise<HTTPResponse | null>;
    goForward(options?: WaitForOptions): Promise<HTTPResponse | null>;
    waitForDevicePrompt(): never;
}
//# sourceMappingURL=Page.d.ts.map