import { Envelope } from "./envelope";
import { MessageSignature, PublicKeyIdentifier, RFC3161SignedTimestamp, X509Certificate, X509CertificateChain } from "./sigstore_common";
import { TransparencyLogEntry } from "./sigstore_rekor";
/**
 * Various timestamped counter signatures over the artifacts signature.
 * Currently only RFC3161 signatures are provided. More formats may be added
 * in the future.
 */
export interface TimestampVerificationData {
    /**
     * A list of RFC3161 signed timestamps provided by the user.
     * This can be used when the entry has not been stored on a
     * transparency log, or in conjunction for a stronger trust model.
     * Clients MUST verify the hashed message in the message imprint
     * against the signature in the bundle.
     */
    rfc3161Timestamps: RFC3161SignedTimestamp[];
}
/**
 * VerificationMaterial captures details on the materials used to verify
 * signatures. This message may be embedded in a DSSE envelope as a signature
 * extension. Specifically, the `ext` field of the extension will expect this
 * message when the signature extension is for Sigstore. This is identified by
 * the `kind` field in the extension, which must be set to
 * application/vnd.dev.sigstore.verificationmaterial;version=0.1 for Sigstore.
 * When used as a DSSE extension, if the `public_key` field is used to indicate
 * the key identifier, it MUST match the `keyid` field of the signature the
 * extension is attached to.
 */
export interface VerificationMaterial {
    content?: {
        $case: "publicKey";
        publicKey: PublicKeyIdentifier;
    } | {
        $case: "x509CertificateChain";
        x509CertificateChain: X509CertificateChain;
    } | {
        $case: "certificate";
        certificate: X509Certificate;
    };
    /**
     * An inclusion proof and an optional signed timestamp from the log.
     * Client verification libraries MAY provide an option to support v0.1
     * bundles for backwards compatibility, which may contain an inclusion
     * promise and not an inclusion proof. In this case, the client MUST
     * validate the promise.
     * Verifiers SHOULD NOT allow v0.1 bundles if they're used in an
     * ecosystem which never produced them.
     */
    tlogEntries: TransparencyLogEntry[];
    /**
     * Timestamp may also come from
     * tlog_entries.inclusion_promise.signed_entry_timestamp.
     */
    timestampVerificationData: TimestampVerificationData | undefined;
}
export interface Bundle {
    /**
     * MUST be application/vnd.dev.sigstore.bundle.v0.3+json when
     * when encoded as JSON.
     * Clients must to be able to accept media type using the previously
     * defined formats:
     * * application/vnd.dev.sigstore.bundle+json;version=0.1
     * * application/vnd.dev.sigstore.bundle+json;version=0.2
     * * application/vnd.dev.sigstore.bundle+json;version=0.3
     */
    mediaType: string;
    /**
     * When a signer is identified by a X.509 certificate, a verifier MUST
     * verify that the signature was computed at the time the certificate
     * was valid as described in the Sigstore client spec: "Verification
     * using a Bundle".
     * <https://docs.google.com/document/d/1kbhK2qyPPk8SLavHzYSDM8-Ueul9_oxIMVFuWMWKz0E/edit#heading=h.x8bduppe89ln>
     * If the verification material contains a public key identifier
     * (key hint) and the `content` is a DSSE envelope, the key hints
     * MUST be exactly the same in the verification material and in the
     * DSSE envelope.
     */
    verificationMaterial: VerificationMaterial | undefined;
    content?: {
        $case: "messageSignature";
        messageSignature: MessageSignature;
    } | {
        $case: "dsseEnvelope";
        dsseEnvelope: Envelope;
    };
}
export declare const TimestampVerificationData: {
    fromJSON(object: any): TimestampVerificationData;
    toJSON(message: TimestampVerificationData): unknown;
};
export declare const VerificationMaterial: {
    fromJSON(object: any): VerificationMaterial;
    toJSON(message: VerificationMaterial): unknown;
};
export declare const Bundle: {
    fromJSON(object: any): Bundle;
    toJSON(message: Bundle): unknown;
};
