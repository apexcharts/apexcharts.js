import { Arguments, CommandConfigOptions, LernaLogger } from "@lerna/core";
import { PackageManager } from "@nx/devkit";
import { Tree } from "nx/src/generators/tree";
interface InitCommandOptions extends CommandConfigOptions {
    lernaVersion?: string;
    packages?: string[];
    exact?: boolean;
    loglevel?: string;
    independent?: boolean;
    dryRun?: boolean;
    skipInstall?: boolean;
}
export declare function factory(args: Arguments<InitCommandOptions>): InitCommand;
export declare class InitCommand {
    #private;
    private args;
    name: string;
    logger: LernaLogger;
    cwd: string;
    packageManager: PackageManager;
    runner: Promise<void>;
    constructor(args: Arguments<InitCommandOptions>);
    execute(): Promise<void>;
    then(onResolved: () => void, onRejected: (err: string | Error) => void): Promise<void>;
    catch(onRejected: (err: string | Error) => void): Promise<void>;
    generate(tree: Tree): Promise<void | (() => Promise<void>)>;
    private detectPackageManager;
    /**
     * Detects which package manager was used to invoke lerna init command
     * based on the main Module process that invokes the command
     * - npx returns 'npm'
     * - pnpx returns 'pnpm'
     * - yarn create returns 'yarn'
     */
    private detectInvokedPackageManager;
}
export {};
