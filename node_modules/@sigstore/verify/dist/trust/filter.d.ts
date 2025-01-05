/// <reference types="node" />
import type { CertAuthority, TLogAuthority } from './trust.types';
type CertAuthorityFilterCriteria = {
    start: Date;
    end: Date;
};
export declare function filterCertAuthorities(certAuthorities: CertAuthority[], criteria: CertAuthorityFilterCriteria): CertAuthority[];
type TLogAuthorityFilterCriteria = {
    targetDate: Date;
    logID?: Buffer;
};
export declare function filterTLogAuthorities(tlogAuthorities: TLogAuthority[], criteria: TLogAuthorityFilterCriteria): TLogAuthority[];
export {};
