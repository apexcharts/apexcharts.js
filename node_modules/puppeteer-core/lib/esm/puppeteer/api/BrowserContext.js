/**
 * @license
 * Copyright 2017 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
import { firstValueFrom, from, merge, raceWith, } from '../../third_party/rxjs/rxjs.js';
import { EventEmitter } from '../common/EventEmitter.js';
import { debugError, fromEmitterEvent, filterAsync, timeout, } from '../common/util.js';
import { asyncDisposeSymbol, disposeSymbol } from '../util/disposable.js';
/**
 * {@link BrowserContext} represents individual user contexts within a
 * {@link Browser | browser}.
 *
 * When a {@link Browser | browser} is launched, it has a single
 * {@link BrowserContext | browser context} by default. Others can be created
 * using {@link Browser.createBrowserContext}. Each context has isolated storage
 * (cookies/localStorage/etc.)
 *
 * {@link BrowserContext} {@link EventEmitter | emits} various events which are
 * documented in the {@link BrowserContextEvent} enum.
 *
 * If a {@link Page | page} opens another {@link Page | page}, e.g. using
 * `window.open`, the popup will belong to the parent {@link Page.browserContext
 * | page's browser context}.
 *
 * @example Creating a new {@link BrowserContext | browser context}:
 *
 * ```ts
 * // Create a new browser context
 * const context = await browser.createBrowserContext();
 * // Create a new page inside context.
 * const page = await context.newPage();
 * // ... do stuff with page ...
 * await page.goto('https://example.com');
 * // Dispose context once it's no longer needed.
 * await context.close();
 * ```
 *
 * @public
 */
export class BrowserContext extends EventEmitter {
    /**
     * @internal
     */
    constructor() {
        super();
    }
    /**
     * Waits until a {@link Target | target} matching the given `predicate`
     * appears and returns it.
     *
     * This will look all open {@link BrowserContext | browser contexts}.
     *
     * @example Finding a target for a page opened via `window.open`:
     *
     * ```ts
     * await page.evaluate(() => window.open('https://www.example.com/'));
     * const newWindowTarget = await browserContext.waitForTarget(
     *   target => target.url() === 'https://www.example.com/'
     * );
     * ```
     */
    async waitForTarget(predicate, options = {}) {
        const { timeout: ms = 30000 } = options;
        return await firstValueFrom(merge(fromEmitterEvent(this, "targetcreated" /* BrowserContextEvent.TargetCreated */), fromEmitterEvent(this, "targetchanged" /* BrowserContextEvent.TargetChanged */), from(this.targets())).pipe(filterAsync(predicate), raceWith(timeout(ms))));
    }
    /**
     * Whether this {@link BrowserContext | browser context} is closed.
     */
    get closed() {
        return !this.browser().browserContexts().includes(this);
    }
    /**
     * Identifier for this {@link BrowserContext | browser context}.
     */
    get id() {
        return undefined;
    }
    /** @internal */
    [disposeSymbol]() {
        return void this.close().catch(debugError);
    }
    /** @internal */
    [asyncDisposeSymbol]() {
        return this.close();
    }
}
//# sourceMappingURL=BrowserContext.js.map