"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.renameJsToJsx = renameJsToJsx;
const node_fs_1 = require("node:fs");
const workspace_context_1 = require("../../../../utils/workspace-context");
const fileutils_1 = require("../../../../utils/fileutils");
// Vite cannot process JSX like <div> or <Header> unless the file is named .jsx or .tsx
async function renameJsToJsx(appName, isStandalone) {
    const files = await (0, workspace_context_1.globWithWorkspaceContext)(process.cwd(), [
        isStandalone ? 'src/**/*.js' : `apps/${appName}/src/**/*.js`,
    ]);
    files.forEach((file) => {
        if ((0, fileutils_1.fileExists)(file)) {
            const content = (0, node_fs_1.readFileSync)(file).toString();
            // Try to detect JSX before renaming to .jsx
            // Files like setupTests.js from CRA should not be renamed
            if (/<[a-zA-Z0-9]+/.test(content)) {
                (0, node_fs_1.renameSync)(file, `${file}x`);
            }
        }
    });
}
