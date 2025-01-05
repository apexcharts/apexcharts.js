import { CDPSessionEvent } from '../api/CDPSession.js';
import { TargetType } from '../api/Target.js';
import { WebWorker } from '../api/WebWorker.js';
import { TimeoutSettings } from '../common/TimeoutSettings.js';
import { debugError } from '../common/util.js';
import { ExecutionContext } from './ExecutionContext.js';
import { IsolatedWorld } from './IsolatedWorld.js';
import { CdpJSHandle } from './JSHandle.js';
/**
 * @internal
 */
export class CdpWebWorker extends WebWorker {
    #world;
    #client;
    #id;
    #targetType;
    constructor(client, url, targetId, targetType, consoleAPICalled, exceptionThrown) {
        super(url);
        this.#id = targetId;
        this.#client = client;
        this.#targetType = targetType;
        this.#world = new IsolatedWorld(this, new TimeoutSettings());
        this.#client.once('Runtime.executionContextCreated', async (event) => {
            this.#world.setContext(new ExecutionContext(client, event.context, this.#world));
        });
        this.#world.emitter.on('consoleapicalled', async (event) => {
            try {
                return consoleAPICalled(event.type, event.args.map((object) => {
                    return new CdpJSHandle(this.#world, object);
                }), event.stackTrace);
            }
            catch (err) {
                debugError(err);
            }
        });
        this.#client.on('Runtime.exceptionThrown', exceptionThrown);
        this.#client.once(CDPSessionEvent.Disconnected, () => {
            this.#world.dispose();
        });
        // This might fail if the target is closed before we receive all execution contexts.
        this.#client.send('Runtime.enable').catch(debugError);
    }
    mainRealm() {
        return this.#world;
    }
    get client() {
        return this.#client;
    }
    async close() {
        switch (this.#targetType) {
            case TargetType.SERVICE_WORKER:
            case TargetType.SHARED_WORKER: {
                // For service and shared workers we need to close the target and detach to allow
                // the worker to stop.
                await this.client.connection()?.send('Target.closeTarget', {
                    targetId: this.#id,
                });
                await this.client.connection()?.send('Target.detachFromTarget', {
                    sessionId: this.client.id(),
                });
                break;
            }
            default:
                await this.evaluate(() => {
                    self.close();
                });
        }
    }
}
//# sourceMappingURL=WebWorker.js.map