/**
 * @license
 * Copyright 2024 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
import type * as Bidi from 'chromium-bidi/lib/cjs/protocol/protocol.js';
import { EventEmitter } from '../../common/EventEmitter.js';
import { disposeSymbol } from '../../util/disposable.js';
import type { BrowsingContext } from './BrowsingContext.js';
import { SharedWorkerRealm } from './Realm.js';
import type { Session } from './Session.js';
import { UserContext } from './UserContext.js';
/**
 * @internal
 */
export type AddPreloadScriptOptions = Omit<Bidi.Script.AddPreloadScriptParameters, 'functionDeclaration' | 'contexts'> & {
    contexts?: [BrowsingContext, ...BrowsingContext[]];
};
/**
 * @internal
 */
export declare class Browser extends EventEmitter<{
    /** Emitted before the browser closes. */
    closed: {
        /** The reason for closing the browser. */
        reason: string;
    };
    /** Emitted after the browser disconnects. */
    disconnected: {
        /** The reason for disconnecting the browser. */
        reason: string;
    };
    /** Emitted when a shared worker is created. */
    sharedworker: {
        /** The realm of the shared worker. */
        realm: SharedWorkerRealm;
    };
}> {
    #private;
    static from(session: Session): Promise<Browser>;
    readonly session: Session;
    private constructor();
    get closed(): boolean;
    get defaultUserContext(): UserContext;
    get disconnected(): boolean;
    get disposed(): boolean;
    get userContexts(): Iterable<UserContext>;
    dispose(reason?: string, closed?: boolean): void;
    close(): Promise<void>;
    addPreloadScript(functionDeclaration: string, options?: AddPreloadScriptOptions): Promise<string>;
    removeIntercept(intercept: Bidi.Network.Intercept): Promise<void>;
    removePreloadScript(script: string): Promise<void>;
    createUserContext(): Promise<UserContext>;
    [disposeSymbol](): void;
}
//# sourceMappingURL=Browser.d.ts.map