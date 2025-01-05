"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CdpWebWorker = void 0;
const CDPSession_js_1 = require("../api/CDPSession.js");
const Target_js_1 = require("../api/Target.js");
const WebWorker_js_1 = require("../api/WebWorker.js");
const TimeoutSettings_js_1 = require("../common/TimeoutSettings.js");
const util_js_1 = require("../common/util.js");
const ExecutionContext_js_1 = require("./ExecutionContext.js");
const IsolatedWorld_js_1 = require("./IsolatedWorld.js");
const JSHandle_js_1 = require("./JSHandle.js");
/**
 * @internal
 */
class CdpWebWorker extends WebWorker_js_1.WebWorker {
    #world;
    #client;
    #id;
    #targetType;
    constructor(client, url, targetId, targetType, consoleAPICalled, exceptionThrown) {
        super(url);
        this.#id = targetId;
        this.#client = client;
        this.#targetType = targetType;
        this.#world = new IsolatedWorld_js_1.IsolatedWorld(this, new TimeoutSettings_js_1.TimeoutSettings());
        this.#client.once('Runtime.executionContextCreated', async (event) => {
            this.#world.setContext(new ExecutionContext_js_1.ExecutionContext(client, event.context, this.#world));
        });
        this.#world.emitter.on('consoleapicalled', async (event) => {
            try {
                return consoleAPICalled(event.type, event.args.map((object) => {
                    return new JSHandle_js_1.CdpJSHandle(this.#world, object);
                }), event.stackTrace);
            }
            catch (err) {
                (0, util_js_1.debugError)(err);
            }
        });
        this.#client.on('Runtime.exceptionThrown', exceptionThrown);
        this.#client.once(CDPSession_js_1.CDPSessionEvent.Disconnected, () => {
            this.#world.dispose();
        });
        // This might fail if the target is closed before we receive all execution contexts.
        this.#client.send('Runtime.enable').catch(util_js_1.debugError);
    }
    mainRealm() {
        return this.#world;
    }
    get client() {
        return this.#client;
    }
    async close() {
        switch (this.#targetType) {
            case Target_js_1.TargetType.SERVICE_WORKER:
            case Target_js_1.TargetType.SHARED_WORKER: {
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
exports.CdpWebWorker = CdpWebWorker;
//# sourceMappingURL=WebWorker.js.map