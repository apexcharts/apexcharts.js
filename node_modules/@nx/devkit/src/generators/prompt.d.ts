import { prompt } from 'enquirer';
export declare function promptWhenInteractive<T>(questions: Parameters<typeof prompt>[0], defaultValue: T): Promise<T>;
