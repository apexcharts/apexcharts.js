"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChangeType = void 0;
exports.applyChangesToString = applyChangesToString;
var ChangeType;
(function (ChangeType) {
    ChangeType["Delete"] = "Delete";
    ChangeType["Insert"] = "Insert";
})(ChangeType || (exports.ChangeType = ChangeType = {}));
/**
 * Applies a list of changes to a string's original value.
 *
 * This is useful when working with ASTs.
 *
 * For Example, to rename a property in a method's options:
 *
 * ```typescript
 * const code = `bootstrap({
 *   target: document.querySelector('#app')
 * })`;
 *
 * const indexOfPropertyName = 13; // Usually determined by analyzing an AST.
 * const updatedCode = applyChangesToString(code, [
 *   {
 *     type: ChangeType.Insert,
 *     index: indexOfPropertyName,
 *     text: 'element'
 *   },
 *   {
 *     type: ChangeType.Delete,
 *     start: indexOfPropertyName,
 *     length: 6
 *   },
 * ]);
 *
 * bootstrap({
 *   element: document.querySelector('#app')
 * });
 * ```
 */
function applyChangesToString(text, changes) {
    assertChangesValid(changes);
    const sortedChanges = changes.sort((a, b) => {
        const diff = getChangeIndex(a) - getChangeIndex(b);
        if (diff === 0) {
            if (a.type === b.type) {
                return 0;
            }
            else {
                // When at the same place, Insert before Delete
                return isStringInsertion(a) ? -1 : 1;
            }
        }
        return diff;
    });
    let offset = 0;
    for (const change of sortedChanges) {
        const index = getChangeIndex(change) + offset;
        if (isStringInsertion(change)) {
            text = text.slice(0, index) + change.text + text.slice(index);
            offset += change.text.length;
        }
        else {
            text = text.slice(0, index) + text.slice(index + change.length);
            offset -= change.length;
        }
    }
    return text;
}
function assertChangesValid(changes) {
    for (const change of changes) {
        if (isStringInsertion(change)) {
            if (!Number.isInteger(change.index)) {
                throw new TypeError(`${change.index} must be an integer.`);
            }
            if (change.index < 0) {
                throw new Error(`${change.index} must be a positive integer.`);
            }
            if (typeof change.text !== 'string') {
                throw new Error(`${change.text} must be a string.`);
            }
        }
        else {
            if (!Number.isInteger(change.start)) {
                throw new TypeError(`${change.start} must be an integer.`);
            }
            if (change.start < 0) {
                throw new Error(`${change.start} must be a positive integer.`);
            }
            if (!Number.isInteger(change.length)) {
                throw new TypeError(`${change.length} must be an integer.`);
            }
            if (change.length < 0) {
                throw new Error(`${change.length} must be a positive integer.`);
            }
        }
    }
}
function getChangeIndex(change) {
    if (isStringInsertion(change)) {
        return change.index;
    }
    else {
        return change.start;
    }
}
function isStringInsertion(change) {
    return change.type === ChangeType.Insert;
}
