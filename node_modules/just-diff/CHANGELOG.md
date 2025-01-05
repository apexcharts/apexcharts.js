# just-diff

## 6.0.2

### Patch Changes

- Fixes #543. Remove recursing multiple permutations in favor of deciding upfront whether left or right trim is the most efficient.

## 6.0.1

### Patch Changes

- issue #544 Fix case that should be 'add' not 'replace'

## 6.0.0

### Major Changes

- 1669fd90: optimize diff path: trim from left and right (recursviely) and use shortest path, replace at root level if values are of different type. Addresses https://github.com/angus-c/just/issues/505

## 5.2.0

### Minor Changes

- Rename node module .js -> .cjs

## 5.1.1

### Patch Changes

- fix: reorder exports to set default last #488

## 5.1.0

### Minor Changes

- package.json updates to fix #467 and #483

## 5.0.3

### Patch Changes

- Keep ESMs in sync with commonJS modules

## 5.0.2

### Patch Changes

- Fixed issue where remove diffs were sometimes not reversed
