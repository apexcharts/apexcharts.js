"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.names = names;
/**
 * Util function to generate different strings based off the provided name.
 *
 * Examples:
 *
 * ```typescript
 * names("my-name") // {name: 'my-name', className: 'MyName', propertyName: 'myName', constantName: 'MY_NAME', fileName: 'my-name'}
 * names("myName") // {name: 'myName', className: 'MyName', propertyName: 'myName', constantName: 'MY_NAME', fileName: 'my-name'}
 * ```
 * @param name
 */
function names(name) {
    return {
        name,
        className: toClassName(name),
        propertyName: toPropertyName(name),
        constantName: toConstantName(name),
        fileName: toFileName(name),
    };
}
/**
 * Hyphenated to UpperCamelCase
 */
function toClassName(str) {
    return toCapitalCase(toPropertyName(str));
}
/**
 * Hyphenated to lowerCamelCase
 */
function toPropertyName(s) {
    return s
        .replace(/([^a-zA-Z0-9])+(.)?/g, (_, __, chr) => chr ? chr.toUpperCase() : '')
        .replace(/[^a-zA-Z\d]/g, '')
        .replace(/^([A-Z])/, (m) => m.toLowerCase());
}
/**
 * Hyphenated to CONSTANT_CASE
 */
function toConstantName(s) {
    const normalizedS = s.toUpperCase() === s ? s.toLowerCase() : s;
    return toFileName(toPropertyName(normalizedS))
        .replace(/([^a-zA-Z0-9])/g, '_')
        .toUpperCase();
}
/**
 * Upper camelCase to lowercase, hyphenated
 */
function toFileName(s) {
    return s
        .replace(/([a-z\d])([A-Z])/g, '$1_$2')
        .toLowerCase()
        .replace(/(?!^[_])[ _]/g, '-');
}
/**
 * Capitalizes the first letter of a string
 */
function toCapitalCase(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
}
