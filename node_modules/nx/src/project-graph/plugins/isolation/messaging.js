"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isPluginWorkerMessage = isPluginWorkerMessage;
exports.isPluginWorkerResult = isPluginWorkerResult;
exports.consumeMessage = consumeMessage;
exports.sendMessageOverSocket = sendMessageOverSocket;
function isPluginWorkerMessage(message) {
    return (typeof message === 'object' &&
        'type' in message &&
        typeof message.type === 'string' &&
        [
            'load',
            'createNodes',
            'createDependencies',
            'processProjectGraph',
            'createMetadata',
            'shutdown',
        ].includes(message.type));
}
function isPluginWorkerResult(message) {
    return (typeof message === 'object' &&
        'type' in message &&
        typeof message.type === 'string' &&
        [
            'load-result',
            'createNodesResult',
            'createDependenciesResult',
            'processProjectGraphResult',
            'createMetadataResult',
        ].includes(message.type));
}
// Takes a message and a map of handlers and calls the appropriate handler
// type safe and requires all handlers to be handled
async function consumeMessage(socket, raw, handlers) {
    const message = raw;
    const handler = handlers[message.type];
    if (handler) {
        const response = await handler(message.payload);
        if (response) {
            sendMessageOverSocket(socket, response);
        }
    }
}
function sendMessageOverSocket(socket, message) {
    socket.write(JSON.stringify(message) + String.fromCodePoint(4));
}
