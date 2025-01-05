/**
 * @license
 * Copyright 2023 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
/// <reference types="node" />
/// <reference types="node" />
import * as http from 'http';
import { URL } from 'url';
export declare function headHttpRequest(url: URL): Promise<boolean>;
export declare function httpRequest(url: URL, method: string, response: (x: http.IncomingMessage) => void, keepAlive?: boolean): http.ClientRequest;
/**
 * @internal
 */
export declare function downloadFile(url: URL, destinationPath: string, progressCallback?: (downloadedBytes: number, totalBytes: number) => void): Promise<void>;
export declare function getJSON(url: URL): Promise<unknown>;
export declare function getText(url: URL): Promise<string>;
//# sourceMappingURL=httpUtil.d.ts.map