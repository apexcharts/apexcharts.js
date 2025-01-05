import { ResourceData } from '../ConcurrencyImplementation';
import SingleBrowserImplementation from '../SingleBrowserImplementation';
export default class Context extends SingleBrowserImplementation {
    protected createResources(): Promise<ResourceData>;
    protected freeResources(resources: ResourceData): Promise<void>;
}
