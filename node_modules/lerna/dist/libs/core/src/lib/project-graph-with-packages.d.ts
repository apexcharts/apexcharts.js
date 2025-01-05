import { ProjectGraph, ProjectGraphDependency, ProjectGraphProjectNode } from "@nx/devkit";
import { ExtendedNpaResult, Package } from "./package";
export interface ProjectGraphProjectNodeWithPackage extends ProjectGraphProjectNode {
    package: Package | null;
}
export interface ProjectGraphWorkspacePackageDependency extends ProjectGraphDependency {
    targetVersionMatchesDependencyRequirement: boolean;
    targetResolvedNpaResult: ExtendedNpaResult;
    dependencyCollection: "dependencies" | "devDependencies" | "optionalDependencies";
}
export interface ProjectGraphWithPackages extends ProjectGraph {
    nodes: Record<string, ProjectGraphProjectNodeWithPackage>;
    localPackageDependencies: Record<string, ProjectGraphWorkspacePackageDependency[]>;
}
export declare const isExternalNpmDependency: (dep: string) => boolean;
/**
 * Get the package for a given project graph node with a package.
 * This should be preferred over directly accessing `node.package`,
 * since this function will throw an error if the package is not found.
 * @param project the project graph node to get the package for
 * @returns the package for the given project
 */
export declare function getPackage(project: ProjectGraphProjectNodeWithPackage): Package;
