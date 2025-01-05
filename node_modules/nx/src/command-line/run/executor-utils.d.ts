import { ExecutorConfig } from '../../config/misc-interfaces';
import { ProjectConfiguration } from '../../config/workspace-json-project-json';
export declare function normalizeExecutorSchema(schema: Partial<ExecutorConfig['schema']>): ExecutorConfig['schema'];
export declare function getExecutorInformation(nodeModule: string, executor: string, root: string, projects: Record<string, ProjectConfiguration>): ExecutorConfig & {
    isNgCompat: boolean;
    isNxExecutor: boolean;
};
