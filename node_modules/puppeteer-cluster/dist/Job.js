"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const url_1 = require("url");
class Job {
    constructor(data, taskFunction, executeCallbacks) {
        this.lastError = null;
        this.tries = 0;
        this.data = data;
        this.taskFunction = taskFunction;
        this.executeCallbacks = executeCallbacks;
    }
    getUrl() {
        if (!this.data) {
            return undefined;
        }
        if (typeof this.data === 'string') {
            return this.data;
        }
        if (typeof this.data.url === 'string') {
            return this.data.url;
        }
        return undefined;
    }
    getDomain() {
        // TODO use tld.js to restrict to top-level domain?
        const urlStr = this.getUrl();
        if (urlStr) {
            try {
                const url = new url_1.URL(urlStr);
                return url.hostname || undefined;
            }
            catch (e) {
                // if urlStr is not a valid URL this might throw
                // but we leave this to the user
                return undefined;
            }
        }
        return undefined;
    }
    addError(error) {
        this.tries += 1;
        this.lastError = error;
    }
}
exports.default = Job;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiSm9iLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL0pvYi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUNBLDZCQUEwQjtBQVUxQixNQUFxQixHQUFHO0lBU3BCLFlBQ0ksSUFBYyxFQUNkLFlBQWdELEVBQ2hELGdCQUFtQztRQU4vQixjQUFTLEdBQWlCLElBQUksQ0FBQztRQUNoQyxVQUFLLEdBQVcsQ0FBQyxDQUFDO1FBT3JCLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDO1FBQ2pCLElBQUksQ0FBQyxZQUFZLEdBQUcsWUFBWSxDQUFDO1FBQ2pDLElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxnQkFBZ0IsQ0FBQztJQUM3QyxDQUFDO0lBRU0sTUFBTTtRQUNULElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7WUFDYixPQUFPLFNBQVMsQ0FBQztRQUNyQixDQUFDO1FBQ0QsSUFBSSxPQUFPLElBQUksQ0FBQyxJQUFJLEtBQUssUUFBUSxFQUFFLENBQUM7WUFDaEMsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDO1FBQ3JCLENBQUM7UUFDRCxJQUFJLE9BQVEsSUFBSSxDQUFDLElBQVksQ0FBQyxHQUFHLEtBQUssUUFBUSxFQUFFLENBQUM7WUFDN0MsT0FBUSxJQUFJLENBQUMsSUFBWSxDQUFDLEdBQUcsQ0FBQztRQUNsQyxDQUFDO1FBQ0QsT0FBTyxTQUFTLENBQUM7SUFDckIsQ0FBQztJQUVNLFNBQVM7UUFDWixtREFBbUQ7UUFDbkQsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO1FBQzdCLElBQUksTUFBTSxFQUFFLENBQUM7WUFDVCxJQUFJLENBQUM7Z0JBQ0QsTUFBTSxHQUFHLEdBQUcsSUFBSSxTQUFHLENBQUMsTUFBTSxDQUFDLENBQUM7Z0JBQzVCLE9BQU8sR0FBRyxDQUFDLFFBQVEsSUFBSSxTQUFTLENBQUM7WUFDckMsQ0FBQztZQUFDLE9BQU8sQ0FBTSxFQUFFLENBQUM7Z0JBQ2QsZ0RBQWdEO2dCQUNoRCxnQ0FBZ0M7Z0JBQ2hDLE9BQU8sU0FBUyxDQUFDO1lBQ3JCLENBQUM7UUFDTCxDQUFDO1FBQ0QsT0FBTyxTQUFTLENBQUM7SUFDckIsQ0FBQztJQUVNLFFBQVEsQ0FBQyxLQUFZO1FBQ3hCLElBQUksQ0FBQyxLQUFLLElBQUksQ0FBQyxDQUFDO1FBQ2hCLElBQUksQ0FBQyxTQUFTLEdBQUcsS0FBSyxDQUFDO0lBQzNCLENBQUM7Q0FFSjtBQXJERCxzQkFxREMifQ==