/// <reference types="node" />
import { LogId } from "./sigstore_common";
/** KindVersion contains the entry's kind and api version. */
export interface KindVersion {
    /**
     * Kind is the type of entry being stored in the log.
     * See here for a list: https://github.com/sigstore/rekor/tree/main/pkg/types
     */
    kind: string;
    /** The specific api version of the type. */
    version: string;
}
/**
 * The checkpoint MUST contain an origin string as a unique log identifier,
 * the tree size, and the root hash. It MAY also be followed by optional data,
 * and clients MUST NOT assume optional data. The checkpoint MUST also contain
 * a signature over the root hash (tree head). The checkpoint MAY contain additional
 * signatures, but the first SHOULD be the signature from the log. Checkpoint contents
 * are concatenated with newlines into a single string.
 * The checkpoint format is described in
 * https://github.com/transparency-dev/formats/blob/main/log/README.md
 * and https://github.com/C2SP/C2SP/blob/main/tlog-checkpoint.md.
 * An example implementation can be found in https://github.com/sigstore/rekor/blob/main/pkg/util/signed_note.go
 */
export interface Checkpoint {
    envelope: string;
}
/**
 * InclusionProof is the proof returned from the transparency log. Can
 * be used for offline or online verification against the log.
 */
export interface InclusionProof {
    /** The index of the entry in the tree it was written to. */
    logIndex: string;
    /**
     * The hash digest stored at the root of the merkle tree at the time
     * the proof was generated.
     */
    rootHash: Buffer;
    /** The size of the merkle tree at the time the proof was generated. */
    treeSize: string;
    /**
     * A list of hashes required to compute the inclusion proof, sorted
     * in order from leaf to root.
     * Note that leaf and root hashes are not included.
     * The root hash is available separately in this message, and the
     * leaf hash should be calculated by the client.
     */
    hashes: Buffer[];
    /**
     * Signature of the tree head, as of the time of this proof was
     * generated. See above info on 'Checkpoint' for more details.
     */
    checkpoint: Checkpoint | undefined;
}
/**
 * The inclusion promise is calculated by Rekor. It's calculated as a
 * signature over a canonical JSON serialization of the persisted entry, the
 * log ID, log index and the integration timestamp.
 * See https://github.com/sigstore/rekor/blob/a6e58f72b6b18cc06cefe61808efd562b9726330/pkg/api/entries.go#L54
 * The format of the signature depends on the transparency log's public key.
 * If the signature algorithm requires a hash function and/or a signature
 * scheme (e.g. RSA) those has to be retrieved out-of-band from the log's
 * operators, together with the public key.
 * This is used to verify the integration timestamp's value and that the log
 * has promised to include the entry.
 */
export interface InclusionPromise {
    signedEntryTimestamp: Buffer;
}
/**
 * TransparencyLogEntry captures all the details required from Rekor to
 * reconstruct an entry, given that the payload is provided via other means.
 * This type can easily be created from the existing response from Rekor.
 * Future iterations could rely on Rekor returning the minimal set of
 * attributes (excluding the payload) that are required for verifying the
 * inclusion promise. The inclusion promise (called SignedEntryTimestamp in
 * the response from Rekor) is similar to a Signed Certificate Timestamp
 * as described here https://www.rfc-editor.org/rfc/rfc6962.html#section-3.2.
 */
export interface TransparencyLogEntry {
    /** The global index of the entry, used when querying the log by index. */
    logIndex: string;
    /** The unique identifier of the log. */
    logId: LogId | undefined;
    /**
     * The kind (type) and version of the object associated with this
     * entry. These values are required to construct the entry during
     * verification.
     */
    kindVersion: KindVersion | undefined;
    /** The UNIX timestamp from the log when the entry was persisted. */
    integratedTime: string;
    /**
     * The inclusion promise/signed entry timestamp from the log.
     * Required for v0.1 bundles, and MUST be verified.
     * Optional for >= v0.2 bundles, and SHOULD be verified when present.
     * Also may be used as a signed timestamp.
     */
    inclusionPromise: InclusionPromise | undefined;
    /**
     * The inclusion proof can be used for offline or online verification
     * that the entry was appended to the log, and that the log has not been
     * altered.
     */
    inclusionProof: InclusionProof | undefined;
    /**
     * Optional. The canonicalized transparency log entry, used to
     * reconstruct the Signed Entry Timestamp (SET) during verification.
     * The contents of this field are the same as the `body` field in
     * a Rekor response, meaning that it does **not** include the "full"
     * canonicalized form (of log index, ID, etc.) which are
     * exposed as separate fields. The verifier is responsible for
     * combining the `canonicalized_body`, `log_index`, `log_id`,
     * and `integrated_time` into the payload that the SET's signature
     * is generated over.
     * This field is intended to be used in cases where the SET cannot be
     * produced determinisitically (e.g. inconsistent JSON field ordering,
     * differing whitespace, etc).
     *
     * If set, clients MUST verify that the signature referenced in the
     * `canonicalized_body` matches the signature provided in the
     * `Bundle.content`.
     * If not set, clients are responsible for constructing an equivalent
     * payload from other sources to verify the signature.
     */
    canonicalizedBody: Buffer;
}
export declare const KindVersion: {
    fromJSON(object: any): KindVersion;
    toJSON(message: KindVersion): unknown;
};
export declare const Checkpoint: {
    fromJSON(object: any): Checkpoint;
    toJSON(message: Checkpoint): unknown;
};
export declare const InclusionProof: {
    fromJSON(object: any): InclusionProof;
    toJSON(message: InclusionProof): unknown;
};
export declare const InclusionPromise: {
    fromJSON(object: any): InclusionPromise;
    toJSON(message: InclusionPromise): unknown;
};
export declare const TransparencyLogEntry: {
    fromJSON(object: any): TransparencyLogEntry;
    toJSON(message: TransparencyLogEntry): unknown;
};
