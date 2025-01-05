import type { Octokit } from "@octokit/core";
import type { RestEndpointMethods } from "./generated/method-types";
export declare function endpointsToMethods(octokit: Octokit): RestEndpointMethods;
