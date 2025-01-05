import { ProjectGraphProjectNodeWithPackage, ProjectGraphWithPackages } from "./project-graph-with-packages";
interface TopologicalConfig {
    concurrency?: number;
    rejectCycles?: boolean;
}
/**
 * Run callback in maximally-saturated topological order.
 */
export declare function runProjectsTopologically<T>(projects: ProjectGraphProjectNodeWithPackage[], projectGraph: ProjectGraphWithPackages, runner: (node: ProjectGraphProjectNodeWithPackage) => Promise<T>, { concurrency, rejectCycles }?: TopologicalConfig): Promise<T[]>;
export {};
