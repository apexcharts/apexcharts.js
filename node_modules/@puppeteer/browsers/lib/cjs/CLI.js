"use strict";
/**
 * @license
 * Copyright 2023 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeProgressCallback = exports.CLI = void 0;
const process_1 = require("process");
const readline = __importStar(require("readline"));
const progress_1 = __importDefault(require("progress"));
const helpers_1 = require("yargs/helpers");
const yargs_1 = __importDefault(require("yargs/yargs"));
const browser_data_js_1 = require("./browser-data/browser-data.js");
const Cache_js_1 = require("./Cache.js");
const detectPlatform_js_1 = require("./detectPlatform.js");
const install_js_1 = require("./install.js");
const launch_js_1 = require("./launch.js");
/**
 * @public
 */
class CLI {
    #cachePath;
    #rl;
    #scriptName = '';
    #allowCachePathOverride = true;
    #pinnedBrowsers;
    #prefixCommand;
    constructor(opts, rl) {
        if (!opts) {
            opts = {};
        }
        if (typeof opts === 'string') {
            opts = {
                cachePath: opts,
            };
        }
        this.#cachePath = opts.cachePath ?? process.cwd();
        this.#rl = rl;
        this.#scriptName = opts.scriptName ?? '@puppeteer/browsers';
        this.#allowCachePathOverride = opts.allowCachePathOverride ?? true;
        this.#pinnedBrowsers = opts.pinnedBrowsers;
        this.#prefixCommand = opts.prefixCommand;
    }
    #defineBrowserParameter(yargs) {
        yargs.positional('browser', {
            description: 'Which browser to install <browser>[@<buildId|latest>]. `latest` will try to find the latest available build. `buildId` is a browser-specific identifier such as a version or a revision.',
            type: 'string',
            coerce: (opt) => {
                return {
                    name: this.#parseBrowser(opt),
                    buildId: this.#parseBuildId(opt),
                };
            },
        });
    }
    #definePlatformParameter(yargs) {
        yargs.option('platform', {
            type: 'string',
            desc: 'Platform that the binary needs to be compatible with.',
            choices: Object.values(browser_data_js_1.BrowserPlatform),
            defaultDescription: 'Auto-detected',
        });
    }
    #definePathParameter(yargs, required = false) {
        if (!this.#allowCachePathOverride) {
            return;
        }
        yargs.option('path', {
            type: 'string',
            desc: 'Path to the root folder for the browser downloads and installation. The installation folder structure is compatible with the cache structure used by Puppeteer.',
            defaultDescription: 'Current working directory',
            ...(required ? {} : { default: process.cwd() }),
        });
        if (required) {
            yargs.demandOption('path');
        }
    }
    async run(argv) {
        const yargsInstance = (0, yargs_1.default)((0, helpers_1.hideBin)(argv));
        let target = yargsInstance.scriptName(this.#scriptName);
        if (this.#prefixCommand) {
            target = target.command(this.#prefixCommand.cmd, this.#prefixCommand.description, yargs => {
                return this.#build(yargs);
            });
        }
        else {
            target = this.#build(target);
        }
        await target
            .demandCommand(1)
            .help()
            .wrap(Math.min(120, yargsInstance.terminalWidth()))
            .parse();
    }
    #build(yargs) {
        const latestOrPinned = this.#pinnedBrowsers ? 'pinned' : 'latest';
        return yargs
            .command('install <browser>', 'Download and install the specified browser. If successful, the command outputs the actual browser buildId that was installed and the absolute path to the browser executable (format: <browser>@<buildID> <path>).', yargs => {
            this.#defineBrowserParameter(yargs);
            this.#definePlatformParameter(yargs);
            this.#definePathParameter(yargs);
            yargs.option('base-url', {
                type: 'string',
                desc: 'Base URL to download from',
            });
            yargs.example('$0 install chrome', `Install the ${latestOrPinned} available build of the Chrome browser.`);
            yargs.example('$0 install chrome@latest', 'Install the latest available build for the Chrome browser.');
            yargs.example('$0 install chrome@stable', 'Install the latest available build for the Chrome browser from the stable channel.');
            yargs.example('$0 install chrome@beta', 'Install the latest available build for the Chrome browser from the beta channel.');
            yargs.example('$0 install chrome@dev', 'Install the latest available build for the Chrome browser from the dev channel.');
            yargs.example('$0 install chrome@canary', 'Install the latest available build for the Chrome Canary browser.');
            yargs.example('$0 install chrome@115', 'Install the latest available build for Chrome 115.');
            yargs.example('$0 install chromedriver@canary', 'Install the latest available build for ChromeDriver Canary.');
            yargs.example('$0 install chromedriver@115', 'Install the latest available build for ChromeDriver 115.');
            yargs.example('$0 install chromedriver@115.0.5790', 'Install the latest available patch (115.0.5790.X) build for ChromeDriver.');
            yargs.example('$0 install chrome-headless-shell', 'Install the latest available chrome-headless-shell build.');
            yargs.example('$0 install chrome-headless-shell@beta', 'Install the latest available chrome-headless-shell build corresponding to the Beta channel.');
            yargs.example('$0 install chrome-headless-shell@118', 'Install the latest available chrome-headless-shell 118 build.');
            yargs.example('$0 install chromium@1083080', 'Install the revision 1083080 of the Chromium browser.');
            yargs.example('$0 install firefox', 'Install the latest nightly available build of the Firefox browser.');
            yargs.example('$0 install firefox@stable', 'Install the latest stable build of the Firefox browser.');
            yargs.example('$0 install firefox@beta', 'Install the latest beta build of the Firefox browser.');
            yargs.example('$0 install firefox@devedition', 'Install the latest devedition build of the Firefox browser.');
            yargs.example('$0 install firefox@esr', 'Install the latest ESR build of the Firefox browser.');
            yargs.example('$0 install firefox@nightly', 'Install the latest nightly build of the Firefox browser.');
            yargs.example('$0 install firefox@stable_111.0.1', 'Install a specific version of the Firefox browser.');
            yargs.example('$0 install firefox --platform mac', 'Install the latest Mac (Intel) build of the Firefox browser.');
            if (this.#allowCachePathOverride) {
                yargs.example('$0 install firefox --path /tmp/my-browser-cache', 'Install to the specified cache directory.');
            }
        }, async (argv) => {
            const args = argv;
            args.platform ??= (0, detectPlatform_js_1.detectBrowserPlatform)();
            if (!args.platform) {
                throw new Error(`Could not resolve the current platform`);
            }
            if (args.browser.buildId === 'pinned') {
                const pinnedVersion = this.#pinnedBrowsers?.[args.browser.name];
                if (!pinnedVersion) {
                    throw new Error(`No pinned version found for ${args.browser.name}`);
                }
                args.browser.buildId = pinnedVersion;
            }
            const originalBuildId = args.browser.buildId;
            args.browser.buildId = await (0, browser_data_js_1.resolveBuildId)(args.browser.name, args.platform, args.browser.buildId);
            await (0, install_js_1.install)({
                browser: args.browser.name,
                buildId: args.browser.buildId,
                platform: args.platform,
                cacheDir: args.path ?? this.#cachePath,
                downloadProgressCallback: makeProgressCallback(args.browser.name, args.browser.buildId),
                baseUrl: args.baseUrl,
                buildIdAlias: originalBuildId !== args.browser.buildId
                    ? originalBuildId
                    : undefined,
            });
            console.log(`${args.browser.name}@${args.browser.buildId} ${(0, launch_js_1.computeExecutablePath)({
                browser: args.browser.name,
                buildId: args.browser.buildId,
                cacheDir: args.path ?? this.#cachePath,
                platform: args.platform,
            })}`);
        })
            .command('launch <browser>', 'Launch the specified browser', yargs => {
            this.#defineBrowserParameter(yargs);
            this.#definePlatformParameter(yargs);
            this.#definePathParameter(yargs);
            yargs.option('detached', {
                type: 'boolean',
                desc: 'Detach the child process.',
                default: false,
            });
            yargs.option('system', {
                type: 'boolean',
                desc: 'Search for a browser installed on the system instead of the cache folder.',
                default: false,
            });
            yargs.example('$0 launch chrome@115.0.5790.170', 'Launch Chrome 115.0.5790.170');
            yargs.example('$0 launch firefox@112.0a1', 'Launch the Firefox browser identified by the milestone 112.0a1.');
            yargs.example('$0 launch chrome@115.0.5790.170 --detached', 'Launch the browser but detach the sub-processes.');
            yargs.example('$0 launch chrome@canary --system', 'Try to locate the Canary build of Chrome installed on the system and launch it.');
        }, async (argv) => {
            const args = argv;
            const executablePath = args.system
                ? (0, launch_js_1.computeSystemExecutablePath)({
                    browser: args.browser.name,
                    // TODO: throw an error if not a ChromeReleaseChannel is provided.
                    channel: args.browser.buildId,
                    platform: args.platform,
                })
                : (0, launch_js_1.computeExecutablePath)({
                    browser: args.browser.name,
                    buildId: args.browser.buildId,
                    cacheDir: args.path ?? this.#cachePath,
                    platform: args.platform,
                });
            (0, launch_js_1.launch)({
                executablePath,
                detached: args.detached,
            });
        })
            .command('clear', this.#allowCachePathOverride
            ? 'Removes all installed browsers from the specified cache directory'
            : `Removes all installed browsers from ${this.#cachePath}`, yargs => {
            this.#definePathParameter(yargs, true);
        }, async (argv) => {
            const args = argv;
            const cacheDir = args.path ?? this.#cachePath;
            const rl = this.#rl ?? readline.createInterface({ input: process_1.stdin, output: process_1.stdout });
            rl.question(`Do you want to permanently and recursively delete the content of ${cacheDir} (yes/No)? `, answer => {
                rl.close();
                if (!['y', 'yes'].includes(answer.toLowerCase().trim())) {
                    console.log('Cancelled.');
                    return;
                }
                const cache = new Cache_js_1.Cache(cacheDir);
                cache.clear();
                console.log(`${cacheDir} cleared.`);
            });
        })
            .demandCommand(1)
            .help();
    }
    #parseBrowser(version) {
        return version.split('@').shift();
    }
    #parseBuildId(version) {
        const parts = version.split('@');
        return parts.length === 2
            ? parts[1]
            : this.#pinnedBrowsers
                ? 'pinned'
                : 'latest';
    }
}
exports.CLI = CLI;
/**
 * @public
 */
function makeProgressCallback(browser, buildId) {
    let progressBar;
    let lastDownloadedBytes = 0;
    return (downloadedBytes, totalBytes) => {
        if (!progressBar) {
            progressBar = new progress_1.default(`Downloading ${browser} ${buildId} - ${toMegabytes(totalBytes)} [:bar] :percent :etas `, {
                complete: '=',
                incomplete: ' ',
                width: 20,
                total: totalBytes,
            });
        }
        const delta = downloadedBytes - lastDownloadedBytes;
        lastDownloadedBytes = downloadedBytes;
        progressBar.tick(delta);
    };
}
exports.makeProgressCallback = makeProgressCallback;
function toMegabytes(bytes) {
    const mb = bytes / 1000 / 1000;
    return `${Math.round(mb * 10) / 10} MB`;
}
//# sourceMappingURL=CLI.js.map