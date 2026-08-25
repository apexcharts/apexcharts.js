var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
/*!
 * ApexCharts v7.0.0
 * (c) 2018-2026 ApexCharts
 */
function definePictogram(meta) {
  const mark = (
    /** @type {any} */
    __spreadProps(__spreadValues({}, meta), {
      viewBox: meta.viewBox || [0, 0, 100, 100]
    })
  );
  mark.with = (overrides) => definePictogram(__spreadValues(__spreadValues({}, meta), overrides));
  return Object.freeze(mark);
}
const person = /* @__PURE__ */ definePictogram({
  name: "person",
  category: "people",
  source: "original",
  path: (
    // The head is two semicircular arcs, not one arc back to its own start
    // point. A near-degenerate arc (end == start) has no defined centre, and
    // the flattener reads it as NaN - which renders in a browser but breaks
    // every measurement the mark lint makes.
    "M 37 18 A 13 13 0 0 1 63 18 A 13 13 0 0 1 37 18 Z M 50 34 C 61 34 69 40 70 50 L 73 72 L 65 72 L 63 58 L 61 96 L 53 96 L 51 66 L 49 66 L 47 96 L 39 96 L 37 58 L 35 72 L 27 72 L 30 50 C 31 40 39 34 50 34 Z"
  )
});
const house = /* @__PURE__ */ definePictogram({
  name: "house",
  category: "objects",
  source: "original",
  path: "M 50 8 L 94 46 L 82 46 L 82 92 L 58 92 L 58 64 L 42 64 L 42 92 L 18 92 L 18 46 L 6 46 Z"
});
const heart = /* @__PURE__ */ definePictogram({
  name: "heart",
  category: "symbols",
  source: "original",
  path: "M 50 90 C 22 70 6 54 6 36 C 6 21 17 11 30 11 C 39 11 46 16 50 24 C 54 16 61 11 70 11 C 83 11 94 21 94 36 C 94 54 78 70 50 90 Z"
});
const tree = /* @__PURE__ */ definePictogram({
  name: "tree",
  category: "nature",
  source: "original",
  path: "M 50 6 C 66 6 78 18 78 33 C 78 38 77 42 75 46 C 82 50 86 57 86 65 C 86 77 76 86 64 86 L 55 86 L 55 96 L 45 96 L 45 86 L 36 86 C 24 86 14 77 14 65 C 14 57 18 50 25 46 C 23 42 22 38 22 33 C 22 18 34 6 50 6 Z"
});
const droplet = /* @__PURE__ */ definePictogram({
  name: "droplet",
  category: "nature",
  source: "original",
  path: "M 50 4 C 50 4 84 42 84 64 C 84 82 69 96 50 96 C 31 96 16 82 16 64 C 16 42 50 4 50 4 Z"
});
const star = /* @__PURE__ */ definePictogram({
  name: "star",
  category: "symbols",
  source: "original",
  path: "M 50 6 L 61.2 36.6 L 93.8 37.8 L 68.1 57.9 L 77 89.2 L 50 71 L 23 89.2 L 31.9 57.9 L 6.2 37.8 L 38.8 36.6 Z"
});
const car = /* @__PURE__ */ definePictogram({
  name: "car",
  category: "transport",
  source: "original",
  path: "M 6 72 L 9 53 C 10 46 15 41 22 40 L 32 23 C 35 19 39 17 44 17 L 60 17 C 65 17 69 19 71 23 L 81 40 C 88 41 93 46 94 53 L 97 72 L 97 80 L 6 80 Z M 13 88 A 11 11 0 1 1 35 88 A 11 11 0 1 1 13 88 Z M 65 88 A 11 11 0 1 1 87 88 A 11 11 0 1 1 65 88 Z"
});
const bag = /* @__PURE__ */ definePictogram({
  name: "bag",
  category: "objects",
  source: "original",
  path: "M 10 30 L 90 30 L 95 96 L 5 96 Z M 32 30 C 32 14 40 4 50 4 C 60 4 68 14 68 30 L 59 30 C 59 19 55 13 50 13 C 45 13 41 19 41 30 Z"
});
const book = /* @__PURE__ */ definePictogram({
  name: "book",
  category: "objects",
  source: "original",
  path: "M 8 14 C 8 14 26 6 50 16 C 74 6 92 14 92 14 L 92 88 C 92 88 74 80 50 90 C 26 80 8 88 8 88 Z"
});
const cup = /* @__PURE__ */ definePictogram({
  name: "cup",
  category: "objects",
  source: "original",
  path: "M 14 22 L 70 22 L 70 34 L 80 34 C 90 34 96 41 96 51 C 96 63 87 71 75 71 L 69 71 C 65 84 55 92 42 92 C 26 92 14 79 14 61 Z"
});
const bulb = /* @__PURE__ */ definePictogram({
  name: "bulb",
  category: "objects",
  source: "original",
  path: (
    // The collar and contact are wound the SAME way as the envelope (which
    // runs counter-clockwise). They do not overlap it, so a nonzero fill would
    // paint them either way - but a subpath wound against its outline is one
    // edit away from becoming a hole, and it reads as deliberate when it is not.
    "M 50 4 C 32 4 18 18 18 36 C 18 48 25 56 31 63 C 35 68 37 72 37 78 L 63 78 C 63 72 65 68 69 63 C 75 56 82 48 82 36 C 82 18 68 4 50 4 Z M 38 84 L 38 90 L 62 90 L 62 84 Z M 42 94 L 45 99 L 55 99 L 58 94 Z"
  )
});
const plane = /* @__PURE__ */ definePictogram({
  name: "plane",
  category: "transport",
  source: "original",
  path: "M 50 4 C 55 4 58 12 58 24 L 58 38 L 94 62 L 94 72 L 58 60 L 58 82 L 70 90 L 70 97 L 50 92 L 30 97 L 30 90 L 42 82 L 42 60 L 6 72 L 6 62 L 42 38 L 42 24 C 42 12 45 4 50 4 Z"
});
const catalog = [
  person,
  house,
  heart,
  tree,
  droplet,
  star,
  car,
  bag,
  book,
  cup,
  bulb,
  plane
];
const MARK_KEY = "__apexcharts_unit_marks__";
function marks() {
  const g = (
    /** @type {any} */
    globalThis
  );
  if (!g[MARK_KEY]) g[MARK_KEY] = {};
  return g[MARK_KEY];
}
function registerMarks(defs) {
  const table = marks();
  const names = [];
  const entries = Array.isArray(defs) ? defs.map((m) => [m ? m.name : "", m]) : Object.entries(defs);
  entries.forEach(([name, mark]) => {
    const key = String(name);
    if (!key || !mark || typeof /** @type {any} */
    mark.path !== "string") {
      return;
    }
    table[key] = mark;
    names.push(key);
  });
  return names;
}
function unregisterMarks(names) {
  const table = marks();
  (Array.isArray(names) ? names : [names]).forEach((n) => {
    delete table[n];
  });
}
function registeredMarkNames() {
  return Object.keys(marks());
}
export {
  bag,
  book,
  bulb,
  car,
  catalog,
  cup,
  definePictogram,
  droplet,
  heart,
  house,
  person,
  plane,
  registerMarks,
  registeredMarkNames,
  star,
  tree,
  unregisterMarks
};
