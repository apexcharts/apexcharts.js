import type { ProposedEntry } from '../../external/rekor';
import type { SignatureBundle } from '../witness';
export declare function toProposedEntry(content: SignatureBundle, publicKey: string, entryType?: 'dsse' | 'intoto'): ProposedEntry;
