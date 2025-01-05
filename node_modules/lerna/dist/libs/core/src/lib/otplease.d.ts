export interface OneTimePasswordCache {
    otp: string | null;
}
/**
 * Attempt to execute Promise callback, prompting for OTP if necessary.
 * @template {Record<string, unknown>} T
 * @param {(opts: T) => Promise<unknown>} fn
 * @param {T} _opts The options to be passed to `fn`
 * @param {OneTimePasswordCache} otpCache
 */
export declare function otplease<T extends Record<string, unknown>>(fn: (opts: T) => Promise<unknown>, _opts: T, otpCache?: OneTimePasswordCache | null): Promise<unknown>;
/**
 * Prompt user for one-time password.
 */
export declare function getOneTimePassword(message?: string): Promise<string>;
