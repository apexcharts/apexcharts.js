import { TrackerBase } from "./tracker-base";
export declare class Tracker extends TrackerBase {
    workDone: number;
    workTodo: number;
    constructor(name?: string, todo?: number);
    completed(): number;
    addWork(work: number): void;
    completeWork(work: number): void;
    finish(): void;
}
