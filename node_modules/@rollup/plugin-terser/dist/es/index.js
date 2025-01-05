import { isMainThread, parentPort, workerData, Worker } from 'worker_threads';
import { isObject, hasOwnProperty, merge } from 'smob';
import { minify } from 'terser';
import { fileURLToPath } from 'url';
import { AsyncResource } from 'async_hooks';
import { cpus } from 'os';
import { EventEmitter } from 'events';
import serializeJavascript from 'serialize-javascript';

const taskInfo = Symbol('taskInfo');
const freeWorker = Symbol('freeWorker');
const workerPoolWorkerFlag = 'WorkerPoolWorker';

/**
 * Duck typing worker context.
 *
 * @param input
 */
function isWorkerContextSerialized(input) {
    return (isObject(input) &&
        hasOwnProperty(input, 'code') &&
        typeof input.code === 'string' &&
        hasOwnProperty(input, 'options') &&
        typeof input.options === 'string');
}
function runWorker() {
    if (isMainThread || !parentPort || workerData !== workerPoolWorkerFlag) {
        return;
    }
    // eslint-disable-next-line no-eval
    const eval2 = eval;
    parentPort.on('message', async (data) => {
        if (!isWorkerContextSerialized(data)) {
            return;
        }
        const options = eval2(`(${data.options})`);
        const result = await minify(data.code, options);
        const output = {
            code: result.code || data.code,
            nameCache: options.nameCache
        };
        if (typeof result.map === 'string') {
            output.sourceMap = JSON.parse(result.map);
        }
        if (isObject(result.map)) {
            output.sourceMap = result.map;
        }
        parentPort === null || parentPort === void 0 ? void 0 : parentPort.postMessage(output);
    });
}

class WorkerPoolTaskInfo extends AsyncResource {
    constructor(callback) {
        super('WorkerPoolTaskInfo');
        this.callback = callback;
    }
    done(err, result) {
        this.runInAsyncScope(this.callback, null, err, result);
        this.emitDestroy();
    }
}
class WorkerPool extends EventEmitter {
    constructor(options) {
        super();
        this.tasks = [];
        this.workers = [];
        this.freeWorkers = [];
        this.maxInstances = options.maxWorkers || cpus().length;
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
        const worker = new Worker(this.filePath, {
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
                    filePath: fileURLToPath(import.meta.url),
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
                    options: merge({}, options || {}, defaultOptions)
                });
                if (options.nameCache && nameCache) {
                    let vars = {
                        props: {}
                    };
                    if (hasOwnProperty(options.nameCache, 'vars') && isObject(options.nameCache.vars)) {
                        vars = merge({}, options.nameCache.vars || {}, vars);
                    }
                    if (hasOwnProperty(nameCache, 'vars') && isObject(nameCache.vars)) {
                        vars = merge({}, nameCache.vars, vars);
                    }
                    // eslint-disable-next-line no-param-reassign
                    options.nameCache.vars = vars;
                    let props = {};
                    if (hasOwnProperty(options.nameCache, 'props') && isObject(options.nameCache.props)) {
                        // eslint-disable-next-line prefer-destructuring
                        props = options.nameCache.props;
                    }
                    if (hasOwnProperty(nameCache, 'props') && isObject(nameCache.props)) {
                        props = merge({}, nameCache.props, props);
                    }
                    // eslint-disable-next-line no-param-reassign
                    options.nameCache.props = props;
                }
                if ((!!defaultOptions.sourceMap || !!options.sourceMap) && isObject(sourceMap)) {
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

export { terser as default };
//# sourceMappingURL=index.js.map
