"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// packages/lerna/src/migrations/update-options-from-legacy-deprecate-config/update-options-from-legacy-deprecate-config.ts
var update_options_from_legacy_deprecate_config_exports = {};
__export(update_options_from_legacy_deprecate_config_exports, {
  default: () => generator
});
module.exports = __toCommonJS(update_options_from_legacy_deprecate_config_exports);
var import_devkit = require("@nx/devkit");
async function generator(tree) {
  const lernaJson = (0, import_devkit.readJson)(tree, "lerna.json");
  if (lernaJson.commands) {
    lernaJson.command = {
      ...lernaJson.commands,
      // Prefer already correctly named config when merging
      ...lernaJson.command
    };
    delete lernaJson.commands;
  }
  updateIncludeFilteredDependencies(lernaJson);
  updateIncludeFilteredDependents(lernaJson);
  updateGithubRelease(lernaJson);
  updateLegacyVersionOptions(lernaJson);
  (0, import_devkit.writeJson)(tree, "lerna.json", lernaJson);
  await (0, import_devkit.formatFiles)(tree);
}
function updateIncludeFilteredDependencies(json) {
  const commandsToCheck = ["add", "bootstrap", "clean", "list", "run", "exec"];
  for (const command of commandsToCheck) {
    if (json.command?.[command]?.["includeFilteredDependencies"] !== void 0) {
      json.command[command]["includeDependencies"] = json.command?.[command]?.["includeFilteredDependencies"];
      delete json.command[command]["includeFilteredDependencies"];
    }
  }
}
function updateIncludeFilteredDependents(json) {
  const commandsToCheck = ["add", "bootstrap", "clean", "list", "run", "exec"];
  for (const command of commandsToCheck) {
    if (json.command?.[command]?.["includeFilteredDependents"] !== void 0) {
      json.command[command]["includeDependents"] = json.command?.[command]?.["includeFilteredDependents"];
      delete json.command[command]["includeFilteredDependents"];
    }
  }
}
function updateGithubRelease(json) {
  const commandsToCheck = ["version", "publish"];
  for (const command of commandsToCheck) {
    if (json.command?.[command]?.["githubRelease"] === true) {
      json.command[command]["createRelease"] = "github";
    }
    delete json.command?.[command]?.["githubRelease"];
  }
}
function updateLegacyVersionOptions(json) {
  const commandsToCheck = ["version", "publish"];
  for (const command of commandsToCheck) {
    if (json.command?.[command]?.["skipGit"] === true) {
      json.command[command]["push"] = false;
      json.command[command]["gitTagVersion"] = false;
    }
    delete json.command?.[command]?.["skipGit"];
    if (json.command?.[command]?.["repoVersion"]) {
      json.command[command]["bump"] = json.command[command]["repoVersion"];
    }
    delete json.command?.[command]?.["repoVersion"];
    if (json.command?.[command]?.["cdVersion"]) {
      json.command[command]["bump"] = json.command[command]["cdVersion"];
    }
    delete json.command?.[command]?.["cdVersion"];
    if (json.command?.[command]?.["npmTag"]) {
      json.command[command]["distTag"] = json.command[command]["npmTag"];
    }
    delete json.command?.[command]?.["npmTag"];
    if (json.command?.[command]?.["ignore"]) {
      json.command[command]["ignoreChanges"] = json.command[command]["ignore"];
    }
    delete json.command?.[command]?.["ignore"];
  }
}
