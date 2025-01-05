import { X509Certificate } from '@sigstore/core';
import { CertAuthority } from '../trust';
export declare function verifyCertificateChain(leaf: X509Certificate, certificateAuthorities: CertAuthority[]): X509Certificate[];
interface CertificateChainVerifierOptions {
    trustedCerts: X509Certificate[];
    untrustedCert: X509Certificate;
}
export declare class CertificateChainVerifier {
    private untrustedCert;
    private trustedCerts;
    private localCerts;
    constructor(opts: CertificateChainVerifierOptions);
    verify(): X509Certificate[];
    private sort;
    private buildPaths;
    private findIssuer;
    private checkPath;
}
export {};
