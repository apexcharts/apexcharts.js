import { Octokit } from "@octokit/rest";
import parseGitUrl from "git-url-parse";
export declare function createGitHubClient(): Octokit;
export declare function parseGitRepo(remote?: string, opts?: any): parseGitUrl.GitUrl;
