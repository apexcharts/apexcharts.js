import { Argv } from "yargs";
import { CommandConfigOptions } from "./project";
export interface ListableOptions extends CommandConfigOptions {
    json?: boolean;
    ndjson?: boolean;
    all?: boolean;
    long?: boolean;
    parseable?: boolean;
    toposort?: boolean;
    graph?: boolean;
}
/**
 * Add list-related options to a Yargs instance.
 */
export declare function listableOptions(yargs: Argv, group?: string): Argv<import("yargs").Omit<{}, "json" | "ndjson" | "toposort" | "graph" | "a" | "l" | "p"> & import("yargs").InferredOptionTypes<{
    json: {
        group: string;
        describe: string;
        type: "boolean";
    };
    ndjson: {
        group: string;
        describe: string;
        type: "boolean";
    };
    a: {
        group: string;
        describe: string;
        type: "boolean";
        alias: string;
    };
    l: {
        group: string;
        describe: string;
        type: "boolean";
        alias: string;
    };
    p: {
        group: string;
        describe: string;
        type: "boolean";
        alias: string;
    };
    toposort: {
        group: string;
        describe: string;
        type: "boolean";
    };
    graph: {
        group: string;
        describe: string;
        type: "boolean";
    };
}>>;
