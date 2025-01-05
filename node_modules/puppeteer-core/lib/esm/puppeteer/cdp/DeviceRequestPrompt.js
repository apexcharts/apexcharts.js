/**
 * @license
 * Copyright 2022 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
import { assert } from '../util/assert.js';
import { Deferred } from '../util/Deferred.js';
/**
 * Device in a request prompt.
 *
 * @public
 */
export class DeviceRequestPromptDevice {
    /**
     * Device id during a prompt.
     */
    id;
    /**
     * Device name as it appears in a prompt.
     */
    name;
    /**
     * @internal
     */
    constructor(id, name) {
        this.id = id;
        this.name = name;
    }
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
export class DeviceRequestPrompt {
    #client;
    #timeoutSettings;
    #id;
    #handled = false;
    #updateDevicesHandle = this.#updateDevices.bind(this);
    #waitForDevicePromises = new Set();
    /**
     * Current list of selectable devices.
     */
    devices = [];
    /**
     * @internal
     */
    constructor(client, timeoutSettings, firstEvent) {
        this.#client = client;
        this.#timeoutSettings = timeoutSettings;
        this.#id = firstEvent.id;
        this.#client.on('DeviceAccess.deviceRequestPrompted', this.#updateDevicesHandle);
        this.#client.on('Target.detachedFromTarget', () => {
            this.#client = null;
        });
        this.#updateDevices(firstEvent);
    }
    #updateDevices(event) {
        if (event.id !== this.#id) {
            return;
        }
        for (const rawDevice of event.devices) {
            if (this.devices.some(device => {
                return device.id === rawDevice.id;
            })) {
                continue;
            }
            const newDevice = new DeviceRequestPromptDevice(rawDevice.id, rawDevice.name);
            this.devices.push(newDevice);
            for (const waitForDevicePromise of this.#waitForDevicePromises) {
                if (waitForDevicePromise.filter(newDevice)) {
                    waitForDevicePromise.promise.resolve(newDevice);
                }
            }
        }
    }
    /**
     * Resolve to the first device in the prompt matching a filter.
     */
    async waitForDevice(filter, options = {}) {
        for (const device of this.devices) {
            if (filter(device)) {
                return device;
            }
        }
        const { timeout = this.#timeoutSettings.timeout() } = options;
        const deferred = Deferred.create({
            message: `Waiting for \`DeviceRequestPromptDevice\` failed: ${timeout}ms exceeded`,
            timeout,
        });
        const handle = { filter, promise: deferred };
        this.#waitForDevicePromises.add(handle);
        try {
            return await deferred.valueOrThrow();
        }
        finally {
            this.#waitForDevicePromises.delete(handle);
        }
    }
    /**
     * Select a device in the prompt's list.
     */
    async select(device) {
        assert(this.#client !== null, 'Cannot select device through detached session!');
        assert(this.devices.includes(device), 'Cannot select unknown device!');
        assert(!this.#handled, 'Cannot select DeviceRequestPrompt which is already handled!');
        this.#client.off('DeviceAccess.deviceRequestPrompted', this.#updateDevicesHandle);
        this.#handled = true;
        return await this.#client.send('DeviceAccess.selectPrompt', {
            id: this.#id,
            deviceId: device.id,
        });
    }
    /**
     * Cancel the prompt.
     */
    async cancel() {
        assert(this.#client !== null, 'Cannot cancel prompt through detached session!');
        assert(!this.#handled, 'Cannot cancel DeviceRequestPrompt which is already handled!');
        this.#client.off('DeviceAccess.deviceRequestPrompted', this.#updateDevicesHandle);
        this.#handled = true;
        return await this.#client.send('DeviceAccess.cancelPrompt', { id: this.#id });
    }
}
/**
 * @internal
 */
export class DeviceRequestPromptManager {
    #client;
    #timeoutSettings;
    #deviceRequestPrompDeferreds = new Set();
    /**
     * @internal
     */
    constructor(client, timeoutSettings) {
        this.#client = client;
        this.#timeoutSettings = timeoutSettings;
        this.#client.on('DeviceAccess.deviceRequestPrompted', event => {
            this.#onDeviceRequestPrompted(event);
        });
        this.#client.on('Target.detachedFromTarget', () => {
            this.#client = null;
        });
    }
    /**
     * Wait for device prompt created by an action like calling WebBluetooth's
     * requestDevice.
     */
    async waitForDevicePrompt(options = {}) {
        assert(this.#client !== null, 'Cannot wait for device prompt through detached session!');
        const needsEnable = this.#deviceRequestPrompDeferreds.size === 0;
        let enablePromise;
        if (needsEnable) {
            enablePromise = this.#client.send('DeviceAccess.enable');
        }
        const { timeout = this.#timeoutSettings.timeout() } = options;
        const deferred = Deferred.create({
            message: `Waiting for \`DeviceRequestPrompt\` failed: ${timeout}ms exceeded`,
            timeout,
        });
        this.#deviceRequestPrompDeferreds.add(deferred);
        try {
            const [result] = await Promise.all([
                deferred.valueOrThrow(),
                enablePromise,
            ]);
            return result;
        }
        finally {
            this.#deviceRequestPrompDeferreds.delete(deferred);
        }
    }
    /**
     * @internal
     */
    #onDeviceRequestPrompted(event) {
        if (!this.#deviceRequestPrompDeferreds.size) {
            return;
        }
        assert(this.#client !== null);
        const devicePrompt = new DeviceRequestPrompt(this.#client, this.#timeoutSettings, event);
        for (const promise of this.#deviceRequestPrompDeferreds) {
            promise.resolve(devicePrompt);
        }
        this.#deviceRequestPrompDeferreds.clear();
    }
}
//# sourceMappingURL=DeviceRequestPrompt.js.map