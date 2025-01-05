import { launch } from '@puppeteer/browsers';
import type { Browser, BrowserCloseCallback } from '../api/Browser.js';
import { Connection } from '../cdp/Connection.js';
import type { Product } from '../common/Product.js';
import type { Viewport } from '../common/Viewport.js';
import type { BrowserLaunchArgumentOptions, ChromeReleaseChannel, PuppeteerNodeLaunchOptions } from './LaunchOptions.js';
import type { PuppeteerNode } from './PuppeteerNode.js';
/**
 * @internal
 */
export interface ResolvedLaunchArgs {
    isTempUserDataDir: boolean;
    userDataDir: string;
    executablePath: string;
    args: string[];
}
/**
 * Describes a launcher - a class that is able to create and launch a browser instance.
 *
 * @public
 */
export declare abstract class ProductLauncher {
    #private;
    /**
     * @internal
     */
    puppeteer: PuppeteerNode;
    /**
     * @internal
     */
    protected actualBrowserRevision?: string;
    /**
     * @internal
     */
    constructor(puppeteer: PuppeteerNode, product: Product);
    get product(): Product;
    launch(options?: PuppeteerNodeLaunchOptions): Promise<Browser>;
    abstract executablePath(channel?: ChromeReleaseChannel): string;
    abstract defaultArgs(object: BrowserLaunchArgumentOptions): string[];
    /**
     * Set only for Firefox, after the launcher resolves the `latest` revision to
     * the actual revision.
     * @internal
     */
    getActualBrowserRevision(): string | undefined;
    /**
     * @internal
     */
    protected abstract computeLaunchArguments(options: PuppeteerNodeLaunchOptions): Promise<ResolvedLaunchArgs>;
    /**
     * @internal
     */
    protected abstract cleanUserDataDir(path: string, opts: {
        isTemp: boolean;
    }): Promise<void>;
    /**
     * @internal
     */
    protected closeBrowser(browserProcess: ReturnType<typeof launch>, cdpConnection?: Connection): Promise<void>;
    /**
     * @internal
     */
    protected waitForPageTarget(browser: Browser, timeout: number): Promise<void>;
    /**
     * @internal
     */
    protected createCdpSocketConnection(browserProcess: ReturnType<typeof launch>, opts: {
        timeout: number;
        protocolTimeout: number | undefined;
        slowMo: number;
    }): Promise<Connection>;
    /**
     * @internal
     */
    protected createCdpPipeConnection(browserProcess: ReturnType<typeof launch>, opts: {
        timeout: number;
        protocolTimeout: number | undefined;
        slowMo: number;
    }): Promise<Connection>;
    /**
     * @internal
     */
    protected createBiDiOverCdpBrowser(browserProcess: ReturnType<typeof launch>, connection: Connection, closeCallback: BrowserCloseCallback, opts: {
        timeout: number;
        protocolTimeout: number | undefined;
        slowMo: number;
        defaultViewport: Viewport | null;
        ignoreHTTPSErrors?: boolean;
    }): Promise<Browser>;
    /**
     * @internal
     */
    protected createBiDiBrowser(browserProcess: ReturnType<typeof launch>, closeCallback: BrowserCloseCallback, opts: {
        timeout: number;
        protocolTimeout: number | undefined;
        slowMo: number;
        defaultViewport: Viewport | null;
        ignoreHTTPSErrors?: boolean;
    }): Promise<Browser>;
    /**
     * @internal
     */
    protected getProfilePath(): string;
    /**
     * @internal
     */
    protected resolveExecutablePath(headless?: boolean | 'shell'): string;
}
//# sourceMappingURL=ProductLauncher.d.ts.map