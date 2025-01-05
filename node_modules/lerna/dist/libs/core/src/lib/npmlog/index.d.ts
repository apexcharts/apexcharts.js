/**
 * Adapted from https://github.com/npm/npmlog/blob/756bd05d01e7e4841fba25204d6b85dfcffeba3c/lib/log.js
 */
import { EventEmitter } from "node:events";
import { WriteStream } from "node:tty";
export declare class Logger extends EventEmitter {
    private _stream;
    private _paused;
    private _buffer;
    private unicodeEnabled;
    private colorEnabled;
    private id;
    record: any[];
    maxRecordSize: number;
    gauge: any;
    tracker: any;
    progressEnabled: boolean;
    level: string;
    prefixStyle: any;
    headingStyle: any;
    style: any;
    levels: any;
    disp: any;
    heading: string | undefined;
    silly: (prefix: string, ...messageArgs: any[]) => void;
    verbose: (prefix: string, ...messageArgs: any[]) => void;
    info: (prefix: string, ...messageArgs: any[]) => void;
    timing: (prefix: string, ...messageArgs: any[]) => void;
    http: (prefix: string, ...messageArgs: any[]) => void;
    notice: (prefix: string, ...messageArgs: any[]) => void;
    warn: (prefix: string, ...messageArgs: any[]) => void;
    error: (prefix: string, ...messageArgs: any[]) => void;
    silent: (prefix: string, ...messageArgs: any[]) => void;
    [dynamicallyAddedLogLevelMethod: string]: any;
    constructor();
    get stream(): WriteStream | null;
    set stream(newStream: WriteStream | null);
    useColor(): boolean;
    enableColor(): void;
    disableColor(): void;
    enableUnicode(): void;
    disableUnicode(): void;
    setGaugeThemeset(themes: any): void;
    setGaugeTemplate(template: any): void;
    enableProgress(): void;
    disableProgress(): void;
    clearProgress(cb?: () => void): void;
    showProgress(name?: string, completed?: number): void;
    pause(): void;
    resume(): void;
    log(lvl: string, prefix: string, ...messageArgs: any[]): void;
    emitLog(m: {
        prefix: string;
        level: string | number;
        message?: string;
    }): void;
    _format(msg: string, style?: {
        fg?: string;
        bg?: string;
        bold?: boolean;
        underline?: boolean;
        inverse?: boolean;
        beep?: boolean;
    }): string | void;
    write(msg: string, style?: {
        fg?: string;
        bg?: string;
        bold?: boolean;
        underline?: boolean;
        inverse?: boolean;
        beep?: boolean;
    }): void;
    addLevel(lvl: string | number, n: any, style?: any, disp?: string | number | null): void;
}
declare const log: Logger;
export default log;
