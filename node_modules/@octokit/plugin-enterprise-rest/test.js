const simple = require("simple-mock");
const { test } = require("tap");

test('require("@octokit/enterprise-rest/v2.18")', t => {
  const octokitMock = {
    registerEndpoints: simple.mock()
  };

  const plugin = require("./ghe-2.18");

  plugin(octokitMock);

  t.equals(octokitMock.registerEndpoints.callCount, 1);
  t.end();
});

test('require("@octokit/enterprise-rest/v2.18/all")', t => {
  const octokitMock = {
    registerEndpoints: simple.mock()
  };

  const plugin = require("./ghe-2.18/all");

  plugin(octokitMock);

  t.equals(octokitMock.registerEndpoints.callCount, 1);
  t.end();
});
