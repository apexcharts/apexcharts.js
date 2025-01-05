import { Socket } from 'net';
export interface Message extends Record<string, any> {
    type: string;
    data?: any;
}
export declare class DaemonSocketMessenger {
    private socket;
    constructor(socket: Socket);
    sendMessage(messageToDaemon: Message): Promise<void>;
    listen(onData: (message: string) => void, onClose?: () => void, onError?: (err: Error) => void): this;
    close(): void;
}
