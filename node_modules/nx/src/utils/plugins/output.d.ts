import { ProjectConfiguration } from '../../config/workspace-json-project-json';
import { PluginCapabilities } from './plugin-capabilities';
export declare function listPlugins(plugins: Map<string, PluginCapabilities>, title: string): void;
export declare function listAlsoAvailableCorePlugins(installedPlugins: Map<string, PluginCapabilities>): void;
export declare function listPowerpackPlugins(): void;
export declare function listPluginCapabilities(pluginName: string, projects: Record<string, ProjectConfiguration>): Promise<void>;
