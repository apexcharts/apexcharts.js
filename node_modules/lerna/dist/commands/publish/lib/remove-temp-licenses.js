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

// libs/commands/publish/src/lib/remove-temp-licenses.ts
var remove_temp_licenses_exports = {};
__export(remove_temp_licenses_exports, {
  removeTempLicenses: () => removeTempLicenses
});
function removeTempLicenses(packagesToBeLicensed) {
  if (!packagesToBeLicensed.length) {
    return Promise.resolve();
  }
  return (0, import_p_map.default)(packagesToBeLicensed, (pkg) => import_fs_extra.default.remove(pkg.licensePath));
}
var import_fs_extra, import_p_map;
var init_remove_temp_licenses = __esm({
  "libs/commands/publish/src/lib/remove-temp-licenses.ts"() {
    "use strict";
    import_fs_extra = __toESM(require("fs-extra"));
    import_p_map = __toESM(require("p-map"));
  }
});

// packages/lerna/src/commands/publish/lib/remove-temp-licenses.ts
module.exports = (init_remove_temp_licenses(), __toCommonJS(remove_temp_licenses_exports));
