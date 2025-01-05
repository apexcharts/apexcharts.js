"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createNxCloudOnboardingURL = createNxCloudOnboardingURL;
exports.repoUsesGithub = repoUsesGithub;
exports.getURLifShortenFailed = getURLifShortenFailed;
exports.getNxCloudVersion = getNxCloudVersion;
exports.removeVersionModifier = removeVersionModifier;
exports.versionIsValid = versionIsValid;
exports.compareCleanCloudVersions = compareCleanCloudVersions;
const logger_1 = require("../../utils/logger");
const git_utils_1 = require("../../utils/git-utils");
const get_cloud_options_1 = require("./get-cloud-options");
/**
 * This is currently duplicated in Nx Console. Please let @MaxKless know if you make changes here.
 */
async function createNxCloudOnboardingURL(onboardingSource, accessToken, usesGithub, meta) {
    const githubSlug = (0, git_utils_1.getGithubSlugOrNull)();
    const apiUrl = (0, get_cloud_options_1.getCloudUrl)();
    if (usesGithub === undefined || usesGithub === null) {
        usesGithub = await repoUsesGithub(undefined, githubSlug, apiUrl);
    }
    try {
        const version = await getNxCloudVersion(apiUrl);
        if ((version && compareCleanCloudVersions(version, '2406.11.5') < 0) ||
            !version) {
            return apiUrl;
        }
    }
    catch (e) {
        logger_1.logger.verbose(`Failed to get Nx Cloud version.
    ${e}`);
        return apiUrl;
    }
    const source = getSource(onboardingSource);
    try {
        const response = await require('axios').post(`${apiUrl}/nx-cloud/onboarding`, {
            type: usesGithub ? 'GITHUB' : 'MANUAL',
            source,
            accessToken: usesGithub ? null : accessToken,
            selectedRepositoryName: githubSlug === 'github' ? null : githubSlug,
            meta,
        });
        if (!response?.data || response.data.message) {
            throw new Error(response?.data?.message ?? 'Failed to shorten Nx Cloud URL');
        }
        return `${apiUrl}/connect/${response.data}`;
    }
    catch (e) {
        logger_1.logger.verbose(`Failed to shorten Nx Cloud URL.
    ${e}`);
        return getURLifShortenFailed(usesGithub, githubSlug === 'github' ? null : githubSlug, apiUrl, source, accessToken);
    }
}
async function repoUsesGithub(github, githubSlug, apiUrl) {
    if (!apiUrl) {
        apiUrl = (0, get_cloud_options_1.getCloudUrl)();
    }
    if (!githubSlug) {
        githubSlug = (0, git_utils_1.getGithubSlugOrNull)();
    }
    const installationSupportsGitHub = await getInstallationSupportsGitHub(apiUrl);
    return ((!!githubSlug || !!github) &&
        (apiUrl.includes('cloud.nx.app') ||
            apiUrl.includes('eu.nx.app') ||
            installationSupportsGitHub));
}
function getSource(installationSource) {
    if (installationSource.includes('nx-init')) {
        return 'nx-init';
    }
    else if (installationSource.includes('nx-connect')) {
        return 'nx-connect';
    }
    else {
        return installationSource;
    }
}
function getURLifShortenFailed(usesGithub, githubSlug, apiUrl, source, accessToken) {
    if (usesGithub) {
        if (githubSlug) {
            return `${apiUrl}/setup/connect-workspace/github/connect?name=${encodeURIComponent(githubSlug)}&source=${source}`;
        }
        else {
            return `${apiUrl}/setup/connect-workspace/github/select&source=${source}`;
        }
    }
    return `${apiUrl}/setup/connect-workspace/manual?accessToken=${accessToken}&source=${source}`;
}
async function getInstallationSupportsGitHub(apiUrl) {
    try {
        const response = await require('axios').get(`${apiUrl}/nx-cloud/system/features`);
        if (!response?.data || response.data.message) {
            throw new Error(response?.data?.message ?? 'Failed to shorten Nx Cloud URL');
        }
        return !!response.data.isGithubIntegrationEnabled;
    }
    catch (e) {
        if (process.env.NX_VERBOSE_LOGGING === 'true') {
            logger_1.logger.warn(`Failed to access system features. GitHub integration assumed to be disabled. 
    ${e}`);
        }
        return false;
    }
}
async function getNxCloudVersion(apiUrl) {
    try {
        const response = await require('axios').get(`${apiUrl}/nx-cloud/system/version`);
        const version = removeVersionModifier(response.data.version);
        const isValid = versionIsValid(version);
        if (!version) {
            throw new Error('Failed to extract version from response.');
        }
        if (!isValid) {
            throw new Error(`Invalid version format: ${version}`);
        }
        return version;
    }
    catch (e) {
        logger_1.logger.verbose(`Failed to get version of Nx Cloud.
      ${e}`);
        return null;
    }
}
function removeVersionModifier(versionString) {
    // Cloud version string is in the format of YYMM.DD.BuildNumber-Modifier
    return versionString.split(/[\.-]/).slice(0, 3).join('.');
}
function versionIsValid(version) {
    // Updated Regex pattern to require YYMM.DD.BuildNumber format
    // All parts are required, including the BuildNumber.
    const pattern = /^\d{4}\.\d{2}\.\d+$/;
    return pattern.test(version);
}
function compareCleanCloudVersions(version1, version2) {
    const parseVersion = (version) => {
        // The format we're using is YYMM.DD.BuildNumber
        const parts = version.split('.').map((part) => parseInt(part, 10));
        return {
            yearMonth: parts[0],
            day: parts[1],
            buildNumber: parts[2],
        };
    };
    const v1 = parseVersion(version1);
    const v2 = parseVersion(version2);
    if (v1.yearMonth !== v2.yearMonth) {
        return v1.yearMonth > v2.yearMonth ? 1 : -1;
    }
    if (v1.day !== v2.day) {
        return v1.day > v2.day ? 1 : -1;
    }
    if (v1.buildNumber !== v2.buildNumber) {
        return v1.buildNumber > v2.buildNumber ? 1 : -1;
    }
    return 0;
}
