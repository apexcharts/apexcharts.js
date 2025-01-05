"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logShowProjectCommand = logShowProjectCommand;
const devkit_exports_1 = require("nx/src/devkit-exports");
function logShowProjectCommand(projectName) {
    devkit_exports_1.output.log({
        title: `👀 View Details of ${projectName}`,
        bodyLines: [
            `Run "nx show project ${projectName}" to view details about this project.`,
        ],
    });
}
