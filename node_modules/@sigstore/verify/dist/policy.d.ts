import { CertificateExtensions } from './shared.types';
export declare function verifySubjectAlternativeName(policyIdentity: string, signerIdentity: string | undefined): void;
export declare function verifyExtensions(policyExtensions: CertificateExtensions, signerExtensions?: CertificateExtensions): void;
