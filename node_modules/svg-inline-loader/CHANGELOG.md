# Change Log

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

<a name="0.8.2"></a>
## [0.8.2](https://github.com/sairion/svg-inline-loader/compare/v0.8.1...v0.8.2) (2020-02-17)



<a name="0.8.1"></a>
## [0.8.1](https://github.com/sairion/svg-inline-loader/compare/v0.8.0...v0.8.1) (2020-02-07)



<a name="0.8.0"></a>
# [0.8.0](https://github.com/sairion/svg-inline-loader/compare/0.6.1...v0.8.0) (2017-07-16)


### Bug Fixes

* add missing idPrefix as default value to config, close [#36](https://github.com/sairion/svg-inline-loader/issues/36) ([ba7738d](https://github.com/sairion/svg-inline-loader/commit/ba7738d))
* corrupted css properties in style tag ([2d28c42](https://github.com/sairion/svg-inline-loader/commit/2d28c42))
* don't transform webpack2 query objects ([9373e3e](https://github.com/sairion/svg-inline-loader/commit/9373e3e))
* multiple classes in class string fix ([2024e06](https://github.com/sairion/svg-inline-loader/commit/2024e06))


### Features

* warnTags and warnTagAttrs ([ada00d7](https://github.com/sairion/svg-inline-loader/commit/ada00d7))


## 0.6.1

* Fixed a bug when using `removingTagAttrs`

## 0.6.0

* Added `classPrefix` option (by @kinetifex)

## 0.5.0

* Added `removingTagAttrs` option (by @iernie)

## 0.4.0

* Deprecated `<IconSVG />` and moved to another package ([`svg-inline-react`](https://github.com/sairion/svg-inline-react))

## 0.3.0

* Isolate transfomration functions and make tag removal optional, add README
* Added React svg icon tag

## 0.2.3

* Tag removal is fixed (`<defs />`, `<style />`, `<title />`, ...) and test added

## 0.2.2

* Added unittest

## 0.2.1

* Regex expanding self-closing tags added due to `simple-html-tokenizer`'s behavior (by @rondonjon)
* Added README and CHANGELOG

## 0.2.0

* Fixed Non-`<svg>` elements' width and height attributes gets removed
* Uses `simple-html-tokenizer` to tokenize html tags

## 0.1.0

* Initial implementation
