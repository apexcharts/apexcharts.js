import EventEmitter from "node:events";
export declare class TrackerBase extends EventEmitter {
    id: number;
    name: string;
    constructor(name?: string);
}
