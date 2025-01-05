"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const output_1 = require("../../utils/output");
const server_1 = require("./server");
const process = require("process");
(async () => {
    try {
        await (0, server_1.startServer)();
    }
    catch (err) {
        output_1.output.error({
            title: err?.message ||
                'Something unexpected went wrong when starting the server',
        });
        process.exit(1);
    }
})();
