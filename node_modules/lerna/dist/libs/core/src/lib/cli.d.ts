import yargs from "yargs";
/**
 * A factory that returns a yargs() instance configured with everything except commands.
 * Chain .parse() from this method to invoke.
 */
export declare function lernaCLI(argv?: string | readonly string[], cwd?: string): yargs.Argv<yargs.Omit<yargs.Omit<{}, string | number> & yargs.InferredOptionTypes<{
    [key: string]: yargs.Options;
}>, "ci"> & {
    ci: boolean | undefined;
} & {
    help: unknown;
} & {
    version: unknown;
}>;
