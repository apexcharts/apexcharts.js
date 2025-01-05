export declare function getNpmExecOpts(pkg: {
    name: any;
    location: string;
}, registry?: any): {
    cwd: string;
    env: any;
    pkg: {
        name: any;
        location: string;
    };
};
