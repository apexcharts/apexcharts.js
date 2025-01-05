"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const util_1 = require("./util");
const util_2 = require("util");
const debug = (0, util_1.debugGenerator)('Worker');
const BROWSER_INSTANCE_TRIES = 10;
class Worker {
    constructor({ cluster, args, id, browser }) {
        this.activeTarget = null;
        this.cluster = cluster;
        this.args = args;
        this.id = id;
        this.browser = browser;
        debug(`Starting #${this.id}`);
    }
    handle(task, job, timeout) {
        return __awaiter(this, void 0, void 0, function* () {
            this.activeTarget = job;
            let jobInstance = null;
            let page = null;
            let tries = 0;
            while (jobInstance === null) {
                try {
                    jobInstance = yield this.browser.jobInstance();
                    page = jobInstance.resources.page;
                }
                catch (err) {
                    debug(`Error getting browser page (try: ${tries}), message: ${err.message}`);
                    yield this.browser.repair();
                    tries += 1;
                    if (tries >= BROWSER_INSTANCE_TRIES) {
                        throw new Error('Unable to get browser page');
                    }
                }
            }
            // We can be sure that page is set now, otherwise an exception would've been thrown
            page = page; // this is just for TypeScript
            let errorState = null;
            page.on('error', (err) => {
                errorState = err;
                (0, util_1.log)(`Error (page error) crawling ${(0, util_2.inspect)(job.data)} // message: ${err.message}`);
            });
            debug(`Executing task on worker #${this.id} with data: ${(0, util_2.inspect)(job.data)}`);
            let result;
            try {
                result = yield (0, util_1.timeoutExecute)(timeout, task({
                    page,
                    // data might be undefined if queue is only called with a function
                    // we ignore that case, as the user should use Cluster<undefined> in that case
                    // to get correct typings
                    data: job.data,
                    worker: {
                        id: this.id,
                    },
                }));
            }
            catch (err) {
                errorState = err;
                (0, util_1.log)(`Error crawling ${(0, util_2.inspect)(job.data)} // message: ${err.message}`);
            }
            debug(`Finished executing task on worker #${this.id}`);
            try {
                yield jobInstance.close();
            }
            catch (e) {
                debug(`Error closing browser instance for ${(0, util_2.inspect)(job.data)}: ${e.message}`);
                yield this.browser.repair();
            }
            this.activeTarget = null;
            if (errorState) {
                return {
                    type: 'error',
                    error: errorState || new Error('asf'),
                };
            }
            return {
                data: result,
                type: 'success',
            };
        });
    }
    close() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.browser.close();
            }
            catch (err) {
                debug(`Unable to close worker browser. Error message: ${err.message}`);
            }
            debug(`Closed #${this.id}`);
        });
    }
}
exports.default = Worker;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiV29ya2VyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL1dvcmtlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQUlBLGlDQUE2RDtBQUM3RCwrQkFBK0I7QUFHL0IsTUFBTSxLQUFLLEdBQUcsSUFBQSxxQkFBYyxFQUFDLFFBQVEsQ0FBQyxDQUFDO0FBU3ZDLE1BQU0sc0JBQXNCLEdBQUcsRUFBRSxDQUFDO0FBY2xDLE1BQXFCLE1BQU07SUFTdkIsWUFBbUIsRUFBRSxPQUFPLEVBQUUsSUFBSSxFQUFFLEVBQUUsRUFBRSxPQUFPLEVBQWlCO1FBRmhFLGlCQUFZLEdBQW9DLElBQUksQ0FBQztRQUdqRCxJQUFJLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQztRQUN2QixJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQztRQUNqQixJQUFJLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQztRQUNiLElBQUksQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFDO1FBRXZCLEtBQUssQ0FBQyxhQUFhLElBQUksQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO0lBQ2xDLENBQUM7SUFFWSxNQUFNLENBQ1gsSUFBdUMsRUFDdkMsR0FBNkIsRUFDN0IsT0FBZTs7WUFFbkIsSUFBSSxDQUFDLFlBQVksR0FBRyxHQUFHLENBQUM7WUFFeEIsSUFBSSxXQUFXLEdBQXVCLElBQUksQ0FBQztZQUMzQyxJQUFJLElBQUksR0FBZ0IsSUFBSSxDQUFDO1lBRTdCLElBQUksS0FBSyxHQUFHLENBQUMsQ0FBQztZQUVkLE9BQU8sV0FBVyxLQUFLLElBQUksRUFBRSxDQUFDO2dCQUMxQixJQUFJLENBQUM7b0JBQ0QsV0FBVyxHQUFHLE1BQU0sSUFBSSxDQUFDLE9BQU8sQ0FBQyxXQUFXLEVBQUUsQ0FBQztvQkFDL0MsSUFBSSxHQUFHLFdBQVcsQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDO2dCQUN0QyxDQUFDO2dCQUFDLE9BQU8sR0FBUSxFQUFFLENBQUM7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