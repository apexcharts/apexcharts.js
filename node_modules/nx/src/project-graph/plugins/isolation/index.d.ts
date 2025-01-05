import { PluginConfiguration } from '../../../config/nx-json';
import { LoadedNxPlugin } from '../internal-api';
export declare function loadNxPluginInIsolation(plugin: PluginConfiguration, root?: string): Promise<readonly [Promise<LoadedNxPlugin>, () => void]>;
