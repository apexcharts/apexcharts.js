"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GLOB = void 0;
exports.isHandleGlobMessage = isHandleGlobMessage;
exports.GLOB = 'GLOB';
function isHandleGlobMessage(message) {
    return (typeof message === 'object' &&
        message !== null &&
        'type' in message &&
        message['type'] === exports.GLOB);
}
