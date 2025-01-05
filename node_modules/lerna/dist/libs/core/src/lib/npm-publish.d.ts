import { FetchOptions } from "npm-registry-fetch";
import { OneTimePasswordCache } from "./otplease";
import { Package } from "./package";
interface NpmPublishOptions {
    dryRun?: boolean;
    ["dry-run"]?: boolean;
    ["strict-ssl"]?: boolean;
    tag?: string;
}
interface LibNpmPublishOptions extends FetchOptions {
    access?: "public" | "restricted";
    defaultTag?: string;
}
/**
 * Publish a package to the configured registry.
 */
export declare function npmPublish(pkg: Package, tarFilePath: string, options?: LibNpmPublishOptions & NpmPublishOptions, otpCache?: OneTimePasswordCache): Promise<void | Response>;
export {};
