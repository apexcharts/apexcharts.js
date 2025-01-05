import log from "./npmlog";
import { Package } from "./package";
interface LifecycleConfig {
    log?: typeof log;
    ignorePrepublish?: boolean;
    ignoreScripts?: boolean;
    nodeOptions?: string;
    scriptShell?: string;
    scriptsPrependNodePath?: boolean;
    unsafePerm?: boolean;
    stdio?: string;
}
/**
 * Run a lifecycle script for a package.
 * @param {import("@lerna/package").Package} pkg
 * @param {string} stage
 * @param {LifecycleConfig} options
 */
export declare function runLifecycle(pkg: Package, stage: string, options: LifecycleConfig): Promise<any>;
export declare function createRunner(commandOptions: any): (pkg: Package, stage: string) => Promise<any>;
export {};
