import { ProjectGraphProjectNode } from '../../config/project-graph';
import { ProjectGraphBuilder } from '../project-graph-builder';
import { ProjectConfiguration } from '../../config/workspace-json-project-json';
import { CreateDependenciesContext } from '../plugins';
export declare function normalizeProjectNodes({ projects }: CreateDependenciesContext, builder: ProjectGraphBuilder): Promise<void>;
export declare function normalizeImplicitDependencies(source: string, implicitDependencies: ProjectConfiguration['implicitDependencies'], projects: Record<string, ProjectGraphProjectNode>): string[];
