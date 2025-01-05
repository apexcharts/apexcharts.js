import { ProjectGraph } from '../config/project-graph';
export declare function splitTarget(s: string, projectGraph: ProjectGraph): [project: string, target?: string, configuration?: string];
export declare function splitByColons(s: string): [string, ...string[]];
