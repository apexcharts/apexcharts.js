"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
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
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// libs/commands/version/src/lib/is-breaking-change.ts
var is_breaking_change_exports = {};
__export(is_breaking_change_exports, {
  isBreakingChange: () => isBreakingChange
});
function isBreakingChange(currentVersion, nextVersion) {
  const releaseType = import_semver.default.diff(currentVersion, nextVersion);
  let breaking;
  if (releaseType === "major") {
    breaking = true;
  } else if (releaseType === "minor") {
    breaking = import_semver.default.lt(currentVersion, "1.0.0");
  } else if (releaseType === "patch") {
    breaking = import_semver.default.lt(currentVersion, "0.1.0");
  } else {
    breaking = false;
  }
  return breaking;
}
var import_semver;
var init_is_breaking_change = __esm({
  "libs/commands/version/src/lib/is-breaking-change.ts"() {
    "use strict";
    import_semver = __toESM(require("semver"));
  }
});

// packages/lerna/src/commands/version/lib/is-breaking-change.ts
module.exports = (init_is_breaking_change(), __toCommonJS(is_breaking_change_exports));
