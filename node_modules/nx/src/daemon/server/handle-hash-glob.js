"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleHashGlob = handleHashGlob;
const workspace_root_1 = require("../../utils/workspace-root");
const workspace_context_1 = require("../../utils/workspace-context");
async function handleHashGlob(globs, exclude) {
    const files = await (0, workspace_context_1.hashWithWorkspaceContext)(workspace_root_1.workspaceRoot, globs, exclude);
    return {
        response: JSON.stringify(files),
        description: 'handleHashGlob',
    };
}
