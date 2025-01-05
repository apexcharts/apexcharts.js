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
const util_1 = require("../../util");
const ConcurrencyImplementation_1 = require("../ConcurrencyImplementation");
const debug = (0, util_1.debugGenerator)('BrowserConcurrency');
const BROWSER_TIMEOUT = 5000;
class Browser extends ConcurrencyImplementation_1.default {
    init() {
        return __awaiter(this, void 0, void 0, function* () { });
    }
    close() {
        return __awaiter(this, void 0, void 0, function* () { });
    }
    workerInstance(perBrowserOptions) {
        return __awaiter(this, void 0, void 0, function* () {
            const options = perBrowserOptions || this.options;
            let chrome = yield this.puppeteer.launch(options);
            let page;
            let context; // puppeteer typings are old...
            return {
                jobInstance: () => __awaiter(this, void 0, void 0, function* () {
                    yield (0, util_1.timeoutExecute)(BROWSER_TIMEOUT, (() => __awaiter(this, void 0, void 0, function* () {
                        context = yield chrome.createBrowserContext();
                        page = yield context.newPage();
                    }))());
                    return {
                        resources: {
                            page,
                        },
                        close: () => __awaiter(this, void 0, void 0, function* () {
                            yield (0, util_1.timeoutExecute)(BROWSER_TIMEOUT, context.close());
                        }),
                    };
                }),
                close: () => __awaiter(this, void 0, void 0, function* () {
                    yield chrome.close();
                }),
                repair: () => __awaiter(this, void 0, void 0, function* () {
                    debug('Starting repair');
                    try {
                        // will probably fail, but just in case the repair was not necessary
                        yield (0, util_1.timeoutExecute)(BROWSER_TIMEOUT, chrome.close());
                    }
                    catch (e) { }
                    // just relaunch as there is only one page per browser
                    chrome = yield this.puppeteer.launch(options);
                }),
            };
        });
    }
}
exports.default = Browser;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQnJvd3Nlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9jb25jdXJyZW5jeS9idWlsdC1pbi9Ccm93c2VyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBR0EscUNBQTREO0FBQzVELDRFQUF5RjtBQUN6RixNQUFNLEtBQUssR0FBRyxJQUFBLHFCQUFjLEVBQUMsb0JBQW9CLENBQUMsQ0FBQztBQUVuRCxNQUFNLGVBQWUsR0FBRyxJQUFJLENBQUM7QUFFN0IsTUFBcUIsT0FBUSxTQUFRLG1DQUF5QjtJQUM3QyxJQUFJOzhEQUFJLENBQUM7S0FBQTtJQUNULEtBQUs7OERBQUksQ0FBQztLQUFBO0lBRVYsY0FBYyxDQUFDLGlCQUFzRDs7WUFHOUUsTUFBTSxPQUFPLEdBQUcsaUJBQWlCLElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQztZQUNsRCxJQUFJLE1BQU0sR0FBRyxNQUFNLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBc0IsQ0FBQztZQUN2RSxJQUFJLElBQW9CLENBQUM7WUFDekIsSUFBSSxPQUFZLENBQUMsQ0FBQywrQkFBK0I7WUFFakQsT0FBTztnQkFDSCxXQUFXLEVBQUUsR0FBUyxFQUFFO29CQUNwQixNQUFNLElBQUEscUJBQWMsRUFBQyxlQUFlLEVBQUUsQ0FBQyxHQUFTLEVBQUU7d0JBQzlDLE9BQU8sR0FBRyxNQUFNLE1BQU0sQ0FBQyxvQkFBb0IsRUFBRSxDQUFDO3dCQUM5QyxJQUFJLEdBQUcsTUFBTSxPQUFPLENBQUMsT0FBTyxFQUFFLENBQUM7b0JBQ25DLENBQUMsQ0FBQSxDQUFDLEVBQUUsQ0FBQyxDQUFDO29CQUVOLE9BQU87d0JBQ0gsU0FBUyxFQUFFOzRCQUNQLElBQUk7eUJBQ1A7d0JBRUQsS0FBSyxFQUFFLEdBQVMsRUFBRTs0QkFDZCxNQUFNLElBQUEscUJBQWMsRUFBQyxlQUFlLEVBQUUsT0FBTyxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUM7d0JBQzNELENBQUMsQ0FBQTtxQkFDSixDQUFDO2dCQUNOLENBQUMsQ0FBQTtnQkFFRCxLQUFLLEVBQUUsR0FBUyxFQUFFO29CQUNkLE1BQU0sTUFBTSxDQUFDLEtBQUssRUFBRSxDQUFDO2dCQUN6QixDQUFDLENBQUE7Z0JBRUQsTUFBTSxFQUFFLEdBQVMsRUFBRTtvQkFDZixLQUFLLENBQUMsaUJBQWlCLENBQUMsQ0FBQztvQkFDekIsSUFBSSxDQUFDO3dCQUNELG9FQUFvRTt3QkFDcEUsTUFBTSxJQUFBLHFCQUFjLEVBQUMsZUFBZSxFQUFFLE1BQU0sQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDO29CQUMxRCxDQUFDO29CQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsQ0FBQSxDQUFDO29CQUVkLHNEQUFzRDtvQkFDdEQsTUFBTSxHQUFHLE1BQU0sSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUM7Z0JBQ2xELENBQUMsQ0FBQTthQUNKLENBQUM7UUFDTixDQUFDO0tBQUE7Q0FFSjtBQS9DRCwwQkErQ0MifQ==