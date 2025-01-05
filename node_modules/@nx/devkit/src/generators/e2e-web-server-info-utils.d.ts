import { type Tree } from 'nx/src/devkit-exports';
interface E2EWebServerDefaultValues {
    defaultServeTargetName: string;
    defaultServeStaticTargetName: string;
    defaultE2EWebServerAddress: string;
    defaultE2ECiBaseUrl: string;
    defaultE2EPort: number;
}
interface E2EWebServerPluginOptions {
    plugin: string;
    configFilePath: string;
    serveTargetName: string;
    serveStaticTargetName: string;
}
export interface E2EWebServerDetails {
    e2eWebServerAddress: string;
    e2eWebServerCommand: string;
    e2eCiWebServerCommand: string;
    e2eCiBaseUrl: string;
    e2eDevServerTarget: string;
}
export declare function getE2EWebServerInfo(tree: Tree, projectName: string, pluginOptions: E2EWebServerPluginOptions, defaultValues: E2EWebServerDefaultValues, isPluginBeingAdded: boolean): Promise<E2EWebServerDetails>;
export {};
