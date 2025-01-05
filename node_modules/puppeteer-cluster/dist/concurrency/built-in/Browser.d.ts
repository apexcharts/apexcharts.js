import * as puppeteer from 'puppeteer';
import ConcurrencyImplementation, { WorkerInstance } from '../ConcurrencyImplementation';
export default class Browser extends ConcurrencyImplementation {
    init(): Promise<void>;
    close(): Promise<void>;
    workerInstance(perBrowserOptions: puppeteer.LaunchOptions | undefined): Promise<WorkerInstance>;
}
