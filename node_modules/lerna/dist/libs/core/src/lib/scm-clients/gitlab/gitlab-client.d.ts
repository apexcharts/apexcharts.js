export declare class GitLabClient {
    token: string;
    baseUrl: string;
    constructor(token: string, baseUrl?: string);
    createRelease({ owner, repo, name, tag_name: tagName, body }: {
        owner: any;
        repo: any;
        name: any;
        tag_name: any;
        body: any;
    }): Promise<void>;
    releasesUrl(namespace: string, project: string): string;
}
