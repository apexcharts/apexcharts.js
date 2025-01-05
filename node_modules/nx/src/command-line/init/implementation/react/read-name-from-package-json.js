"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.readNameFromPackageJson = readNameFromPackageJson;
const fileutils_1 = require("../../../../utils/fileutils");
function readNameFromPackageJson() {
    let appName = 'webapp';
    if ((0, fileutils_1.fileExists)('package.json')) {
        const json = (0, fileutils_1.readJsonFile)('package.json');
        if (json['name'] &&
            json['name'].length &&
            json['name'].replace(/\s/g, '').length) {
            appName = json['name'].replace(/\s/g, '');
        }
    }
    return appName;
}
