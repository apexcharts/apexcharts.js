import type { ProposedHashedRekordEntry } from '@sigstore/rekor-types';
import type { SignatureContent } from '../shared.types';
export declare function verifyHashedRekordTLogBody(tlogEntry: ProposedHashedRekordEntry, content: SignatureContent): void;
