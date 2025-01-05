// Parse unit value
export const numberAndUnit =
  /^([+-]?(\d+(\.\d*)?|\.\d+)(e[+-]?\d+)?)([a-z%]*)$/i

// Parse hex value
export const hex = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i

// Parse rgb value
export const rgb = /rgb\((\d+),(\d+),(\d+)\)/

// Parse reference id
export const reference = /(#[a-z_][a-z0-9\-_]*)/i

// splits a transformation chain
export const transforms = /\)\s*,?\s*/

// Whitespace
export const whitespace = /\s/g

// Test hex value
export const isHex = /^#[a-f0-9]{3}$|^#[a-f0-9]{6}$/i

// Test rgb value
export const isRgb = /^rgb\(/

// Test for blank string
export const isBlank = /^(\s+)?$/

// Test for numeric string
export const isNumber = /^[+-]?(\d+(\.\d*)?|\.\d+)(e[+-]?\d+)?$/i

// Test for image url
export const isImage = /\.(jpg|jpeg|png|gif|svg)(\?[^=]+.*)?/i

// split at whitespace and comma
export const delimiter = /[\s,]+/

// Test for path letter
export const isPathLetter = /[MLHVCSQTAZ]/i
