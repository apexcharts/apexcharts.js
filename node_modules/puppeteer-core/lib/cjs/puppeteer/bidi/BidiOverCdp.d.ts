/**
 * @license
 * Copyright 2023 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
import * as BidiMapper from 'chromium-bidi/lib/cjs/bidiMapper/BidiMapper.js';
import type { Connection as CdpConnection } from '../cdp/Connection.js';
import { BidiConnection } from './Connection.js';
/**
 * @internal
 */
export declare function connectBidiOverCdp(cdp: CdpConnection, options: BidiMapper.MapperOptions): Promise<BidiConnection>;
//# sourceMappingURL=BidiOverCdp.d.ts.map