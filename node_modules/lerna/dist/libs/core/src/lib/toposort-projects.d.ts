import { ProjectGraphProjectNodeWithPackage, ProjectGraphWithPackages } from "./project-graph-with-packages";
export declare function toposortProjects(projects: ProjectGraphProjectNodeWithPackage[], projectGraph: ProjectGraphWithPackages, rejectCycles?: boolean): ProjectGraphProjectNodeWithPackage[];
