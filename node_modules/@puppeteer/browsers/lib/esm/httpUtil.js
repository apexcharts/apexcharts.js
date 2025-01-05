/**
 * @license
 * Copyright 2023 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
import { createWriteStream } from 'fs';
import * as http from 'http';
import * as https from 'https';
import { URL, urlToHttpOptions } from 'url';
import { ProxyAgent } from 'proxy-agent';
export function headHttpRequest(url) {
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
export function httpRequest(url, method, response, keepAlive = true) {
    const options = {
        protocol: url.protocol,
        hostname: url.hostname,
        port: url.port,
        path: url.pathname + url.search,
        method,
        headers: keepAlive ? { Connection: 'keep-alive' } : undefined,
        auth: urlToHttpOptions(url).auth,
        agent: new ProxyAgent(),
    };
    const requestCallback = (res) => {
        if (res.statusCode &&
            res.statusCode >= 300 &&
            res.statusCode < 400 &&
            res.headers.location) {
            httpRequest(new URL(res.headers.location), method, response);
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
/**
 * @internal
 */
export function downloadFile(url, destinationPath, progressCallback) {
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
            const file = createWriteStream(destinationPath);
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
export async function getJSON(url) {
    const text = await getText(url);
    try {
        return JSON.parse(text);
    }
    catch {
        throw new Error('Could not parse JSON from ' + url.toString());
    }
}
export function getText(url) {
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
//# sourceMappingURL=httpUtil.js.map