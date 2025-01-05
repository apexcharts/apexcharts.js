# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [Unreleased](https://github.com/motdotla/dotenv-expand/compare/v11.0.7...master)

## [11.0.7](https://github.com/motdotla/dotenv-expand/compare/v11.0.6...v11.0.7) (2024-11-13)

### Changed

- 🐞 fix self-expanding undefined variable with default value ([#126](https://github.com/motdotla/dotenv-expand/pull/126))

## [11.0.6](https://github.com/motdotla/dotenv-expand/compare/v11.0.5...v11.0.6) (2024-02-17)

### Changed

- Fix `.nyc_output` in `.npmignore`

## [11.0.5](https://github.com/motdotla/dotenv-expand/compare/v11.0.4...v11.0.5) (2024-02-17)

### Changed

- 🐞 fix recursive expansion when expansion key is sourced from `process.env` ([#121](https://github.com/motdotla/dotenv-expand/pull/121))

## [11.0.4](https://github.com/motdotla/dotenv-expand/compare/v11.0.3...v11.0.4) (2024-02-15)

### Changed

- 🐞 fix recursive expansion when expansion keys in reverse order ([#118](https://github.com/motdotla/dotenv-expand/pull/118))

## [11.0.3](https://github.com/motdotla/dotenv-expand/compare/v11.0.2...v11.0.3) (2024-02-11)

### Changed

- 🐞 bug fix when `processEnv` set to process.env rather than empty object (also test fixes which hid the bug) ([#113](https://github.com/motdotla/dotenv-expand/pull/113))

## [11.0.2](https://github.com/motdotla/dotenv-expand/compare/v11.0.1...v11.0.2) (2024-02-10)

### Changed

- Changed funding link in package.json to [`dotenvx.com`](https://dotenvx.com)

## [11.0.1](https://github.com/motdotla/dotenv-expand/compare/v11.0.0...v11.0.1) (2024-02-10)

### Added

- Added funding link in package.json

## [11.0.0](https://github.com/motdotla/dotenv-expand/compare/v10.0.0...v11.0.0) (2024-02-10)

### Added

- Add typings for `import dotenv-expand/config` ([#99](https://github.com/motdotla/dotenv-expand/pull/99))
- Support expansion of dot in env variable names like `POSTGRESQL.BASE.USER` ([#93](https://github.com/motdotla/dotenv-expand/pull/93))
- Add `processEnv` option ([#105](https://github.com/motdotla/dotenv-expand/pull/105))
- Add support for default format of `${VAR-default}` ([#109](https://github.com/motdotla/dotenv-expand/pull/109))

### Changed

- Do not expand prior `process.env` environment variables. NOTE: make sure to see updated README regarding `dotenv.config({ processEnv: {} })` ([#104](https://github.com/motdotla/dotenv-expand/pull/104))
- 🐞 handle `$var1$var2` ([#103](https://github.com/motdotla/dotenv-expand/issues/103), [#104](https://github.com/motdotla/dotenv-expand/pull/104))
- 🐞 fix fatal recursive error when variable defines value with same variable `VAR=$VAR` [#98](https://github.com/motdotla/dotenv-expand/issues/98)

### Removed

- Remove `ignoreProcessEnv` option (use `processEnv` option going forward)

## [10.0.0](https://github.com/motdotla/dotenv-expand/compare/v9.0.0...v10.0.0) (2022-12-16)

### Added

- Support special characters in default expansion ([#74](https://github.com/motdotla/dotenv-expand/pull/74))

## [9.0.0](https://github.com/motdotla/dotenv-expand/compare/v8.0.3...v9.0.0) (2022-08-30)

### Added

- Proper support for preload and cli args ([#78](https://github.com/motdotla/dotenv-expand/pull/78))

## [8.0.3](https://github.com/motdotla/dotenv-expand/compare/v8.0.2...v8.0.3) (2022-03-21)

### Changed

- 🐞 Fixed defaults bug ([#71](https://github.com/motdotla/dotenv-expand/pull/71))

## [8.0.2](https://github.com/motdotla/dotenv-expand/compare/v8.0.1...v8.0.2) (2022-03-11)

### Changed

- 🐞 Fixed preloading bug

## [8.0.1](https://github.com/motdotla/dotenv-expand/compare/v8.0.0...v8.0.1) (2022-02-03)

### Added

- Added config.js to package.json lookups

## [8.0.0](https://github.com/motdotla/dotenv-expand/compare/v7.0.0...v8.0.0) (2022-02-03)

### Changed

- _Breaking:_ Bump to `v16.0.0` of dotenv

### Added

- Preload support 🎉 ([#31](https://github.com/motdotla/dotenv-expand/pull/31))

## [7.0.0](https://github.com/motdotla/dotenv-expand/compare/v6.0.1...v7.0.0) (2022-01-17)

### Changed

- _Breaking:_ Bump to `v15.0.0` of dotenv

## [6.0.1](https://github.com/motdotla/dotenv-expand/compare/v6.0.0...v6.0.1) (2022-01-17)

### Changed

- Updated README

## [6.0.0](https://github.com/motdotla/dotenv-expand/compare/v5.1.0...v6.0.0) (2022-01-17)

### Changed

- _Breaking_ Move default export to export of `expand` function ([#14b1f2](https://github.com/motdotla/dotenv-expand/commit/14b1f28f608bc73450dca8c5aaf3a1e4f65e09ca))

### Added

- Add default expansion 🎉 ([#39](https://github.com/motdotla/dotenv-expand/pull/39))
- Add missing type descriptions

## 5.1.0 and prior

Please see commit history.




