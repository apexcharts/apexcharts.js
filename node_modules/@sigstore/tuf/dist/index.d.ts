import { TrustedRoot } from '@sigstore/protobuf-specs';
import { TUFOptions as RequiredTUFOptions, TUF } from './client';
export declare const DEFAULT_MIRROR_URL = "https://tuf-repo-cdn.sigstore.dev";
export type TUFOptions = Partial<RequiredTUFOptions> & {
    force?: boolean;
};
export declare function getTrustedRoot(options?: TUFOptions): Promise<TrustedRoot>;
export declare function initTUF(options?: TUFOptions): Promise<TUF>;
export type { TUF } from './client';
export { TUFError } from './error';
