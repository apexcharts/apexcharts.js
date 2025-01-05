import { ProjectFileMap, ProjectGraph } from "@nx/devkit";
import { ExtendedNpaResult } from "../package";
import { ProjectGraphWithPackages } from "../project-graph-with-packages";
export declare function createProjectGraphWithPackages(projectGraph: ProjectGraph, projectFileMap: ProjectFileMap, packageConfigs: string[]): Promise<ProjectGraphWithPackages>;
export declare const resolvePackage: (name: string, version: string, spec: string, location?: string) => ExtendedNpaResult;
