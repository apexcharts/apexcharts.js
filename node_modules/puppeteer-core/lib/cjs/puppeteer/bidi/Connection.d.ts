/**
 * @license
 * Copyright 2017 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
import type * as Bidi from 'chromium-bidi/lib/cjs/protocol/protocol.js';
import type { ConnectionTransport } from '../common/ConnectionTransport.js';
import type { EventsWithWildcard } from '../common/EventEmitter.js';
import { EventEmitter } from '../common/EventEmitter.js';
import type { Commands as BidiCommands, BidiEvents, Connection } from './core/Connection.js';
/**
 * @internal
 */
export interface Commands extends BidiCommands {
    'cdp.sendCommand': {
        params: Bidi.Cdp.SendCommandParameters;
        returnType: Bidi.Cdp.SendCommandResult;
    };
    'cdp.getSession': {
        params: Bidi.Cdp.GetSessionParameters;
        returnType: Bidi.Cdp.GetSessionResult;
    };
    'cdp.resolveRealm': {
        params: Bidi.Cdp.ResolveRealmParameters;
        returnType: Bidi.Cdp.ResolveRealmResult;
    };
}
/**
 * @internal
 */
export declare class BidiConnection extends EventEmitter<BidiEvents> implements Connection {
    #private;
    constructor(url: string, transport: ConnectionTransport, delay?: number, timeout?: number);
    get closed(): boolean;
    get url(): string;
    pipeTo<Events extends BidiEvents>(emitter: EventEmitter<Events>): void;
    emit<Key extends keyof EventsWithWildcard<BidiEvents>>(type: Key, event: EventsWithWildcard<BidiEvents>[Key]): boolean;
    send<T extends keyof Commands>(method: T, params: Commands[T]['params'], timeout?: number): Promise<{
        result: Commands[T]['returnType'];
    }>;
    /**
     * @internal
     */
    protected onMessage(message: string): Promise<void>;
    /**
     * Unbinds the connection, but keeps the transport open. Useful when the transport will
     * be reused by other connection e.g. with different protocol.
     * @internal
     */
    unbind(): void;
    /**
     * Unbinds the connection and closes the transport.
     */
    dispose(): void;
    getPendingProtocolErrors(): Error[];
}
//# sourceMappingURL=Connection.d.ts.map