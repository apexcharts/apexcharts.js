'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var worker_threads = require('worker_threads');
var smob = require('smob');
var terser$1 = require('terser');
var url = require('url');
var async_hooks = require('async_hooks');
var os = require('os');
var events = require('events');
var serializeJavascript = require('serialize-javascript');

var _documentCurrentScript = typeof document !== 'undefined' ? document.currentScript : null;
const taskInfo = Symbol('taskInfo');
const freeWorker = Symbol('freeWorker');
const workerPoolWorkerFlag = 'WorkerPoolWorker';

/**
 * Duck typing worker context.
 *
 * @param input
 */
function isWorkerContextSerialized(input) {
    return (smob.isObject(input) &&
        smob.hasOwnProperty(input, 'code') &&
        typeof input.code === 'string' &&
        smob.hasOwnProperty(input, 'options') &&
        typeof input.options === 'string');
}
function runWorker() {
    if (worker_threads.isMainThread || !worker_threads.parentPort || worker_threads.workerData !== workerPoolWorkerFlag) {
        return;
    }
    // eslint-disable-next-line no-eval
    const eval2 = eval;
    worker_threads.parentPort.on('message', async (data) => {
        if (!isWorkerContextSerialized(data)) {
            return;
        }
        const options = eval2(`(${data.options})`);
        const result = await terser$1.minify(data.code, options);
        const output = {
            code: result.code || data.code,
            nameCache: options.nameCache
        };
        if (typeof result.map === 'string') {
            output.sourceMap = JSON.parse(result.map);
        }
        if (smob.isObject(result.map)) {
            output.sourceMap = result.map;
        }
        worker_threads.parentPort === null || worker_threads.parentPort === void 0 ? void 0 : worker_threads.parentPort.postMessage(output);
    });
}

class WorkerPoolTaskInfo extends async_hooks.AsyncResource {
    constructor(callback) {
        super('WorkerPoolTaskInfo');
        this.callback = callback;
    }
    done(err, result) {
        this.runInAsyncScope(this.callback, null, err, result);
        this.emitDestroy();
    }
}
class WorkerPool extends events.EventEmitter {
    constructor(options) {
        super();
        this.tasks = [];
        this.workers = [];
        this.freeWorkers = [];
        this.maxInstances = options.maxWorkers || os.cpus().length;
        this.filePath = options.filePath;
        this.on(freeWorker, () => {
            if (this.tasks.length > 0) {
                const { context, cb } = this.tasks.shift();
                this.runTask(context, cb);
            }
        });
    }
    get numWorkers() {
        return this.workers.length;
    }
    addAsync(context) {
        return new Promise((resolve, reject) => {
            this.runTask(context, (err, output) => {
                if (err) {
                    reject(err);
                    return;
                }
                if (!output) {
                    reject(new Error('The output is empty'));
                    return;
                }
                resolve(output);
            });
        });
    }
    close() {
        for (let i = 0; i < this.workers.length; i++) {
            const worker = this.workers[i];
            worker.terminate();
        }
    }
    addNewWorker() {
        const worker = new worker_threads.Worker(this.filePath, {
            workerData: workerPoolWorkerFlag
        });
        worker.on('message', (result) => {
            var _a;
            (_a = worker[taskInfo]) === null || _a === void 0 ? void 0 : _a.done(null, result);
            worker[taskInfo] = null;
            this.freeWorkers.push(worker);
            this.emit(freeWorker);
        });
        worker.on('error', (err) => {
            if (worker[taskInfo]) {
                worker[taskInfo].done(err, null);
            }
            else {
                this.emit('error', err);
            }
            this.workers.splice(this.workers.indexOf(worker), 1);
            this.addNewWorker();
        });
        this.workers.push(worker);
        this.freeWorkers.push(worker);
        this.emit(freeWorker);
    }
    runTask(context, cb) {
        if (this.freeWorkers.length === 0) {
            this.tasks.push({ context, cb });
            if (this.numWorkers < this.maxInstances) {
                this.addNewWorker();
            }
            return;
        }
        const worker = this.freeWorkers.pop();
        if (worker) {
            worker[taskInfo] = new WorkerPoolTaskInfo(cb);
            worker.postMessage({
                code: context.code,
                options: serializeJavascript(context.options)
            });
        }
    }
}

function terser(input = {}) {
    const { maxWorkers, ...options } = input;
    let workerPool;
    let numOfChunks = 0;
    let numOfWorkersUsed = 0;
    return {
        name: 'terser',
        async renderChunk(code, chunk, outputOptions) {
            if (!workerPool) {
                workerPool = new WorkerPool({
                    filePath: url.fileURLToPath((typeof document === 'undefined' ? require('u' + 'rl').pathToFileURL(__filename).href : (_documentCurrentScript && _documentCurrentScript.src || new URL('index.js', document.baseURI).href))),
                    maxWorkers
                });
            }
            numOfChunks += 1;
            const defaultOptions = {
                sourceMap: outputOptions.sourcemap === true || typeof outputOptions.sourcemap === 'string'
            };
            if (outputOptions.format === 'es') {
                defaultOptions.module = true;
            }
            if (outputOptions.format === 'cjs') {
                defaultOptions.toplevel = true;
            }
            try {
                const { code: result, nameCache, sourceMap } = await workerPool.addAsync({
                    code,
                    options: smob.merge({}, options || {}, defaultOptions)
                });
                if (options.nameCache && nameCache) {
                    let vars = {
                        props: {}
                    };
                    if (smob.hasOwnProperty(options.nameCache, 'vars') && smob.isObject(options.nameCache.vars)) {
                        vars = smob.merge({}, options.nameCache.vars || {}, vars);
                    }
                    if (smob.hasOwnProperty(nameCache, 'vars') && smob.isObject(nameCache.vars)) {
                        vars = smob.merge({}, nameCache.vars, vars);
                    }
                    // eslint-disable-next-line no-param-reassign
                    options.nameCache.vars = vars;
                    let props = {};
                    if (smob.hasOwnProperty(options.nameCache, 'props') && smob.isObject(options.nameCache.props)) {
                        // eslint-disable-next-line prefer-destructuring
                        props = options.nameCache.props;
                    }
                    if (smob.hasOwnProperty(nameCache, 'props') && smob.isObject(nameCache.props)) {
                        props = smob.merge({}, nameCache.props, props);
                    }
                    // eslint-disable-next-line no-param-reassign
                    options.nameCache.props = props;
                }
                if ((!!defaultOptions.sourceMap || !!options.sourceMap) && smob.isObject(sourceMap)) {
                    return {
                        code: result,
                        map: sourceMap
                    };
                }
                return result;
            }
            catch (e) {
                return Promise.reject(e);
            }
            finally {
                numOfChunks -= 1;
                if (numOfChunks === 0) {
                    numOfWorkersUsed = workerPool.numWorkers;
                    workerPool.close();
                    workerPool = null;
                }
            }
        },
        get numOfWorkersUsed() {
            return numOfWorkersUsed;
        }
    };
}

runWorker();

exports.default = terser;
module.exports = Object.assign(exports.default, exports);
//# sourceMappingURL=index.js.map
