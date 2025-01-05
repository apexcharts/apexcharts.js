/// <reference types="node" />
/**
 * Only a subset of the secure hash standard algorithms are supported.
 * See <https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.180-4.pdf> for more
 * details.
 * UNSPECIFIED SHOULD not be used, primary reason for inclusion is to force
 * any proto JSON serialization to emit the used hash algorithm, as default
 * option is to *omit* the default value of an enum (which is the first
 * value, represented by '0'.
 */
export declare enum HashAlgorithm {
    HASH_ALGORITHM_UNSPECIFIED = 0,
    SHA2_256 = 1,
    SHA2_384 = 2,
    SHA2_512 = 3,
    SHA3_256 = 4,
    SHA3_384 = 5
}
export declare function hashAlgorithmFromJSON(object: any): HashAlgorithm;
export declare function hashAlgorithmToJSON(object: HashAlgorithm): string;
/**
 * Details of a specific public key, capturing the the key encoding method,
 * and signature algorithm.
 *
 * PublicKeyDetails captures the public key/hash algorithm combinations
 * recommended in the Sigstore ecosystem.
 *
 * This is modelled as a linear set as we want to provide a small number of
 * opinionated options instead of allowing every possible permutation.
 *
 * Any changes to this enum MUST be reflected in the algorithm registry.
 * See: docs/algorithm-registry.md
 *
 * To avoid the possibility of contradicting formats such as PKCS1 with
 * ED25519 the valid permutations are listed as a linear set instead of a
 * cartesian set (i.e one combined variable instead of two, one for encoding
 * and one for the signature algorithm).
 */
export declare enum PublicKeyDetails {
    PUBLIC_KEY_DETAILS_UNSPECIFIED = 0,
    /**
     * PKCS1_RSA_PKCS1V5 - RSA
     *
     * @deprecated
     */
    PKCS1_RSA_PKCS1V5 = 1,
    /**
     * PKCS1_RSA_PSS - See RFC8017
     *
     * @deprecated
     */
    PKCS1_RSA_PSS = 2,
    /** @deprecated */
    PKIX_RSA_PKCS1V5 = 3,
    /** @deprecated */
    PKIX_RSA_PSS = 4,
    /** PKIX_RSA_PKCS1V15_2048_SHA256 - RSA public key in PKIX format, PKCS#1v1.5 signature */
    PKIX_RSA_PKCS1V15_2048_SHA256 = 9,
    PKIX_RSA_PKCS1V15_3072_SHA256 = 10,
    PKIX_RSA_PKCS1V15_4096_SHA256 = 11,
    /** PKIX_RSA_PSS_2048_SHA256 - RSA public key in PKIX format, RSASSA-PSS signature */
    PKIX_RSA_PSS_2048_SHA256 = 16,
    PKIX_RSA_PSS_3072_SHA256 = 17,
    PKIX_RSA_PSS_4096_SHA256 = 18,
    /**
     * PKIX_ECDSA_P256_HMAC_SHA_256 - ECDSA
     *
     * @deprecated
     */
    PKIX_ECDSA_P256_HMAC_SHA_256 = 6,
    /** PKIX_ECDSA_P256_SHA_256 - See NIST FIPS 186-4 */
    PKIX_ECDSA_P256_SHA_256 = 5,
    PKIX_ECDSA_P384_SHA_384 = 12,
    PKIX_ECDSA_P521_SHA_512 = 13,
    /** PKIX_ED25519 - Ed 25519 */
    PKIX_ED25519 = 7,
    PKIX_ED25519_PH = 8,
    /**
     * LMS_SHA256 - LMS and LM-OTS
     *
     * These keys and signatures may be used by private Sigstore
     * deployments, but are not currently supported by the public
     * good instance.
     *
     * USER WARNING: LMS and LM-OTS are both stateful signature schemes.
     * Using them correctly requires discretion and careful consideration
     * to ensure that individual secret keys are not used more than once.
     * In addition, LM-OTS is a single-use scheme, meaning that it
     * MUST NOT be used for more than one signature per LM-OTS key.
     * If you cannot maintain these invariants, you MUST NOT use these
     * schemes.
     */
    LMS_SHA256 = 14,
    LMOTS_SHA256 = 15
}
export declare function publicKeyDetailsFromJSON(object: any): PublicKeyDetails;
export declare function publicKeyDetailsToJSON(object: PublicKeyDetails): string;
export declare enum SubjectAlternativeNameType {
    SUBJECT_ALTERNATIVE_NAME_TYPE_UNSPECIFIED = 0,
    EMAIL = 1,
    URI = 2,
    /**
     * OTHER_NAME - OID 1.3.6.1.4.1.57264.1.7
     * See https://github.com/sigstore/fulcio/blob/main/docs/oid-info.md#1361415726417--othername-san
     * for more details.
     */
    OTHER_NAME = 3
}
export declare function subjectAlternativeNameTypeFromJSON(object: any): SubjectAlternativeNameType;
export declare function subjectAlternativeNameTypeToJSON(object: SubjectAlternativeNameType): string;
/**
 * HashOutput captures a digest of a 'message' (generic octet sequence)
 * and the corresponding hash algorithm used.
 */
export interface HashOutput {
    algorithm: HashAlgorithm;
    /**
     * This is the raw octets of the message digest as computed by
     * the hash algorithm.
     */
    digest: Buffer;
}
/** MessageSignature stores the computed signature over a message. */
export interface MessageSignature {
    /**
     * Message digest can be used to identify the artifact.
     * Clients MUST NOT attempt to use this digest to verify the associated
     * signature; it is intended solely for identification.
     */
    messageDigest: HashOutput | undefined;
    /**
     * The raw bytes as returned from the signature algorithm.
     * The signature algorithm (and so the format of the signature bytes)
     * are determined by the contents of the 'verification_material',
     * either a key-pair or a certificate. If using a certificate, the
     * certificate contains the required information on the signature
     * algorithm.
     * When using a key pair, the algorithm MUST be part of the public
     * key, which MUST be communicated out-of-band.
     */
    signature: Buffer;
}
/** LogId captures the identity of a transparency log. */
export interface LogId {
    /** The unique identity of the log, represented by its public key. */
    keyId: Buffer;
}
/** This message holds a RFC 3161 timestamp. */
export interface RFC3161SignedTimestamp {
    /**
     * Signed timestamp is the DER encoded TimeStampResponse.
     * See https://www.rfc-editor.org/rfc/rfc3161.html#section-2.4.2
     */
    signedTimestamp: Buffer;
}
export interface PublicKey {
    /**
     * DER-encoded public key, encoding method is specified by the
     * key_details attribute.
     */
    rawBytes?: Buffer | undefined;
    /** Key encoding and signature algorithm to use for this key. */
    keyDetails: PublicKeyDetails;
    /** Optional validity period for this key, *inclusive* of the endpoints. */
    validFor?: TimeRange | undefined;
}
/**
 * PublicKeyIdentifier can be used to identify an (out of band) delivered
 * key, to verify a signature.
 */
export interface PublicKeyIdentifier {
    /**
     * Optional unauthenticated hint on which key to use.
     * The format of the hint must be agreed upon out of band by the
     * signer and the verifiers, and so is not subject to this
     * specification.
     * Example use-case is to specify the public key to use, from a
     * trusted key-ring.
     * Implementors are RECOMMENDED to derive the value from the public
     * key as described in RFC 6962.
     * See: <https://www.rfc-editor.org/rfc/rfc6962#section-3.2>
     */
    hint: string;
}
/** An ASN.1 OBJECT IDENTIFIER */
export interface ObjectIdentifier {
    id: number[];
}
/** An OID and the corresponding (byte) value. */
export interface ObjectIdentifierValuePair {
    oid: ObjectIdentifier | undefined;
    value: Buffer;
}
export interface DistinguishedName {
    organization: string;
    commonName: string;
}
export interface X509Certificate {
    /** DER-encoded X.509 certificate. */
    rawBytes: Buffer;
}
export interface SubjectAlternativeName {
    type: SubjectAlternativeNameType;
    identity?: {
        $case: "regexp";
        regexp: string;
    } | {
        $case: "value";
        value: string;
    };
}
/**
 * A collection of X.509 certificates.
 *
 * This "chain" can be used in multiple contexts, such as providing a root CA
 * certificate within a TUF root of trust or multiple untrusted certificates for
 * the purpose of chain building.
 */
export interface X509CertificateChain {
    /**
     * One or more DER-encoded certificates.
     *
     * In some contexts (such as `VerificationMaterial.x509_certificate_chain`), this sequence
     * has an imposed order. Unless explicitly specified, there is otherwise no
     * guaranteed order.
     */
    certificates: X509Certificate[];
}
/**
 * The time range is closed and includes both the start and end times,
 * (i.e., [start, end]).
 * End is optional to be able to capture a period that has started but
 * has no known end.
 */
export interface TimeRange {
    start: Date | undefined;
    end?: Date | undefined;
}
export declare const HashOutput: {
    fromJSON(object: any): HashOutput;
    toJSON(message: HashOutput): unknown;
};
export declare const MessageSignature: {
    fromJSON(object: any): MessageSignature;
    toJSON(message: MessageSignature): unknown;
};
export declare const LogId: {
    fromJSON(object: any): LogId;
    toJSON(message: LogId): unknown;
};
export declare const RFC3161SignedTimestamp: {
    fromJSON(object: any): RFC3161SignedTimestamp;
    toJSON(message: RFC3161SignedTimestamp): unknown;
};
export declare const PublicKey: {
    fromJSON(object: any): PublicKey;
    toJSON(message: PublicKey): unknown;
};
export declare const PublicKeyIdentifier: {
    fromJSON(object: any): PublicKeyIdentifier;
    toJSON(message: PublicKeyIdentifier): unknown;
};
export declare const ObjectIdentifier: {
    fromJSON(object: any): ObjectIdentifier;
    toJSON(message: ObjectIdentifier): unknown;
};
export declare const ObjectIdentifierValuePair: {
    fromJSON(object: any): ObjectIdentifierValuePair;
    toJSON(message: ObjectIdentifierValuePair): unknown;
};
export declare const DistinguishedName: {
    fromJSON(object: any): DistinguishedName;
    toJSON(message: DistinguishedName): unknown;
};
export declare const X509Certificate: {
    fromJSON(object: any): X509Certificate;
    toJSON(message: X509Certificate): unknown;
};
export declare const SubjectAlternativeName: {
    fromJSON(object: any): SubjectAlternativeName;
    toJSON(message: SubjectAlternativeName): unknown;
};
export declare const X509CertificateChain: {
    fromJSON(object: any): X509CertificateChain;
    toJSON(message: X509CertificateChain): unknown;
};
export declare const TimeRange: {
    fromJSON(object: any): TimeRange;
    toJSON(message: TimeRange): unknown;
};
