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

// libs/commands/publish/src/lib/get-packages-without-license.ts
var get_packages_without_license_exports = {};
__export(get_packages_without_license_exports, {
  getPackagesWithoutLicense: () => getPackagesWithoutLicense
});
function getPackagesWithoutLicense(project, packagesToPublish) {
  return project.getPackageLicensePaths().then((licensePaths) => {
    const licensed = new Set(licensePaths.map((lp) => import_path.default.dirname(lp)));
    return packagesToPublish.filter((pkg) => !licensed.has(pkg.location));
  });
}
var import_path;
var init_get_packages_without_license = __esm({
  "libs/commands/publish/src/lib/get-packages-without-license.ts"() {
    "use strict";
    import_path = __toESM(require("path"));
  }
});

// packages/lerna/src/commands/publish/lib/get-packages-without-license.ts
module.exports = (init_get_packages_without_license(), __toCommonJS(get_packages_without_license_exports));
