/**
 * @license
 * Copyright 2022 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
import { CDPSessionEvent } from '../api/CDPSession.js';
import { EventEmitter } from '../common/EventEmitter.js';
import { assert } from '../util/assert.js';
import { Deferred } from '../util/Deferred.js';
/**
 * FirefoxTargetManager implements target management using
 * `Target.setDiscoverTargets` without using auto-attach. It, therefore, creates
 * targets that lazily establish their CDP sessions.
 *
 * Although the approach is potentially flaky, there is no other way for Firefox
 * because Firefox's CDP implementation does not support auto-attach.
 *
 * Firefox does not support targetInfoChanged and detachedFromTarget events:
 *
 * - https://bugzilla.mozilla.org/show_bug.cgi?id=1610855
 * - https://bugzilla.mozilla.org/show_bug.cgi?id=1636979
 *   @internal
 */
export class FirefoxTargetManager extends EventEmitter {
    #connection;
    /**
     * Keeps track of the following events: 'Target.targetCreated',
     * 'Target.targetDestroyed'.
     *
     * A target becomes discovered when 'Target.targetCreated' is received.
     * A target is removed from this map once 'Target.targetDestroyed' is
     * received.
     *
     * `targetFilterCallback` has no effect on this map.
     */
    #discoveredTargetsByTargetId = new Map();
    /**
     * Keeps track of targets that were created via 'Target.targetCreated'
     * and which one are not filtered out by `targetFilterCallback`.
     *
     * The target is removed from here once it's been destroyed.
     */
    #availableTargetsByTargetId = new Map();
    /**
     * Tracks which sessions attach to which target.
     */
    #availableTargetsBySessionId = new Map();
    #targetFilterCallback;
    #targetFactory;
    #attachedToTargetListenersBySession = new WeakMap();
    #initializeDeferred = Deferred.create();
    #targetsIdsForInit = new Set();
    constructor(connection, targetFactory, targetFilterCallback) {
        super();
        this.#connection = connection;
        this.#targetFilterCallback = targetFilterCallback;
        this.#targetFactory = targetFactory;
        this.#connection.on('Target.targetCreated', this.#onTargetCreated);
        this.#connection.on('Target.targetDestroyed', this.#onTargetDestroyed);
        this.#connection.on(CDPSessionEvent.SessionDetached, this.#onSessionDetached);
        this.setupAttachmentListeners(this.#connection);
    }
    setupAttachmentListeners(session) {
        const listener = (event) => {
            return this.#onAttachedToTarget(session, event);
        };
        assert(!this.#attachedToTargetListenersBySession.has(session));
        this.#attachedToTargetListenersBySession.set(session, listener);
        session.on('Target.attachedToTarget', listener);
    }
    #onSessionDetached = (session) => {
        this.removeSessionListeners(session);
        this.#availableTargetsBySessionId.delete(session.id());
    };
    removeSessionListeners(session) {
        if (this.#attachedToTargetListenersBySession.has(session)) {
            session.off('Target.attachedToTarget', this.#attachedToTargetListenersBySession.get(session));
            this.#attachedToTargetListenersBySession.delete(session);
        }
    }
    getAvailableTargets() {
        return this.#availableTargetsByTargetId;
    }
    dispose() {
        this.#connection.off('Target.targetCreated', this.#onTargetCreated);
        this.#connection.off('Target.targetDestroyed', this.#onTargetDestroyed);
    }
    async initialize() {
        await this.#connection.send('Target.setDiscoverTargets', {
            discover: true,
            filter: [{}],
        });
        this.#targetsIdsForInit = new Set(this.#discoveredTargetsByTargetId.keys());
        await this.#initializeDeferred.valueOrThrow();
    }
    #onTargetCreated = async (event) => {
        if (this.#discoveredTargetsByTargetId.has(event.targetInfo.targetId)) {
            return;
        }
        this.#discoveredTargetsByTargetId.set(event.targetInfo.targetId, event.targetInfo);
        if (event.targetInfo.type === 'browser' && event.targetInfo.attached) {
            const target = this.#targetFactory(event.targetInfo, undefined);
            target._initialize();
            this.#availableTargetsByTargetId.set(event.targetInfo.targetId, target);
            this.#finishInitializationIfReady(target._targetId);
            return;
        }
        const target = this.#targetFactory(event.targetInfo, undefined);
        if (this.#targetFilterCallback && !this.#targetFilterCallback(target)) {
            this.#finishInitializationIfReady(event.targetInfo.targetId);
            return;
        }
        target._initialize();
        this.#availableTargetsByTargetId.set(event.targetInfo.targetId, target);
        this.emit("targetAvailable" /* TargetManagerEvent.TargetAvailable */, target);
        this.#finishInitializationIfReady(target._targetId);
    };
    #onTargetDestroyed = (event) => {
        this.#discoveredTargetsByTargetId.delete(event.targetId);
        this.#finishInitializationIfReady(event.targetId);
        const target = this.#availableTargetsByTargetId.get(event.targetId);
        if (target) {
            this.emit("targetGone" /* TargetManagerEvent.TargetGone */, target);
            this.#availableTargetsByTargetId.delete(event.targetId);
        }
    };
    #onAttachedToTarget = async (parentSession, event) => {
        const targetInfo = event.targetInfo;
        const session = this.#connection.session(event.sessionId);
        if (!session) {
            throw new Error(`Session ${event.sessionId} was not created.`);
        }
        const target = this.#availableTargetsByTargetId.get(targetInfo.targetId);
        assert(target, `Target ${targetInfo.targetId} is missing`);
        session._setTarget(target);
        this.setupAttachmentListeners(session);
        this.#availableTargetsBySessionId.set(session.id(), this.#availableTargetsByTargetId.get(targetInfo.targetId));
        parentSession.emit(CDPSessionEvent.Ready, session);
    };
    #finishInitializationIfReady(targetId) {
        this.#targetsIdsForInit.delete(targetId);
        if (this.#targetsIdsForInit.size === 0) {
            this.#initializeDeferred.resolve();
        }
    }
}
//# sourceMappingURL=FirefoxTargetManager.js.map