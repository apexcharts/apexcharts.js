"use strict";
/**
 * @license
 * Copyright 2023 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getText = exports.getJSON = exports.downloadFile = exports.httpRequest = exports.headHttpRequest = void 0;
const fs_1 = require("fs");
const http = __importStar(require("http"));
const https = __importStar(require("https"));
const url_1 = require("url");
const proxy_agent_1 = require("proxy-agent");
function headHttpRequest(url) {
    return new Promise(resolve => {
        const request = httpRequest(url, 'HEAD', response => {
            // consume response data free node process
            response.resume();
            resolve(response.statusCode === 200);
        }, false);
        request.on('error', () => {
            resolve(false);
        });
    });
}
exports.headHttpRequest = headHttpRequest;
function httpRequest(url, method, response, keepAlive = true) {
    const options = {
        protocol: url.protocol,
        hostname: url.hostname,
        port: url.port,
        path: url.pathname + url.search,
        method,
        headers: keepAlive ? { Connection: 'keep-alive' } : undefined,
        auth: (0, url_1.urlToHttpOptions)(url).auth,
        agent: new proxy_agent_1.ProxyAgent(),
    };
    const requestCallback = (res) => {
        if (res.statusCode &&
            res.statusCode >= 300 &&
            res.statusCode < 400 &&
            res.headers.location) {
            httpRequest(new url_1.URL(res.headers.location), method, response);
            // consume response data to free up memory
            // And prevents the connection from being kept alive
            res.resume();
        }
        else {
            response(res);
        }
    };
    const request = options.protocol === 'https:'
        ? https.request(options, requestCallback)
        : http.request(options, requestCallback);
    request.end();
    return request;
}
exports.httpRequest = httpRequest;
/**
 * @internal
 */
function downloadFile(url, destinationPath, progressCallback) {
    return new Promise((resolve, reject) => {
        let downloadedBytes = 0;
        let totalBytes = 0;
        function onData(chunk) {
            downloadedBytes += chunk.length;
            progressCallback(downloadedBytes, totalBytes);
        }
        const request = httpRequest(url, 'GET', response => {
            if (response.statusCode !== 200) {
                const error = new Error(`Download failed: server returned code ${response.statusCode}. URL: ${url}`);
                // consume response data to free up memory
                response.resume();
                reject(error);
                return;
            }
            const file = (0, fs_1.createWriteStream)(destinationPath);
            file.on('finish', () => {
                return resolve();
            });
            file.on('error', error => {
                return reject(error);
            });
            response.pipe(file);
            totalBytes = parseInt(response.headers['content-length'], 10);
            if (progressCallback) {
                response.on('data', onData);
            }
        });
        request.on('error', error => {
            return reject(error);
        });
    });
}
exports.downloadFile = downloadFile;
async function getJSON(url) {
    const text = await getText(url);
    try {
        return JSON.parse(text);
    }
    catch {
        throw new Error('Could not parse JSON from ' + url.toString());
    }
}
exports.getJSON = getJSON;
function getText(url) {
    return new Promise((resolve, reject) => {
        const request = httpRequest(url, 'GET', response => {
            let data = '';
            if (response.statusCode && response.statusCode >= 400) {
                return reject(new Error(`Got status code ${response.statusCode}`));
            }
            response.on('data', chunk => {
                data += chunk;
            });
            response.on('end', () => {
                try {
                    return resolve(String(data));
                }
                catch {
                    return reject(new Error('Chrome version not found'));
                }
            });
        }, false);
        request.on('error', err => {
            reject(err);
        });
    });
}
exports.getText = getText;
//# sourceMappingURL=httpUtil.js.map