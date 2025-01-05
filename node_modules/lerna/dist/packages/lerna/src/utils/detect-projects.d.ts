export declare function detectProjects(): Promise<{
    projectGraph: import("@lerna/core").ProjectGraphWithPackages;
    projectFileMap: import("@nx/devkit").ProjectFileMap;
}>;
