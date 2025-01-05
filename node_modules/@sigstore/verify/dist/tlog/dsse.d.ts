import type { ProposedDSSEEntry } from '@sigstore/rekor-types';
import type { SignatureContent } from '../shared.types';
export declare function verifyDSSETLogBody(tlogEntry: ProposedDSSEEntry, content: SignatureContent): void;
