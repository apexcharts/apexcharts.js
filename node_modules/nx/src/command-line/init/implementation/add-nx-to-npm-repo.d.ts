import { InitArgs } from '../init-v1';
type Options = Pick<InitArgs, 'nxCloud' | 'interactive' | 'cacheable'> & {
    legacy?: boolean;
};
export declare function addNxToNpmRepo(options: Options): Promise<void>;
export {};
