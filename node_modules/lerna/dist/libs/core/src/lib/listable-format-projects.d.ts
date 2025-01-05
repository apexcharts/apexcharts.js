import { ListableOptions } from "./listable-options";
import { ProjectGraphProjectNodeWithPackage, ProjectGraphWithPackages } from "./project-graph-with-packages";
/**
 * Format a list of projects according to specified options.
 * @param projectsList List of projects to format
 */
export declare function listableFormatProjects(projectsList: ProjectGraphProjectNodeWithPackage[], projectGraph: ProjectGraphWithPackages, options: ListableOptions): {
    text: string;
    count: number;
};
declare function parseViewOptions(options: ListableOptions): {
    showAll: boolean | undefined;
    showLong: boolean | undefined;
    showJSON: boolean | undefined;
    showNDJSON: boolean | undefined;
    showParseable: boolean | undefined;
    isTopological: boolean | undefined;
    showGraph: boolean | undefined;
};
declare function filterResultList(projectList: ProjectGraphProjectNodeWithPackage[], projectGraph: ProjectGraphWithPackages, viewOptions: ReturnType<typeof parseViewOptions>): ProjectGraphProjectNodeWithPackage[];
export declare function formatJSON(resultList: ReturnType<typeof filterResultList>, additionalProperties?: (project: ProjectGraphProjectNodeWithPackage) => {
    [propt: string]: unknown;
}): string;
export {};
