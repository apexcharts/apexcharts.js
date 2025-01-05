"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.signalToCode = signalToCode;
/**
 * Translates NodeJS signals to numeric exit code
 * @param signal
 */
function signalToCode(signal) {
    switch (signal) {
        case 'SIGHUP':
            return 128 + 1;
        case 'SIGINT':
            return 128 + 2;
        case 'SIGTERM':
            return 128 + 15;
        default:
            return 128;
    }
}
