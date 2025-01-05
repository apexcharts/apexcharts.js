/**
 * @license
 * Copyright 2017 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
import * as Bidi from 'chromium-bidi/lib/cjs/protocol/protocol.js';
import { Keyboard, Mouse, Touchscreen, type KeyboardTypeOptions, type KeyDownOptions, type KeyPressOptions, type MouseClickOptions, type MouseMoveOptions, type MouseOptions, type MouseWheelOptions } from '../api/Input.js';
import type { KeyInput } from '../common/USKeyboardLayout.js';
import type { BidiPage } from './Page.js';
/**
 * @internal
 */
export declare class BidiKeyboard extends Keyboard {
    #private;
    constructor(page: BidiPage);
    down(key: KeyInput, _options?: Readonly<KeyDownOptions>): Promise<void>;
    up(key: KeyInput): Promise<void>;
    press(key: KeyInput, options?: Readonly<KeyPressOptions>): Promise<void>;
    type(text: string, options?: Readonly<KeyboardTypeOptions>): Promise<void>;
    sendCharacter(char: string): Promise<void>;
}
/**
 * @internal
 */
export interface BidiMouseClickOptions extends MouseClickOptions {
    origin?: Bidi.Input.Origin;
}
/**
 * @internal
 */
export interface BidiMouseMoveOptions extends MouseMoveOptions {
    origin?: Bidi.Input.Origin;
}
/**
 * @internal
 */
export interface BidiTouchMoveOptions {
    origin?: Bidi.Input.Origin;
}
/**
 * @internal
 */
export declare class BidiMouse extends Mouse {
    #private;
    constructor(page: BidiPage);
    reset(): Promise<void>;
    move(x: number, y: number, options?: Readonly<BidiMouseMoveOptions>): Promise<void>;
    down(options?: Readonly<MouseOptions>): Promise<void>;
    up(options?: Readonly<MouseOptions>): Promise<void>;
    click(x: number, y: number, options?: Readonly<BidiMouseClickOptions>): Promise<void>;
    wheel(options?: Readonly<MouseWheelOptions>): Promise<void>;
    drag(): never;
    dragOver(): never;
    dragEnter(): never;
    drop(): never;
    dragAndDrop(): never;
}
/**
 * @internal
 */
export declare class BidiTouchscreen extends Touchscreen {
    #private;
    constructor(page: BidiPage);
    touchStart(x: number, y: number, options?: BidiTouchMoveOptions): Promise<void>;
    touchMove(x: number, y: number, options?: BidiTouchMoveOptions): Promise<void>;
    touchEnd(): Promise<void>;
}
//# sourceMappingURL=Input.d.ts.map