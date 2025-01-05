"use strict";
/**
 * Note to developers: STOP! This is the Public API of @nx/devkit.
 * @nx/devkit should be compatible with versions of Nx 1 major version prior.
 * This is so that plugins can use the latest @nx/devkit while their users may use versions +/- 1 of Nx.
 *
 * 1. Try hard to not add to this API to reduce the surface area we need to maintain.
 * 2. Do not add newly created paths from the nx package to this file as they will not be available in older versions of Nx.
 *   a. We might need to duplicate code instead of importing from nx until all supported versions of nx contain the file.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.moveFilesToNewDirectory = exports.convertNxExecutor = exports.convertNxGenerator = exports.offsetFromRoot = exports.ChangeType = exports.applyChangesToString = exports.extractLayoutDirectory = exports.getWorkspaceLayout = exports.names = exports.installPackagesTask = exports.NX_VERSION = exports.removeDependenciesFromPackageJson = exports.ensurePackage = exports.addDependenciesToPackageJson = exports.readTargetOptions = exports.targetToTargetString = exports.parseTargetString = exports.visitNotIgnoredFiles = exports.runTasksInSerial = exports.updateTsConfigsToJs = exports.toJS = exports.OverwriteStrategy = exports.generateFiles = exports.formatFiles = void 0;
/**
 * @category Generators
 */
var format_files_1 = require("./src/generators/format-files");
Object.defineProperty(exports, "formatFiles", { enumerable: true, get: function () { return format_files_1.formatFiles; } });
/**
 * @category Generators
 */
var generate_files_1 = require("./src/generators/generate-files");
Object.defineProperty(exports, "generateFiles", { enumerable: true, get: function () { return generate_files_1.generateFiles; } });
Object.defineProperty(exports, "OverwriteStrategy", { enumerable: true, get: function () { return generate_files_1.OverwriteStrategy; } });
/**
 * @category Generators
 */
var to_js_1 = require("./src/generators/to-js");
Object.defineProperty(exports, "toJS", { enumerable: true, get: function () { return to_js_1.toJS; } });
/**
 * @category Generators
 */
var update_ts_configs_to_js_1 = require("./src/generators/update-ts-configs-to-js");
Object.defineProperty(exports, "updateTsConfigsToJs", { enumerable: true, get: function () { return update_ts_configs_to_js_1.updateTsConfigsToJs; } });
/**
 * @category Generators
 */
var run_tasks_in_serial_1 = require("./src/generators/run-tasks-in-serial");
Object.defineProperty(exports, "runTasksInSerial", { enumerable: true, get: function () { return run_tasks_in_serial_1.runTasksInSerial; } });
/**
 * @category Generators
 */
var visit_not_ignored_files_1 = require("./src/generators/visit-not-ignored-files");
Object.defineProperty(exports, "visitNotIgnoredFiles", { enumerable: true, get: function () { return visit_not_ignored_files_1.visitNotIgnoredFiles; } });
var parse_target_string_1 = require("./src/executors/parse-target-string");
Object.defineProperty(exports, "parseTargetString", { enumerable: true, get: function () { return parse_target_string_1.parseTargetString; } });
Object.defineProperty(exports, "targetToTargetString", { enumerable: true, get: function () { return parse_target_string_1.targetToTargetString; } });
/**
 * @category Executors
 */
var read_target_options_1 = require("./src/executors/read-target-options");
Object.defineProperty(exports, "readTargetOptions", { enumerable: true, get: function () { return read_target_options_1.readTargetOptions; } });
/**
 * @category Utils
 */
var package_json_1 = require("./src/utils/package-json");
Object.defineProperty(exports, "addDependenciesToPackageJson", { enumerable: true, get: function () { return package_json_1.addDependenciesToPackageJson; } });
Object.defineProperty(exports, "ensurePackage", { enumerable: true, get: function () { return package_json_1.ensurePackage; } });
Object.defineProperty(exports, "removeDependenciesFromPackageJson", { enumerable: true, get: function () { return package_json_1.removeDependenciesFromPackageJson; } });
Object.defineProperty(exports, "NX_VERSION", { enumerable: true, get: function () { return package_json_1.NX_VERSION; } });
/**
 * @category Utils
 */
var install_packages_task_1 = require("./src/tasks/install-packages-task");
Object.defineProperty(exports, "installPackagesTask", { enumerable: true, get: function () { return install_packages_task_1.installPackagesTask; } });
/**
 * @category Utils
 */
var names_1 = require("./src/utils/names");
Object.defineProperty(exports, "names", { enumerable: true, get: function () { return names_1.names; } });
/**
 * @category Utils
 */
var get_workspace_layout_1 = require("./src/utils/get-workspace-layout");
Object.defineProperty(exports, "getWorkspaceLayout", { enumerable: true, get: function () { return get_workspace_layout_1.getWorkspaceLayout; } });
Object.defineProperty(exports, "extractLayoutDirectory", { enumerable: true, get: function () { return get_workspace_layout_1.extractLayoutDirectory; } });
/**
 * @category Utils
 */
var string_change_1 = require("./src/utils/string-change");
Object.defineProperty(exports, "applyChangesToString", { enumerable: true, get: function () { return string_change_1.applyChangesToString; } });
Object.defineProperty(exports, "ChangeType", { enumerable: true, get: function () { return string_change_1.ChangeType; } });
/**
 * @category Utils
 */
var offset_from_root_1 = require("./src/utils/offset-from-root");
Object.defineProperty(exports, "offsetFromRoot", { enumerable: true, get: function () { return offset_from_root_1.offsetFromRoot; } });
/**
 * @category Utils
 */
var invoke_nx_generator_1 = require("./src/utils/invoke-nx-generator");
Object.defineProperty(exports, "convertNxGenerator", { enumerable: true, get: function () { return invoke_nx_generator_1.convertNxGenerator; } });
/**
 * @category Utils
 */
var convert_nx_executor_1 = require("./src/utils/convert-nx-executor");
Object.defineProperty(exports, "convertNxExecutor", { enumerable: true, get: function () { return convert_nx_executor_1.convertNxExecutor; } });
/**
 * @category Utils
 */
var move_dir_1 = require("./src/utils/move-dir");
Object.defineProperty(exports, "moveFilesToNewDirectory", { enumerable: true, get: function () { return move_dir_1.moveFilesToNewDirectory; } });
