"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const perf_hooks_1 = require("perf_hooks");
let initialized = false;
if (process.env.NX_PERF_LOGGING === 'true' && !initialized) {
    initialized = true;
    const obs = new perf_hooks_1.PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
            console.log(`Time for '${entry.name}'`, entry.duration);
        }
    });
    obs.observe({ entryTypes: ['measure'] });
}
