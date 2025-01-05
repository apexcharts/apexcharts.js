/**
 * @license
 * Copyright 2017 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Protocol } from 'devtools-protocol';
/**
 * @internal
 */
export declare function createEvaluationError(details: Protocol.Runtime.ExceptionDetails): unknown;
/**
 * @internal
 */
export declare function createClientError(details: Protocol.Runtime.ExceptionDetails): Error;
/**
 * @internal
 */
export declare function valueFromRemoteObject(remoteObject: Protocol.Runtime.RemoteObject): any;
/**
 * @internal
 */
export declare function addPageBinding(type: string, name: string): void;
/**
 * @internal
 */
export declare function pageBindingInitString(type: string, name: string): string;
//# sourceMappingURL=utils.d.ts.map