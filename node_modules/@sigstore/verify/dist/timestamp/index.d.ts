/// <reference types="node" />
import { RFC3161Timestamp } from '@sigstore/core';
import type { TransparencyLogEntry } from '@sigstore/bundle';
import type { CertAuthority, TLogAuthority } from '../trust';
export type TimestampType = 'transparency-log' | 'timestamp-authority';
export type TimestampVerificationResult = {
    type: TimestampType;
    logID: Buffer;
    timestamp: Date;
};
export declare function verifyTSATimestamp(timestamp: RFC3161Timestamp, data: Buffer, timestampAuthorities: CertAuthority[]): TimestampVerificationResult;
export declare function verifyTLogTimestamp(entry: TransparencyLogEntry, tlogAuthorities: TLogAuthority[]): TimestampVerificationResult;
