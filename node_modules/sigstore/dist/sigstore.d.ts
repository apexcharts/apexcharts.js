/// <reference types="node" />
import { SerializedBundle } from '@sigstore/bundle';
import * as config from './config';
export declare function sign(payload: Buffer, options?: config.SignOptions): Promise<SerializedBundle>;
export declare function attest(payload: Buffer, payloadType: string, options?: config.SignOptions): Promise<SerializedBundle>;
export declare function verify(bundle: SerializedBundle, options?: config.VerifyOptions): Promise<void>;
export declare function verify(bundle: SerializedBundle, data: Buffer, options?: config.VerifyOptions): Promise<void>;
export interface BundleVerifier {
    verify(bundle: SerializedBundle, data?: Buffer): void;
}
export declare function createVerifier(options?: config.VerifyOptions): Promise<BundleVerifier>;
