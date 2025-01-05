import { ExecOptions } from "child_process";
import { FilterOptions } from "./filter-options";
import { ProjectGraphProjectNodeWithPackage, ProjectGraphWithPackages } from "./project-graph-with-packages";
export declare function filterProjects(projectGraph: ProjectGraphWithPackages, execOpts?: Partial<ExecOptions>, opts?: Partial<FilterOptions>): ProjectGraphProjectNodeWithPackage[];
