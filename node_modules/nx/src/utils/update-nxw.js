"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateNxw = updateNxw;
const add_nx_scripts_1 = require("../command-line/init/implementation/dot-nx/add-nx-scripts");
const path_1 = require("../utils/path");
function updateNxw(tree) {
    const wrapperPath = (0, path_1.normalizePath)((0, add_nx_scripts_1.nxWrapperPath)());
    if (tree.exists(wrapperPath)) {
        tree.write(wrapperPath, (0, add_nx_scripts_1.getNxWrapperContents)());
    }
}
