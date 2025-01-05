"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DaemonSocketMessenger = void 0;
const consume_messages_from_socket_1 = require("../../utils/consume-messages-from-socket");
class DaemonSocketMessenger {
    constructor(socket) {
        this.socket = socket;
    }
    async sendMessage(messageToDaemon) {
        this.socket.write(JSON.stringify(messageToDaemon));
        // send EOT to indicate that the message has been fully written
        this.socket.write(String.fromCodePoint(4));
    }
    listen(onData, onClose = () => { }, onError = (err) => { }) {
        this.socket.on('data', (0, consume_messages_from_socket_1.consumeMessagesFromSocket)(async (message) => {
            onData(message);
        }));
        this.socket.on('close', onClose);
        this.socket.on('error', onError);
        return this;
    }
    close() {
        this.socket.destroy();
    }
}
exports.DaemonSocketMessenger = DaemonSocketMessenger;
