"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const os = require("os");
const INIT_INTERVAL = 50;
const MEASURE_INTERVAL = 200;
// timespan of which to measure load
// must be a multiple of MEASURE_INTERVAL
const MEASURE_TIMESPAN = 5000;
const loadListSize = MEASURE_TIMESPAN / MEASURE_INTERVAL;
class SystemMonitor {
    constructor() {
        this.cpuUsage = 0;
        this.memoryUsage = 0;
        this.loads = [];
        this.interval = null;
    }
    // After init is called there is at least something in the cpuUsage thingy
    init() {
        this.calcLoad();
        return new Promise((resolve) => {
            setTimeout(() => {
                this.calcLoad();
                this.interval = setInterval(() => this.calcLoad(), MEASURE_INTERVAL);
                resolve();
            }, INIT_INTERVAL);
        });
    }
    close() {
        clearInterval(this.interval);
    }
    calcLoad() {
        let totalIdle = 0;
        let totalTick = 0;
        const cpus = os.cpus();
        if (!cpus) {
            // In some environments, os.cpus() might return undefined (although it's not stated in
            // the Node.js docs), see #113 for more information
            return;
        }
        for (let i = 0, len = cpus.length; i < len; i += 1) {
            const cpu = cpus[i];
            for (const type in cpu.times) {
                totalTick += cpu.times[type];
            }
            totalIdle += cpu.times.idle;
        }
        const currentLoad = {
            idle: totalIdle / cpus.length,
            total: totalTick / cpus.length,
        };
        if (this.loads.length !== 0) {
            const compareLoad = this.loads[0];
            const idleDifference = currentLoad.idle - compareLoad.idle;
            const totalDifference = currentLoad.total - compareLoad.total;
            this.cpuUsage = 100 - (100 * idleDifference / totalDifference);
            this.memoryUsage = 100 - (100 * os.freemem() / os.totalmem());
        }
        this.loads.push(currentLoad);
        if (this.loads.length > loadListSize) {
            // remove oldest entry
            this.loads.shift();
        }
    }
    getCpuUsage() {
        return this.cpuUsage;
    }
    getMemoryUsage() {
        return this.memoryUsage;
    }
}
exports.default = SystemMonitor;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiU3lzdGVtTW9uaXRvci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9TeXN0ZW1Nb25pdG9yLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEseUJBQXlCO0FBT3pCLE1BQU0sYUFBYSxHQUFHLEVBQUUsQ0FBQztBQUN6QixNQUFNLGdCQUFnQixHQUFHLEdBQUcsQ0FBQztBQUU3QixvQ0FBb0M7QUFDcEMseUNBQXlDO0FBQ3pDLE1BQU0sZ0JBQWdCLEdBQUcsSUFBSSxDQUFDO0FBRTlCLE1BQU0sWUFBWSxHQUFHLGdCQUFnQixHQUFHLGdCQUFnQixDQUFDO0FBRXpELE1BQXFCLGFBQWE7SUFBbEM7UUFFWSxhQUFRLEdBQVcsQ0FBQyxDQUFDO1FBQ3JCLGdCQUFXLEdBQVcsQ0FBQyxDQUFDO1FBRXhCLFVBQUssR0FBaUIsRUFBRSxDQUFDO1FBRXpCLGFBQVEsR0FBMEIsSUFBSSxDQUFDO0lBbUVuRCxDQUFDO0lBakVHLDBFQUEwRTtJQUNuRSxJQUFJO1FBQ1AsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO1FBQ2hCLE9BQU8sSUFBSSxPQUFPLENBQU8sQ0FBQyxPQUFPLEVBQUUsRUFBRTtZQUNqQyxVQUFVLENBQ04sR0FBRyxFQUFFO2dCQUNELElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztnQkFDaEIsSUFBSSxDQUFDLFFBQVEsR0FBRyxXQUFXLENBQUMsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxFQUFFLGdCQUFnQixDQUFDLENBQUM7Z0JBQ3JFLE9BQU8sRUFBRSxDQUFDO1lBQ2QsQ0FBQyxFQUNELGFBQWEsQ0FDaEIsQ0FBQztRQUNOLENBQUMsQ0FBQyxDQUFDO0lBQ1AsQ0FBQztJQUVNLEtBQUs7UUFDUixhQUFhLENBQUMsSUFBSSxDQUFDLFFBQTBCLENBQUMsQ0FBQztJQUNuRCxDQUFDO0lBRU8sUUFBUTtRQUNaLElBQUksU0FBUyxHQUFHLENBQUMsQ0FBQztRQUNsQixJQUFJLFNBQVMsR0FBRyxDQUFDLENBQUM7UUFDbEIsTUFBTSxJQUFJLEdBQUcsRUFBRSxDQUFDLElBQUksRUFBRSxDQUFDO1FBRXZCLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUNSLHNGQUFzRjtZQUN0RixtREFBbUQ7WUFDbkQsT0FBTztRQUNYLENBQUM7UUFFRCxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxHQUFHLEdBQUcsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDLEdBQUcsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQztZQUNqRCxNQUFNLEdBQUcsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDcEIsS0FBSyxNQUFNLElBQUksSUFBSSxHQUFHLENBQUMsS0FBSyxFQUFFLENBQUM7Z0JBQzNCLFNBQVMsSUFBSyxHQUFHLENBQUMsS0FBYSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQzFDLENBQUM7WUFDRCxTQUFTLElBQUksR0FBRyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUM7UUFDaEMsQ0FBQztRQUVELE1BQU0sV0FBVyxHQUFHO1lBQ2hCLElBQUksRUFBRSxTQUFTLEdBQUcsSUFBSSxDQUFDLE1BQU07WUFDN0IsS0FBSyxFQUFFLFNBQVMsR0FBRyxJQUFJLENBQUMsTUFBTTtTQUNqQyxDQUFDO1FBRUYsSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUUsQ0FBQztZQUMxQixNQUFNLFdBQVcsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ2xDLE1BQU0sY0FBYyxHQUFHLFdBQVcsQ0FBQyxJQUFJLEdBQUcsV0FBVyxDQUFDLElBQUksQ0FBQztZQUMzRCxNQUFNLGVBQWUsR0FBRyxXQUFXLENBQUMsS0FBSyxHQUFHLFdBQVcsQ0FBQyxLQUFLLENBQUM7WUFFOUQsSUFBSSxDQUFDLFFBQVEsR0FBRyxHQUFHLEdBQUcsQ0FBQyxHQUFHLEdBQUcsY0FBYyxHQUFHLGVBQWUsQ0FBQyxDQUFDO1lBQy9ELElBQUksQ0FBQyxXQUFXLEdBQUcsR0FBRyxHQUFHLENBQUMsR0FBRyxHQUFHLEVBQUUsQ0FBQyxPQUFPLEVBQUUsR0FBRyxFQUFFLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQztRQUNsRSxDQUFDO1FBRUQsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUM7UUFDN0IsSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sR0FBRyxZQUFZLEVBQUUsQ0FBQztZQUNuQyxzQkFBc0I7WUFDdEIsSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUN2QixDQUFDO0lBQ0wsQ0FBQztJQUVNLFdBQVc7UUFDZCxPQUFPLElBQUksQ0FBQyxRQUFRLENBQUM7SUFDekIsQ0FBQztJQUNNLGNBQWM7UUFDakIsT0FBTyxJQUFJLENBQUMsV0FBVyxDQUFDO0lBQzVCLENBQUM7Q0FDSjtBQTFFRCxnQ0EwRUMifQ==