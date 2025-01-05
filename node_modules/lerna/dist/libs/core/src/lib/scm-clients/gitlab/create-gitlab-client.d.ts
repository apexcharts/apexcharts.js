export declare function createGitLabClient(): {
    repos: {
        createRelease: ({ owner, repo, name, tag_name: tagName, body }: {
            owner: any;
            repo: any;
            name: any;
            tag_name: any;
            body: any;
        }) => Promise<void>;
    };
};
