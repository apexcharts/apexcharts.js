'use strict';

const { parse } = require(`url`);

const URL_PATTERNS = new RegExp(/^\/?:?([/\w-.]+)\/([\w-.]+)\/?$/);
const GITHUB_API = new RegExp(/^\/repos\/([\w-.]+)\/([\w-.]+)\/(?:tarball|zipball)(?:\/.+)?$/);
const GITHUB_CODELOAD = new RegExp(/^\/([\w-.]+)\/([\w-.]+)\/(?:legacy\.(?:zip|tar\.gz))(?:\/.+)?$/);

module.exports = url => {
  const modifiedURL = url
    // Prepend `https` to the URL so that `url.parse` will see the value of `url` as an actual `url`, and therefore, correctly parse it.
    .replace(/^git@/, `https://git@`)

    // Remove `.git` from any URL before applying regular expressions to the string. Removing `.git` through a non capture group is kind of difficult.
    .replace(/\.git$/, ``);

  const parsedURL = parse(modifiedURL);
  const format = matches => {
    return { browse: createBrowseURL(parsedURL, matches), domain: parsedURL.host, project: matches[2] || null, type: getType(parsedURL), user: matches[1] || null };
  };

  if (parsedURL.host) {
    if (parsedURL.host.includes(`api.github.com`)) {
      const matches = GITHUB_API.exec(parsedURL.pathname) || [];
      return format(matches);
    }

    if (parsedURL.host.includes(`codeload.github.com`)) {
      const matches = GITHUB_CODELOAD.exec(parsedURL.pathname) || [];
      return format(matches);
    }
  }

  return format(URL_PATTERNS.exec(parsedURL.pathname) || []);
};

function getType (parsedURL) {
  if (typeof parsedURL.host !== `string`) {
    return null;
  }

  if (parsedURL.host.indexOf(`github`) !== -1) {
    return 'github';
  }
  if (parsedURL.host.indexOf(`gitlab`) !== -1) {
    return 'gitlab';
  }

  return null;
}

function createBrowseURL (parsedURL, matches) {
  const protocol = parsedURL.protocol === `http:` ? `http:` : `https:`;
  const browseURL = `${protocol}//${parsedURL.host}/${matches[1]}/${matches[2]}`;

  return () => {
    return browseURL;
  };
}
