"use strict";
/**
 * The Nx Devkit is the underlying technology used to customize Nx to support
 * different technologies and custom use-cases. It contains many utility
 * functions for reading and writing files, updating configuration,
 * working with Abstract Syntax Trees(ASTs), and more.
 *
 * As with most things in Nx, the core of Nx Devkit is very simple.
 * It only uses language primitives and immutable objects
 * (the tree being the only exception).
 *
 * @module @nx/devkit
 */
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
tslib_1.__exportStar(require("nx/src/devkit-exports"), exports);
tslib_1.__exportStar(require("./public-api"), exports);
