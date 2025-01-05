import { Tracker } from "./tracker";
import { TrackerBase } from "./tracker-base";
export declare class TrackerGroup extends TrackerBase {
    parentGroup: null;
    trackers: Array<Tracker>;
    completion: any;
    weight: any;
    totalWeight: number;
    finished: boolean;
    bubbleChange: (name: any, completed: any, tracker: {
        id: string | number;
    }) => void;
    nameInTree(): string;
    addUnit(unit: any, weight?: number): any;
    completed(): number;
    newGroup(name: string, weight?: number): any;
    newItem(name: string, todo: number, weight?: number): any;
    newStream(name: string, todo: number, weight?: number): any;
    finish(): void;
    debug(depth?: number): string;
}
