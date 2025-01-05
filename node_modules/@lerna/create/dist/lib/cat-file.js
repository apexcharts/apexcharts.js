var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
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

// libs/commands/create/src/lib/cat-file.ts
var require_cat_file = __commonJS({
  "libs/commands/create/src/lib/cat-file.ts"(exports2, module2) {
    var import_fs_extra = __toESM(require("fs-extra"));
    var import_path = __toESM(require("path"));
    module2.exports.catFile = catFile2;
    function catFile2(baseDir, fileName, content, opts = "utf8") {
      return import_fs_extra.default.writeFile(import_path.default.join(baseDir, fileName), `${content}
`, opts);
    }
  }
});

// packages/legacy-structure/commands/create/src/lib/cat-file.ts
var catFile = require_cat_file();
module.exports = catFile;
