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

// packages/lerna/src/migrations/remove-invalid-init-config/remove-invalid-init-config.ts
var remove_invalid_init_config_exports = {};
__export(remove_invalid_init_config_exports, {
  default: () => generator
});
module.exports = __toCommonJS(remove_invalid_init_config_exports);
var import_devkit = require("@nx/devkit");
async function generator(tree) {
  const lernaJson = (0, import_devkit.readJson)(tree, "lerna.json");
  if (lernaJson.init !== void 0) {
    delete lernaJson.init;
    (0, import_devkit.writeJson)(tree, "lerna.json", lernaJson);
  }
  await (0, import_devkit.formatFiles)(tree);
}
