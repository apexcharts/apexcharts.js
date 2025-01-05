import { TLogAuthority } from '../trust';
import type { TLogEntryWithInclusionProof } from '@sigstore/bundle';
export declare function verifyCheckpoint(entry: TLogEntryWithInclusionProof, tlogs: TLogAuthority[]): void;
