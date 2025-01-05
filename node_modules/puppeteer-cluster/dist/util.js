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
exports.log = exports.debugGenerator = exports.timeoutExecute = exports.formatDuration = exports.formatDateTime = void 0;
const Debug = require("debug");
function timeUnit(step, name) {
    return { step, name };
}
const TIME_UNITS = [
    timeUnit(1, 'ms'),
    timeUnit(1000, 'seconds'),
    timeUnit(60, 'minutes'),
    timeUnit(60, 'hours'),
    timeUnit(24, 'days'),
    timeUnit(31, 'months'),
    timeUnit((365 / 31), 'years'),
];
const TIME_UNIT_THRESHOLD = 0.95;
function padDate(value, num) {
    const str = value.toString();
    if (str.length >= num) {
        return str;
    }
    const zeroesToAdd = num - str.length;
    return '0'.repeat(zeroesToAdd) + str;
}
function formatDateTime(datetime) {
    const date = (typeof datetime === 'number') ? new Date(datetime) : datetime;
    const dateStr = `${date.getFullYear()}`
        + `-${padDate(date.getMonth() + 1, 2)}`
        + `-${padDate(date.getDate(), 2)}`;
    const timeStr = `${padDate(date.getHours(), 2)}`
        + `:${padDate(date.getMinutes(), 2)}`
        + `:${padDate(date.getSeconds(), 2)}`
        + `.${padDate(date.getMilliseconds(), 3)}`;
    return `${dateStr} ${timeStr}`;
}
exports.formatDateTime = formatDateTime;
function formatDuration(millis) {
    if (millis < 0) {
        return 'unknown';
    }
    let remaining = millis;
    let nextUnitIndex = 1;
    while (nextUnitIndex < TIME_UNITS.length &&
        remaining / TIME_UNITS[nextUnitIndex].step >= TIME_UNIT_THRESHOLD) {
        remaining = remaining / TIME_UNITS[nextUnitIndex].step;
        nextUnitIndex += 1;
    }
    return `${remaining.toFixed(1)} ${TIME_UNITS[nextUnitIndex - 1].name}`;
}
exports.formatDuration = formatDuration;
function timeoutExecute(millis, promise) {
    return __awaiter(this, void 0, void 0, function* () {
        let timeout = null;
        const result = yield Promise.race([
            (() => __awaiter(this, void 0, void 0, function* () {
                yield new Promise((resolve) => {
                    timeout = setTimeout(resolve, millis);
                });
                throw new Error(`Timeout hit: ${millis}`);
            }))(),
            (() => __awaiter(this, void 0, void 0, function* () {
                try {
                    return yield promise;
                }
                catch (error) {
                    // Cancel timeout in error case
                    clearTimeout(timeout);
                    throw error;
                }
            }))(),
        ]);
        clearTimeout(timeout); // is there a better way?
        return result;
    });
}
exports.timeoutExecute = timeoutExecute;
function debugGenerator(namespace) {
    const debug = Debug(`puppeteer-cluster: ${namespace}`);
    return debug;
}
exports.debugGenerator = debugGenerator;
const logToConsole = Debug('puppeteer-cluster:log');
logToConsole.log = console.error.bind(console);
function log(msg) {
    logToConsole(msg);
}
exports.log = log;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy91dGlsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7OztBQUNBLCtCQUErQjtBQU8vQixTQUFTLFFBQVEsQ0FBQyxJQUFZLEVBQUUsSUFBWTtJQUN4QyxPQUFPLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxDQUFDO0FBQzFCLENBQUM7QUFFRCxNQUFNLFVBQVUsR0FBZTtJQUMzQixRQUFRLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQztJQUNqQixRQUFRLENBQUMsSUFBSSxFQUFFLFNBQVMsQ0FBQztJQUN6QixRQUFRLENBQUMsRUFBRSxFQUFFLFNBQVMsQ0FBQztJQUN2QixRQUFRLENBQUMsRUFBRSxFQUFFLE9BQU8sQ0FBQztJQUNyQixRQUFRLENBQUMsRUFBRSxFQUFFLE1BQU0sQ0FBQztJQUNwQixRQUFRLENBQUMsRUFBRSxFQUFFLFFBQVEsQ0FBQztJQUN0QixRQUFRLENBQUMsQ0FBQyxHQUFHLEdBQUcsRUFBRSxDQUFDLEVBQUUsT0FBTyxDQUFDO0NBQ2hDLENBQUM7QUFFRixNQUFNLG1CQUFtQixHQUFHLElBQUksQ0FBQztBQUVqQyxTQUFTLE9BQU8sQ0FBQyxLQUFvQixFQUFFLEdBQVc7SUFDOUMsTUFBTSxHQUFHLEdBQUcsS0FBSyxDQUFDLFFBQVEsRUFBRSxDQUFDO0lBQzdCLElBQUksR0FBRyxDQUFDLE1BQU0sSUFBSSxHQUFHLEVBQUUsQ0FBQztRQUNwQixPQUFPLEdBQUcsQ0FBQztJQUNmLENBQUM7SUFDRCxNQUFNLFdBQVcsR0FBRyxHQUFHLEdBQUcsR0FBRyxDQUFDLE1BQU0sQ0FBQztJQUNyQyxPQUFPLEdBQUcsQ0FBQyxNQUFNLENBQUMsV0FBVyxDQUFDLEdBQUcsR0FBRyxDQUFDO0FBQ3pDLENBQUM7QUFFRCxTQUFnQixjQUFjLENBQUMsUUFBdUI7SUFDbEQsTUFBTSxJQUFJLEdBQUcsQ0FBQyxPQUFPLFFBQVEsS0FBSyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQztJQUU1RSxNQUFNLE9BQU8sR0FBRyxHQUFHLElBQUksQ0FBQyxXQUFXLEVBQUUsRUFBRTtVQUNqQyxJQUFJLE9BQU8sQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFO1VBQ3JDLElBQUksT0FBTyxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDO0lBQ3ZDLE1BQU0sT0FBTyxHQUFHLEdBQUcsT0FBTyxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsRUFBRSxDQUFDLENBQUMsRUFBRTtVQUMxQyxJQUFJLE9BQU8sQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFLEVBQUUsQ0FBQyxDQUFDLEVBQUU7VUFDbkMsSUFBSSxPQUFPLENBQUMsSUFBSSxDQUFDLFVBQVUsRUFBRSxFQUFFLENBQUMsQ0FBQyxFQUFFO1VBQ25DLElBQUksT0FBTyxDQUFDLElBQUksQ0FBQyxlQUFlLEVBQUUsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDO0lBRS9DLE9BQU8sR0FBRyxPQUFPLElBQUksT0FBTyxFQUFFLENBQUM7QUFDbkMsQ0FBQztBQVpELHdDQVlDO0FBRUQsU0FBZ0IsY0FBYyxDQUFDLE1BQWM7SUFDekMsSUFBSSxNQUFNLEdBQUcsQ0FBQyxFQUFFLENBQUM7UUFDYixPQUFPLFNBQVMsQ0FBQztJQUNyQixDQUFDO0lBRUQsSUFBSSxTQUFTLEdBQUcsTUFBTSxDQUFDO0lBQ3ZCLElBQUksYUFBYSxHQUFHLENBQUMsQ0FBQztJQUN0QixPQUFPLGFBQWEsR0FBRyxVQUFVLENBQUMsTUFBTTtRQUNoQyxTQUFTLEdBQUcsVUFBVSxDQUFDLGFBQWEsQ0FBQyxDQUFDLElBQUksSUFBSSxtQkFBbUIsRUFBRSxDQUFDO1FBQ3hFLFNBQVMsR0FBRyxTQUFTLEdBQUcsVUFBVSxDQUFDLGFBQWEsQ0FBQyxDQUFDLElBQUksQ0FBQztRQUN2RCxhQUFhLElBQUksQ0FBQyxDQUFDO0lBQ3ZCLENBQUM7SUFFRCxPQUFPLEdBQUcsU0FBUyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsSUFBSSxVQUFVLENBQUMsYUFBYSxHQUFHLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDO0FBQzNFLENBQUM7QUFkRCx3Q0FjQztBQUVELFNBQXNCLGNBQWMsQ0FBSSxNQUFjLEVBQUUsT0FBbUI7O1FBRXZFLElBQUksT0FBTyxHQUEwQixJQUFJLENBQUM7UUFFMUMsTUFBTSxNQUFNLEdBQUcsTUFBTSxPQUFPLENBQUMsSUFBSSxDQUFDO1lBQzlCLENBQUMsR0FBUyxFQUFFO2dCQUNSLE1BQU0sSUFBSSxPQUFPLENBQUMsQ0FBQyxPQUFPLEVBQUUsRUFBRTtvQkFDMUIsT0FBTyxHQUFHLFVBQVUsQ0FBQyxPQUFPLEVBQUUsTUFBTSxDQUFDLENBQUM7Z0JBQzFDLENBQUMsQ0FBQyxDQUFDO2dCQUNILE1BQU0sSUFBSSxLQUFLLENBQUMsZ0JBQWdCLE1BQU0sRUFBRSxDQUFDLENBQUM7WUFDOUMsQ0FBQyxDQUFBLENBQUMsRUFBRTtZQUNKLENBQUMsR0FBUyxFQUFFO2dCQUNSLElBQUksQ0FBQztvQkFDRCxPQUFPLE1BQU0sT0FBTyxDQUFDO2dCQUN6QixDQUFDO2dCQUFDLE9BQU8sS0FBVSxFQUFFLENBQUM7b0JBQ2xCLCtCQUErQjtvQkFDL0IsWUFBWSxDQUFDLE9BQWdDLENBQUMsQ0FBQztvQkFDL0MsTUFBTSxLQUFLLENBQUM7Z0JBQ2hCLENBQUM7WUFDTCxDQUFDLENBQUEsQ0FBQyxFQUFFO1NBQ1AsQ0FBQyxDQUFDO1FBQ0gsWUFBWSxDQUFDLE9BQWdDLENBQUMsQ0FBQyxDQUFDLHlCQUF5QjtRQUN6RSxPQUFPLE1BQU0sQ0FBQztJQUNsQixDQUFDO0NBQUE7QUF2QkQsd0NBdUJDO0FBRUQsU0FBZ0IsY0FBYyxDQUFDLFNBQWlCO0lBQzVDLE1BQU0sS0FBSyxHQUFHLEtBQUssQ0FBQyxzQkFBc0IsU0FBUyxFQUFFLENBQUMsQ0FBQztJQUN2RCxPQUFPLEtBQUssQ0FBQztBQUNqQixDQUFDO0FBSEQsd0NBR0M7QUFFRCxNQUFNLFlBQVksR0FBRyxLQUFLLENBQUMsdUJBQXVCLENBQUMsQ0FBQztBQUNwRCxZQUFZLENBQUMsR0FBRyxHQUFHLE9BQU8sQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0FBRS9DLFNBQWdCLEdBQUcsQ0FBQyxHQUFXO0lBQzNCLFlBQVksQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUN0QixDQUFDO0FBRkQsa0JBRUMifQ==