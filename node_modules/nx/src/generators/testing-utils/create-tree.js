"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTree = createTree;
const tree_1 = require("../tree");
/**
 * Creates a host for testing.
 */
function createTree() {
    return new tree_1.FsTree('/virtual', false);
}
