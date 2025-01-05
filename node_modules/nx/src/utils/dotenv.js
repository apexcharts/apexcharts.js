"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadRootEnvFiles = loadRootEnvFiles;
const dotenv_1 = require("dotenv");
const dotenv_expand_1 = require("dotenv-expand");
const workspace_root_1 = require("./workspace-root");
const path_1 = require("path");
/**
 * This loads dotenv files from:
 * - .env
 * - .local.env
 * - .env.local
 */
function loadRootEnvFiles(root = workspace_root_1.workspaceRoot) {
    for (const file of ['.local.env', '.env.local', '.env']) {
        const myEnv = (0, dotenv_1.config)({
            path: (0, path_1.join)(root, file),
        });
        (0, dotenv_expand_1.expand)(myEnv);
    }
}
