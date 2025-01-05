declare const ConfigChain: any;
export declare class Conf extends ConfigChain {
    root: any;
    constructor(base: any);
    add(data: any, marker: string): any;
    addFile(file: any, name?: any): this;
    addEnv(env?: NodeJS.ProcessEnv): any;
    loadPrefix(): any;
    loadCAFile(file: any): void;
    loadUser(): void;
    getCredentialsByURI(uri: string): {
        scope: string;
        token: undefined;
        password: undefined;
        username: undefined;
        email: undefined;
        auth: undefined;
        alwaysAuth: undefined;
    };
    setCredentialsByURI(uri: any, c: any): void;
}
export {};
