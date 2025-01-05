/**
 * @license
 * Copyright 2023 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
/// <reference types="node" />
import { PassThrough } from 'stream';
import type { BoundingBox } from '../api/ElementHandle.js';
import type { Page } from '../api/Page.js';
import { asyncDisposeSymbol } from '../util/disposable.js';
/**
 * @internal
 */
export interface ScreenRecorderOptions {
    speed?: number;
    crop?: BoundingBox;
    format?: 'gif' | 'webm';
    scale?: number;
    path?: string;
}
/**
 * @public
 */
export declare class ScreenRecorder extends PassThrough {
    #private;
    /**
     * @internal
     */
    constructor(page: Page, width: number, height: number, { speed, scale, crop, format, path }?: ScreenRecorderOptions);
    /**
     * Stops the recorder.
     *
     * @public
     */
    stop(): Promise<void>;
    /**
     * @internal
     */
    [asyncDisposeSymbol](): Promise<void>;
}
//# sourceMappingURL=ScreenRecorder.d.ts.map