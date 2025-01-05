import type { SignedEntity, Signer, VerificationPolicy } from './shared.types';
import type { TrustMaterial } from './trust';
export type VerifierOptions = {
    tlogThreshold?: number;
    ctlogThreshold?: number;
    tsaThreshold?: number;
};
export declare class Verifier {
    private trustMaterial;
    private options;
    constructor(trustMaterial: TrustMaterial, options?: VerifierOptions);
    verify(entity: SignedEntity, policy?: VerificationPolicy): Signer;
    private verifyTimestamps;
    private verifySigningKey;
    private verifyTLogs;
    private verifySignature;
    private verifyPolicy;
}
