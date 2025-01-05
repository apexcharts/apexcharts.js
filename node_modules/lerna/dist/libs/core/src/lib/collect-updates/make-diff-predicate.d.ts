import { ExecOptions } from "child_process";
import { ProjectGraphProjectNodeWithPackage } from "../project-graph-with-packages";
export declare function makeDiffPredicate(committish: string, execOpts: ExecOptions, ignorePatterns?: string[]): (node: ProjectGraphProjectNodeWithPackage) => boolean;
