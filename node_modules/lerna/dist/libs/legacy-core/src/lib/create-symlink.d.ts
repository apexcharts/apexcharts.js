import { SymlinkType } from "fs-extra";
type CreateSymlinkType = SymlinkType | "exec";
export declare function createSymlink(src: string, dest: string, type: CreateSymlinkType): Promise<void>;
export {};
