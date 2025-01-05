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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.unpackArchive = void 0;
const child_process_1 = require("child_process");
const fs_1 = require("fs");
const promises_1 = require("fs/promises");
const path = __importStar(require("path"));
const util_1 = require("util");
const extract_zip_1 = __importDefault(require("extract-zip"));
const tar_fs_1 = __importDefault(require("tar-fs"));
const unbzip2_stream_1 = __importDefault(require("unbzip2-stream"));
const exec = (0, util_1.promisify)(child_process_1.exec);
/**
 * @internal
 */
async function unpackArchive(archivePath, folderPath) {
    if (archivePath.endsWith('.zip')) {
        await (0, extract_zip_1.default)(archivePath, { dir: folderPath });
    }
    else if (archivePath.endsWith('.tar.bz2')) {
        await extractTar(archivePath, folderPath);
    }
    else if (archivePath.endsWith('.dmg')) {
        await (0, promises_1.mkdir)(folderPath);
        await installDMG(archivePath, folderPath);
    }
    else if (archivePath.endsWith('.exe')) {
        // Firefox on Windows.
        const result = (0, child_process_1.spawnSync)(archivePath, [`/ExtractDir=${folderPath}`], {
            env: {
                __compat_layer: 'RunAsInvoker',
            },
        });
        if (result.status !== 0) {
            throw new Error(`Failed to extract ${archivePath} to ${folderPath}: ${result.output}`);
        }
    }
    else {
        throw new Error(`Unsupported archive format: ${archivePath}`);
    }
}
exports.unpackArchive = unpackArchive;
/**
 * @internal
 */
function extractTar(tarPath, folderPath) {
    return new Promise((fulfill, reject) => {
        const tarStream = tar_fs_1.default.extract(folderPath);
        tarStream.on('error', reject);
        tarStream.on('finish', fulfill);
        const readStream = (0, fs_1.createReadStream)(tarPath);
        readStream.pipe((0, unbzip2_stream_1.default)()).pipe(tarStream);
    });
}
/**
 * @internal
 */
async function installDMG(dmgPath, folderPath) {
    const { stdout } = await exec(`hdiutil attach -nobrowse -noautoopen "${dmgPath}"`);
    const volumes = stdout.match(/\/Volumes\/(.*)/m);
    if (!volumes) {
        throw new Error(`Could not find volume path in ${stdout}`);
    }
    const mountPath = volumes[0];
    try {
        const fileNames = await (0, promises_1.readdir)(mountPath);
        const appName = fileNames.find(item => {
            return typeof item === 'string' && item.endsWith('.app');
        });
        if (!appName) {
            throw new Error(`Cannot find app in ${mountPath}`);
        }
        const mountedPath = path.join(mountPath, appName);
        await exec(`cp -R "${mountedPath}" "${folderPath}"`);
    }
    finally {
        await exec(`hdiutil detach "${mountPath}" -quiet`);
    }
}
//# sourceMappingURL=fileUtil.js.map