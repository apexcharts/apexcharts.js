/**
 * @license
 * Copyright 2023 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
import type * as Bidi from 'chromium-bidi/lib/cjs/protocol/protocol.js';
/**
 * @internal
 */
export declare function createEvaluationError(details: Bidi.Script.ExceptionDetails): unknown;
/**
 * @internal
 */
export declare function rewriteNavigationError(message: string, ms: number): (error: unknown) => never;
//# sourceMappingURL=util.d.ts.map