import stream from "node:stream";
import { Tracker } from "./tracker";
export declare class TrackerStream extends stream.Transform {
    tracker: Tracker;
    name: string;
    id: number;
    constructor(name: string, size?: number, options?: stream.TransformOptions);
    trackerChange(name: string, completion: any): void;
    _transform(data: string | any[], encoding: any, cb: () => void): void;
    _flush(cb: () => void): void;
    completed(): number;
    addWork(work: number): void;
    finish(): void;
}
