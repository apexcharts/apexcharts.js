"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.release = exports.releaseVersion = exports.releasePublish = exports.releaseChangelog = exports.ReleaseClient = void 0;
const changelog_1 = require("./changelog");
const publish_1 = require("./publish");
const release_1 = require("./release");
const version_1 = require("./version");
/**
 * @public
 */
class ReleaseClient {
    constructor(overrideReleaseConfig) {
        this.overrideReleaseConfig = overrideReleaseConfig;
        this.releaseChangelog = (0, changelog_1.createAPI)(this.overrideReleaseConfig);
        this.releasePublish = (0, publish_1.createAPI)(this.overrideReleaseConfig);
        this.releaseVersion = (0, version_1.createAPI)(this.overrideReleaseConfig);
        this.release = (0, release_1.createAPI)(this.overrideReleaseConfig);
    }
}
exports.ReleaseClient = ReleaseClient;
const defaultClient = new ReleaseClient({});
/**
 * @public
 */
exports.releaseChangelog = defaultClient.releaseChangelog.bind(defaultClient);
/**
 * @public
 */
exports.releasePublish = defaultClient.releasePublish.bind(defaultClient);
/**
 * @public
 */
exports.releaseVersion = defaultClient.releaseVersion.bind(defaultClient);
/**
 * @public
 */
exports.release = defaultClient.release.bind(defaultClient);
