import { ProjectFileMap } from "@nx/devkit";
import { ProjectGraphWithPackages } from "../project-graph-with-packages";
export declare function detectProjects(packageConfigs: string[]): Promise<{
    projectGraph: ProjectGraphWithPackages;
    projectFileMap: ProjectFileMap;
}>;
