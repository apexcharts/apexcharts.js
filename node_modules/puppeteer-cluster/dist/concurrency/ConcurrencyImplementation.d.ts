import { Page, LaunchOptions } from 'puppeteer';
/**
 * ABSTRACT CLASS Needs to be implemented to manage one or more browsers via puppeteer instances
 *
 * The ConcurrencyImplementation creates WorkerInstances. Workers create JobInstances:
 * One WorkerInstance per maxWorkers, one JobInstance per job
 */
export default abstract class ConcurrencyImplementation {
    protected options: LaunchOptions;
    protected puppeteer: any;
    /**
     * @param options  Options that should be provided to puppeteer.launch
     * @param puppeteer  puppeteer object (like puppeteer or puppeteer-core)
     */
    constructor(options: LaunchOptions, puppeteer: any);
    /**
     * Initializes the manager
     */
    abstract init(): Promise<void>;
    /**
     * Closes the manager (called when cluster is about to shut down)
     */
    abstract close(): Promise<void>;
    /**
     * Creates a worker and returns it
     */
    abstract workerInstance(perBrowserOptions: LaunchOptions | undefined): Promise<WorkerInstance>;
}
/**
 * WorkerInstances are created by calling the workerInstance function.
 * In case maxWorkers is set to 4, 4 workers will be created.
 */
export interface WorkerInstance {
    jobInstance: () => Promise<JobInstance>;
    /**
     * Closes the worker (called when the cluster is about to shut down)
     */
    close: () => Promise<void>;
    /**
     * Repair is called when there is a problem with the worker (like call or close throwing
     * an error)
     */
    repair: () => Promise<void>;
}
/**
 * JobInstance which is created for the execution of one job. After usage
 * the associated resources will be destroyed by calling close.
 * resources needs to contain the page and might contain any other
 * related resources (like the browser).
 */
export interface JobInstance {
    resources: ResourceData;
    /**
     * Called to close the related resources
     */
    close: () => Promise<void>;
}
export interface ResourceData {
    page: Page;
    [key: string]: any;
}
export type ConcurrencyImplementationClassType = new (options: LaunchOptions, puppeteer: any) => ConcurrencyImplementation;
