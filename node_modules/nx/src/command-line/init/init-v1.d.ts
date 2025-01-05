export interface InitArgs {
    addE2e: boolean;
    force: boolean;
    integrated: boolean;
    interactive: boolean;
    vite: boolean;
    nxCloud?: boolean;
    cacheable?: string[];
    useDotNxInstallation?: boolean;
}
export declare function initHandler(options: InitArgs): Promise<void>;
