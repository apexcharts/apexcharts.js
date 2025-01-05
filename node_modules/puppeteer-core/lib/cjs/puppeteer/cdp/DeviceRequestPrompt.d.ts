/**
 * @license
 * Copyright 2022 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
import type Protocol from 'devtools-protocol';
import type { CDPSession } from '../api/CDPSession.js';
import type { WaitTimeoutOptions } from '../api/Page.js';
import type { TimeoutSettings } from '../common/TimeoutSettings.js';
/**
 * Device in a request prompt.
 *
 * @public
 */
export declare class DeviceRequestPromptDevice {
    /**
     * Device id during a prompt.
     */
    id: string;
    /**
     * Device name as it appears in a prompt.
     */
    name: string;
    /**
     * @internal
     */
    constructor(id: string, name: string);
}
/**
 * Device request prompts let you respond to the page requesting for a device
 * through an API like WebBluetooth.
 *
 * @remarks
 * `DeviceRequestPrompt` instances are returned via the
 * {@link Page.waitForDevicePrompt} method.
 *
 * @example
 *
 * ```ts
 * const [deviceRequest] = Promise.all([
 *   page.waitForDevicePrompt(),
 *   page.click('#connect-bluetooth'),
 * ]);
 * await devicePrompt.select(
 *   await devicePrompt.waitForDevice(({name}) => name.includes('My Device'))
 * );
 * ```
 *
 * @public
 */
export declare class DeviceRequestPrompt {
    #private;
    /**
     * Current list of selectable devices.
     */
    devices: DeviceRequestPromptDevice[];
    /**
     * @internal
     */
    constructor(client: CDPSession, timeoutSettings: TimeoutSettings, firstEvent: Protocol.DeviceAccess.DeviceRequestPromptedEvent);
    /**
     * Resolve to the first device in the prompt matching a filter.
     */
    waitForDevice(filter: (device: DeviceRequestPromptDevice) => boolean, options?: WaitTimeoutOptions): Promise<DeviceRequestPromptDevice>;
    /**
     * Select a device in the prompt's list.
     */
    select(device: DeviceRequestPromptDevice): Promise<void>;
    /**
     * Cancel the prompt.
     */
    cancel(): Promise<void>;
}
/**
 * @internal
 */
export declare class DeviceRequestPromptManager {
    #private;
    /**
     * @internal
     */
    constructor(client: CDPSession, timeoutSettings: TimeoutSettings);
    /**
     * Wait for device prompt created by an action like calling WebBluetooth's
     * requestDevice.
     */
    waitForDevicePrompt(options?: WaitTimeoutOptions): Promise<DeviceRequestPrompt>;
}
//# sourceMappingURL=DeviceRequestPrompt.d.ts.map