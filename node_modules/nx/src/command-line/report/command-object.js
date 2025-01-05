"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.yargsReportCommand = void 0;
exports.yargsReportCommand = {
    command: 'report',
    describe: 'Reports useful version numbers to copy into the Nx issue template.',
    handler: async () => {
        await (await Promise.resolve().then(() => require('./report'))).reportHandler();
        process.exit(0);
    },
};
