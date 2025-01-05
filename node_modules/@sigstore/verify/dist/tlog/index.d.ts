import type { TransparencyLogEntry } from '@sigstore/bundle';
import type { SignatureContent } from '../shared.types';
export declare function verifyTLogBody(entry: TransparencyLogEntry, sigContent: SignatureContent): void;
