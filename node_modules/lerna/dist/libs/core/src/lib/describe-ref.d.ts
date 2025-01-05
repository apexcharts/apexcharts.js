interface DescribeRefOptions {
    cwd?: string | URL;
    match?: string;
    separator?: string;
}
export interface DescribeRefFallbackResult {
    isDirty: boolean;
    refCount: string;
    sha: string;
}
export interface DescribeRefDetailedResult extends DescribeRefFallbackResult {
    lastTagName: string;
    lastVersion: string;
}
export declare function describeRef(options?: DescribeRefOptions, includeMergedTags?: boolean): Promise<DescribeRefFallbackResult | DescribeRefDetailedResult>;
export declare function describeRefSync(options?: DescribeRefOptions, includeMergedTags?: boolean): DescribeRefFallbackResult | DescribeRefDetailedResult;
export {};
