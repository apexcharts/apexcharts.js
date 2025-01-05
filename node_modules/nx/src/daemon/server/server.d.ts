import { Server, Socket } from 'net';
export type HandlerResult = {
    description: string;
    error?: any;
    response?: string;
};
export declare const openSockets: Set<Socket>;
export declare function handleResult(socket: Socket, type: string, hrFn: () => Promise<HandlerResult>): Promise<void>;
export declare function startServer(): Promise<Server>;
