/**
 * @license
 * Copyright 2022 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
import { CDPSession, CDPSessionEvent } from '../api/CDPSession.js';
import { EventEmitter } from '../common/EventEmitter.js';
import { debugError } from '../common/util.js';
import { assert } from '../util/assert.js';
import { Deferred } from '../util/Deferred.js';
import { CdpTarget, InitializationStatus } from './Target.js';
function isPageTargetBecomingPrimary(target, newTargetInfo) {
    return Boolean(target._subtype()) && !newTargetInfo.subtype;
}
/**
 * ChromeTargetManager uses the CDP's auto-attach mechanism to intercept
 * new targets and allow the rest of Puppeteer to configure listeners while
 * the target is paused.
 *
 * @internal
 */
export class ChromeTargetManager extends EventEmitter {
    #connection;
    /**
     * Keeps track of the following events: 'Target.targetCreated',
     * 'Target.targetDestroyed', 'Target.targetInfoChanged'.
     *
     * A target becomes discovered when 'Target.targetCreated' is received.
     * A target is removed from this map once 'Target.targetDestroyed' is
     * received.
     *
     * `targetFilterCallback` has no effect on this map.
     */
    #discoveredTargetsByTargetId = new Map();
    /**
     * A target is added to this map once ChromeTargetManager has created
     * a Target and attached at least once to it.
     */
    #attachedTargetsByTargetId = new Map();
    /**
     * Tracks which sessions attach to which target.
     */
    #attachedTargetsBySessionId = new Map();
    /**
     * If a target was filtered out by `targetFilterCallback`, we still receive
     * events about it from CDP, but we don't forward them to the rest of Puppeteer.
     */
    #ignoredTargets = new Set();
    #targetFilterCallback;
    #targetFactory;
    #attachedToTargetListenersBySession = new WeakMap();
    #detachedFromTargetListenersBySession = new WeakMap();
    #initializeDeferred = Deferred.create();
    #targetsIdsForInit = new Set();
    #waitForInitiallyDiscoveredTargets = true;
    #discoveryFilter = [{}];
    constructor(connection, targetFactory, targetFilterCallback, waitForInitiallyDiscoveredTargets = true) {
        super();
        this.#connection = connection;
        this.#targetFilterCallback = targetFilterCallback;
        this.#targetFactory = targetFactory;
        this.#waitForInitiallyDiscoveredTargets = waitForInitiallyDiscoveredTargets;
        this.#connection.on('Target.targetCreated', this.#onTargetCreated);
        this.#connection.on('Target.targetDestroyed', this.#onTargetDestroyed);
        this.#connection.on('Target.targetInfoChanged', this.#onTargetInfoChanged);
        this.#connection.on(CDPSessionEvent.SessionDetached, this.#onSessionDetached);
        this.#setupAttachmentListeners(this.#connection);
    }
    #storeExistingTargetsForInit = () => {
        if (!this.#waitForInitiallyDiscoveredTargets) {
            return;
        }
        for (const [targetId, targetInfo,] of this.#discoveredTargetsByTargetId.entries()) {
            const targetForFilter = new CdpTarget(targetInfo, undefined, undefined, this, undefined);
            // Targets that will not be auto-attached. Therefore, we should
            // not add them to #targetsIdsForInit.
            const skipTarget = targetInfo.type === 'browser' ||
                targetInfo.url.startsWith('chrome-extension://');
            if ((!this.#targetFilterCallback ||
                this.#targetFilterCallback(targetForFilter)) &&
                !skipTarget) {
                this.#targetsIdsForInit.add(targetId);
            }
        }
    };
    async initialize() {
        await this.#connection.send('Target.setDiscoverTargets', {
            discover: true,
            filter: this.#discoveryFilter,
        });
        this.#storeExistingTargetsForInit();
        await this.#connection.send('Target.setAutoAttach', {
            waitForDebuggerOnStart: true,
            flatten: true,
            autoAttach: true,
            filter: [
                {
                    type: 'page',
                    exclude: true,
                },
                ...this.#discoveryFilter,
            ],
        });
        this.#finishInitializationIfReady();
        await this.#initializeDeferred.valueOrThrow();
    }
    dispose() {
        this.#connection.off('Target.targetCreated', this.#onTargetCreated);
        this.#connection.off('Target.targetDestroyed', this.#onTargetDestroyed);
        this.#connection.off('Target.targetInfoChanged', this.#onTargetInfoChanged);
        this.#connection.off(CDPSessionEvent.SessionDetached, this.#onSessionDetached);
        this.#removeAttachmentListeners(this.#connection);
    }
    getAvailableTargets() {
        return this.#attachedTargetsByTargetId;
    }
    #setupAttachmentListeners(session) {
        const listener = (event) => {
            void this.#onAttachedToTarget(session, event);
        };
        assert(!this.#attachedToTargetListenersBySession.has(session));
        this.#attachedToTargetListenersBySession.set(session, listener);
        session.on('Target.attachedToTarget', listener);
        const detachedListener = (event) => {
            return this.#onDetachedFromTarget(session, event);
        };
        assert(!this.#detachedFromTargetListenersBySession.has(session));
        this.#detachedFromTargetListenersBySession.set(session, detachedListener);
        session.on('Target.detachedFromTarget', detachedListener);
    }
    #removeAttachmentListeners(session) {
        const listener = this.#attachedToTargetListenersBySession.get(session);
        if (listener) {
            session.off('Target.attachedToTarget', listener);
            this.#attachedToTargetListenersBySession.delete(session);
        }
        if (this.#detachedFromTargetListenersBySession.has(session)) {
            session.off('Target.detachedFromTarget', this.#detachedFromTargetListenersBySession.get(session));
            this.#detachedFromTargetListenersBySession.delete(session);
        }
    }
    #onSessionDetached = (session) => {
        this.#removeAttachmentListeners(session);
    };
    #onTargetCreated = async (event) => {
        this.#discoveredTargetsByTargetId.set(event.targetInfo.targetId, event.targetInfo);
        this.emit("targetDiscovered" /* TargetManagerEvent.TargetDiscovered */, event.targetInfo);
        // The connection is already attached to the browser target implicitly,
        // therefore, no new CDPSession is created and we have special handling
        // here.
        if (event.targetInfo.type === 'browser' && event.targetInfo.attached) {
            if (this.#attachedTargetsByTargetId.has(event.targetInfo.targetId)) {
                return;
            }
            const target = this.#targetFactory(event.targetInfo, undefined);
            target._initialize();
            this.#attachedTargetsByTargetId.set(event.targetInfo.targetId, target);
        }
    };
    #onTargetDestroyed = (event) => {
        const targetInfo = this.#discoveredTargetsByTargetId.get(event.targetId);
        this.#discoveredTargetsByTargetId.delete(event.targetId);
        this.#finishInitializationIfReady(event.targetId);
        if (targetInfo?.type === 'service_worker' &&
            this.#attachedTargetsByTargetId.has(event.targetId)) {
            // Special case for service workers: report TargetGone event when
            // the worker is destroyed.
            const target = this.#attachedTargetsByTargetId.get(event.targetId);
            if (target) {
                this.emit("targetGone" /* TargetManagerEvent.TargetGone */, target);
                this.#attachedTargetsByTargetId.delete(event.targetId);
            }
        }
    };
    #onTargetInfoChanged = (event) => {
        this.#discoveredTargetsByTargetId.set(event.targetInfo.targetId, event.targetInfo);
        if (this.#ignoredTargets.has(event.targetInfo.targetId) ||
            !this.#attachedTargetsByTargetId.has(event.targetInfo.targetId) ||
            !event.targetInfo.attached) {
            return;
        }
        const target = this.#attachedTargetsByTargetId.get(event.targetInfo.targetId);
        if (!target) {
            return;
        }
        const previousURL = target.url();
        const wasInitialized = target._initializedDeferred.value() === InitializationStatus.SUCCESS;
        if (isPageTargetBecomingPrimary(target, event.targetInfo)) {
            const session = target?._session();
            assert(session, 'Target that is being activated is missing a CDPSession.');
            session.parentSession()?.emit(CDPSessionEvent.Swapped, session);
        }
        target._targetInfoChanged(event.targetInfo);
        if (wasInitialized && previousURL !== target.url()) {
            this.emit("targetChanged" /* TargetManagerEvent.TargetChanged */, {
                target,
                wasInitialized,
                previousURL,
            });
        }
    };
    #onAttachedToTarget = async (parentSession, event) => {
        const targetInfo = event.targetInfo;
        const session = this.#connection.session(event.sessionId);
        if (!session) {
            throw new Error(`Session ${event.sessionId} was not created.`);
        }
        const silentDetach = async () => {
            await session.send('Runtime.runIfWaitingForDebugger').catch(debugError);
            // We don't use `session.detach()` because that dispatches all commands on
            // the connection instead of the parent session.
            await parentSession
                .send('Target.detachFromTarget', {
                sessionId: session.id(),
            })
                .catch(debugError);
        };
        if (!this.#connection.isAutoAttached(targetInfo.targetId)) {
            return;
        }
        // Special case for service workers: being attached to service workers will
        // prevent them from ever being destroyed. Therefore, we silently detach
        // from service workers unless the connection was manually created via
        // `page.worker()`. To determine this, we use
        // `this.#connection.isAutoAttached(targetInfo.targetId)`. In the future, we
        // should determine if a target is auto-attached or not with the help of
        // CDP.
        if (targetInfo.type === 'service_worker') {
            this.#finishInitializationIfReady(targetInfo.targetId);
            await silentDetach();
            if (this.#attachedTargetsByTargetId.has(targetInfo.targetId)) {
                return;
            }
            const target = this.#targetFactory(targetInfo);
            target._initialize();
            this.#attachedTargetsByTargetId.set(targetInfo.targetId, target);
            this.emit("targetAvailable" /* TargetManagerEvent.TargetAvailable */, target);
            return;
        }
        const isExistingTarget = this.#attachedTargetsByTargetId.has(targetInfo.targetId);
        const target = isExistingTarget
            ? this.#attachedTargetsByTargetId.get(targetInfo.targetId)
            : this.#targetFactory(targetInfo, session, parentSession instanceof CDPSession ? parentSession : undefined);
        if (this.#targetFilterCallback && !this.#targetFilterCallback(target)) {
            this.#ignoredTargets.add(targetInfo.targetId);
            this.#finishInitializationIfReady(targetInfo.targetId);
            await silentDetach();
            return;
        }
        this.#setupAttachmentListeners(session);
        if (isExistingTarget) {
            session._setTarget(target);
            this.#attachedTargetsBySessionId.set(session.id(), this.#attachedTargetsByTargetId.get(targetInfo.targetId));
        }
        else {
            target._initialize();
            this.#attachedTargetsByTargetId.set(targetInfo.targetId, target);
            this.#attachedTargetsBySessionId.set(session.id(), target);
        }
        parentSession.emit(CDPSessionEvent.Ready, session);
        this.#targetsIdsForInit.delete(target._targetId);
        if (!isExistingTarget) {
            this.emit("targetAvailable" /* TargetManagerEvent.TargetAvailable */, target);
        }
        this.#finishInitializationIfReady();
        // TODO: the browser might be shutting down here. What do we do with the
        // error?
        await Promise.all([
            session.send('Target.setAutoAttach', {
                waitForDebuggerOnStart: true,
                flatten: true,
                autoAttach: true,
                filter: this.#discoveryFilter,
            }),
            session.send('Runtime.runIfWaitingForDebugger'),
        ]).catch(debugError);
    };
    #finishInitializationIfReady(targetId) {
        targetId !== undefined && this.#targetsIdsForInit.delete(targetId);
        if (this.#targetsIdsForInit.size === 0) {
            this.#initializeDeferred.resolve();
        }
    }
    #onDetachedFromTarget = (_parentSession, event) => {
        const target = this.#attachedTargetsBySessionId.get(event.sessionId);
        this.#attachedTargetsBySessionId.delete(event.sessionId);
        if (!target) {
            return;
        }
        this.#attachedTargetsByTargetId.delete(target._targetId);
        this.emit("targetGone" /* TargetManagerEvent.TargetGone */, target);
    };
}
//# sourceMappingURL=ChromeTargetManager.js.map