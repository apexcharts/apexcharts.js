"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toJS = toJS;
const versions_1 = require("../utils/versions");
const package_json_1 = require("../utils/package-json");
/**
 * Rename and transpile any new typescript files created to javascript files
 */
function toJS(tree, options) {
    const { JsxEmit, ScriptTarget, transpile, ModuleKind } = (0, package_json_1.ensurePackage)('typescript', versions_1.typescriptVersion);
    for (const c of tree.listChanges()) {
        if ((c.path.endsWith('.ts') || c.path.endsWith('tsx')) &&
            c.type === 'CREATE') {
            tree.write(c.path, transpile(c.content.toString('utf-8'), {
                allowJs: true,
                jsx: JsxEmit.Preserve,
                target: options?.target ?? ScriptTarget.ESNext,
                module: options?.module ?? ModuleKind.ESNext,
            }));
            tree.rename(c.path, c.path.replace(/\.ts$/, options?.extension ?? '.js'));
            if (options?.useJsx) {
                tree.rename(c.path, c.path.replace(/\.tsx$/, '.jsx'));
            }
            else {
                tree.rename(c.path, c.path.replace(/\.tsx$/, options?.extension ?? '.js'));
            }
        }
    }
}
