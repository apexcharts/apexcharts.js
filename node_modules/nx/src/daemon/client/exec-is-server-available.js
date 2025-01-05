"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("./client");
(async () => {
    try {
        console.log(await client_1.daemonClient.isServerAvailable());
    }
    catch {
        console.log(false);
    }
})();
