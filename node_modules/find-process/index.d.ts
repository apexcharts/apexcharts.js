// https://github.com/pimterry/loglevel/blob/f5a642299bf77a81118d68766a168c9568ecd21b/index.d.ts#L14-L38
interface LogLevel {
    TRACE: 0;
    DEBUG: 1;
    INFO: 2;
    WARN: 3;
    ERROR: 4;
    SILENT: 5;
}

type LogLevelNumbers = LogLevel[keyof LogLevel];

type LogLevelDesc = LogLevelNumbers
    | 'trace'
    | 'debug'
    | 'info'
    | 'warn'
    | 'error'
    | 'silent'
    | keyof LogLevel;

declare type Options = {
    strict?: boolean;
    logLevel?: LogLevelDesc;
}

declare function find(type: "name" | "pid" | "port", value: string | number | RegExp, strict?: boolean | Options): Promise<{
    pid: number;
    ppid?: number;
    uid?: number;
    gid?: number;
    name: string;
    cmd: string;
}[]>
export = find;
