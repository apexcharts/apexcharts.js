"use strict";
/**
 * Node IPC is specific to Node, but when spawning child processes in Rust, it won't have IPC.
 *
 * Thus, this is a wrapper which is spawned by Rust, which will create a Node IPC channel and pipe it to a ZeroMQ Channel
 *
 * Main Nx Process
 *   * Calls Rust Fork Function
 *     * `node fork.js`
 *     * Create a Rust - Node.js Agnostic Channel aka Pseudo IPC Channel
 *     * This returns RustChildProcess
 *         * RustChildProcess.onMessage(msg => ());
 *         * pseudo_ipc_channel.on_message() => tx.send(msg);
 *   * Node.js Fork Wrapper (fork.js)
 *     * fork(run-command.js) with `inherit` and `ipc`
 *         * This will create a Node IPC Channel
 *     * channel = getPseudoIpcChannel(process.env.NX_IPC_CHANNEL_ID)
 *     * forkChildProcess.on('message', writeToPseudoIpcChannel)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PseudoIPCClient = exports.PseudoIPCServer = void 0;
const net_1 = require("net");
const consume_messages_from_socket_1 = require("../utils/consume-messages-from-socket");
class PseudoIPCServer {
    constructor(path) {
        this.path = path;
        this.sockets = new Set();
        this.childMessages = [];
        this.childReadyMap = new Map();
    }
    init() {
        return new Promise((res) => {
            this.server = new net_1.Server((socket) => {
                this.sockets.add(socket);
                this.registerChildMessages(socket);
                socket.on('close', () => {
                    this.sockets.delete(socket);
                });
            });
            this.server.listen(this.path, () => {
                res();
            });
        });
    }
    async waitForChildReady(childId) {
        return new Promise((res) => {
            this.childReadyMap.set(childId, res);
        });
    }
    registerChildMessages(socket) {
        socket.on('data', (0, consume_messages_from_socket_1.consumeMessagesFromSocket)(async (rawMessage) => {
            const { type, message } = JSON.parse(rawMessage);
            if (type === 'TO_PARENT_FROM_CHILDREN') {
                for (const childMessage of this.childMessages) {
                    childMessage.onMessage(message);
                }
            }
            else if (type === 'CHILD_READY') {
                const childId = message;
                if (this.childReadyMap.has(childId)) {
                    this.childReadyMap.get(childId)();
                }
            }
        }));
        socket.on('close', () => {
            for (const childMessage of this.childMessages) {
                childMessage.onClose?.();
            }
        });
        socket.on('error', (err) => {
            for (const childMessage of this.childMessages) {
                childMessage.onError?.(err);
            }
        });
    }
    sendMessageToChildren(message) {
        this.sockets.forEach((socket) => {
            socket.write(JSON.stringify({ type: 'TO_CHILDREN_FROM_PARENT', message }));
            // send EOT to indicate that the message has been fully written
            socket.write(String.fromCodePoint(4));
        });
    }
    sendMessageToChild(id, message) {
        this.sockets.forEach((socket) => {
            socket.write(JSON.stringify({ type: 'TO_CHILDREN_FROM_PARENT', id, message }));
            socket.write(String.fromCodePoint(4));
        });
    }
    onMessageFromChildren(onMessage, onClose = () => { }, onError = (err) => { }) {
        this.childMessages.push({
            onMessage,
            onClose,
            onError,
        });
    }
    close() {
        this.server?.close();
        this.sockets.forEach((s) => s.destroy());
    }
}
exports.PseudoIPCServer = PseudoIPCServer;
class PseudoIPCClient {
    constructor(path) {
        this.path = path;
        this.socket = (0, net_1.connect)(this.path);
    }
    sendMessageToParent(message) {
        this.socket.write(JSON.stringify({ type: 'TO_PARENT_FROM_CHILDREN', message }));
        // send EOT to indicate that the message has been fully written
        this.socket.write(String.fromCodePoint(4));
    }
    notifyChildIsReady(id) {
        this.socket.write(JSON.stringify({
            type: 'CHILD_READY',
            message: id,
        }));
        // send EOT to indicate that the message has been fully written
        this.socket.write(String.fromCodePoint(4));
    }
    onMessageFromParent(forkId, onMessage, onClose = () => { }, onError = (err) => { }) {
        this.socket.on('data', (0, consume_messages_from_socket_1.consumeMessagesFromSocket)(async (rawMessage) => {
            const { id, type, message } = JSON.parse(rawMessage);
            if (type === 'TO_CHILDREN_FROM_PARENT') {
                if (id && id === forkId) {
                    onMessage(message);
                }
                else if (id === undefined) {
                    onMessage(message);
                }
            }
        }));
        this.socket.on('close', onClose);
        this.socket.on('error', onError);
        return this;
    }
    close() {
        this.socket?.destroy();
    }
}
exports.PseudoIPCClient = PseudoIPCClient;
