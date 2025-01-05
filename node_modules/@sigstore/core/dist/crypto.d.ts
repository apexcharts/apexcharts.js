/// <reference types="node" />
/// <reference types="node" />
import crypto, { BinaryLike } from 'crypto';
export type { KeyObject } from 'crypto';
export declare function createPublicKey(key: string | Buffer, type?: 'spki' | 'pkcs1'): crypto.KeyObject;
export declare function digest(algorithm: string, ...data: BinaryLike[]): Buffer;
export declare function hash(...data: BinaryLike[]): Buffer;
export declare function verify(data: Buffer, key: crypto.KeyLike, signature: Buffer, algorithm?: string): boolean;
export declare function bufferEqual(a: Buffer, b: Buffer): boolean;
