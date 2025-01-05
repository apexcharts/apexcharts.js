import type { Octokit } from "@octokit/core";
import type { PaginateInterface } from "./types";
export type { PaginateInterface, PaginatingEndpoints } from "./types";
export { composePaginateRest } from "./compose-paginate";
export { isPaginatingEndpoint, paginatingEndpoints, } from "./paginating-endpoints";
/**
 * @param octokit Octokit instance
 * @param options Options passed to Octokit constructor
 */
export declare function paginateRest(octokit: Octokit): {
    paginate: PaginateInterface;
};
export declare namespace paginateRest {
    var VERSION: string;
}
