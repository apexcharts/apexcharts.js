"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApiAxiosInstance = createApiAxiosInstance;
const path_1 = require("path");
const environment_1 = require("./environment");
function createApiAxiosInstance(options) {
    let axiosConfigBuilder = (axiosConfig) => axiosConfig;
    const baseUrl = process.env.NX_CLOUD_API || options.url || 'https://cloud.nx.app';
    const accessToken = environment_1.ACCESS_TOKEN ? environment_1.ACCESS_TOKEN : options.accessToken;
    const nxCloudId = options.nxCloudId;
    // TODO(lourw): Update message with NxCloudId once it is supported
    if (!accessToken && !nxCloudId) {
        throw new Error(`Unable to authenticate. If you are connecting to Nx Cloud locally, set an Nx Cloud ID in your nx.json with "nx connect". If you are in a CI context, please set the NX_CLOUD_ACCESS_TOKEN environment variable or define an access token in your nx.json.`);
    }
    if (options.customProxyConfigPath) {
        const { nxCloudProxyConfig } = require((0, path_1.join)(process.cwd(), options.customProxyConfigPath));
        axiosConfigBuilder = nxCloudProxyConfig ?? axiosConfigBuilder;
    }
    return require('axios').create(axiosConfigBuilder({
        baseURL: baseUrl,
        timeout: environment_1.NX_CLOUD_NO_TIMEOUTS ? environment_1.UNLIMITED_TIMEOUT : 10000,
        headers: { authorization: accessToken },
    }));
}
