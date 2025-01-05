import { Task, TaskGraph } from '../config/task-graph';
import { TaskHasher } from './task-hasher';
import { ProjectGraph } from '../config/project-graph';
import { NxJsonConfiguration } from '../config/nx-json';
import { TaskDetails } from '../native';
export declare function getTaskDetails(): TaskDetails | null;
export declare function hashTasksThatDoNotDependOnOutputsOfOtherTasks(hasher: TaskHasher, projectGraph: ProjectGraph, taskGraph: TaskGraph, nxJson: NxJsonConfiguration, tasksDetails: TaskDetails | null): Promise<void>;
export declare function hashTask(hasher: TaskHasher, projectGraph: ProjectGraph, taskGraph: TaskGraph, task: Task, env: NodeJS.ProcessEnv, taskDetails: TaskDetails | null): Promise<void>;
