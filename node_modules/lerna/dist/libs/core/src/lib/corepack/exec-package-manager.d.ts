import { ExecOptions } from "child_process";
import { ExecaReturnValue } from "execa";
export declare function execPackageManager(npmClient: string, args: string[], opts: ExecOptions): Promise<ExecaReturnValue<string>>;
export declare function execPackageManagerSync(npmClient: string, args: string[], opts: ExecOptions): string;
