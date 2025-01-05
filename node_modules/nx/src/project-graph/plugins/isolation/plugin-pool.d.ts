import { PluginConfiguration } from '../../../config/nx-json';
import { LoadedNxPlugin } from '../internal-api';
export declare function loadRemoteNxPlugin(plugin: PluginConfiguration, root: string): Promise<[Promise<LoadedNxPlugin>, () => void]>;
