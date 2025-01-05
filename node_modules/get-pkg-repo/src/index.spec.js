'use strict';

const {expect} = require(`chai`);
const {describe, it} = require(`mocha`);
const getPkgRepo = require(`../`);

describe(`get-pkg-repo`, () => {
  it(`should error if cannot get repository`, () => {
    expect(() => getPkgRepo()).to.throw(
      Error,
      `No valid "repository" data found in package metadata. Please see https://docs.npmjs.com/files/package.json#repository for proper syntax.`);
    expect(() => getPkgRepo({})).to.throw(
      Error,
      `No valid "repository" data found in package metadata. Please see https://docs.npmjs.com/files/package.json#repository for proper syntax.`);
    expect(() => getPkgRepo({repository: {type: `git`}})).to.throw(
      Error,
      `No valid "repository" data found in package metadata. Please see https://docs.npmjs.com/files/package.json#repository for proper syntax.`);
  });

  it(`should parse github http when it's just a string`, () => {
    const repository = getPkgRepo({repository: `http://github.com/a/b`});
    expect(repository).to.contain({
      domain: `github.com`,
      type: `github`,
      user: `a`,
      project: `b`,
    });
  });

  it(`should parse github http`, () => {
    const repository = getPkgRepo({repository: {url: `http://github.com/a/b`}});
    expect(repository).to.contain({
      domain: `github.com`,
      type: `github`,
      user: `a`,
      project: `b`,
    });
  });

  it(`should parse github https`, () => {
    const repository = getPkgRepo({repository: {url: `https://github.com/a/b`}});
    expect(repository).to.contain({
      domain: `github.com`,
      type: `github`,
      user: `a`,
      project: `b`,
    });
  });

  it(`should parse gitlab https`, () => {
    const repository = getPkgRepo({repository: `https://gitlab.com/hyper-expanse/semantic-release-gitlab-releaser.git`});
    expect(repository).to.contain({
      domain: `gitlab.com`,
      type: `gitlab`,
      user: `hyper-expanse`,
      project: `semantic-release-gitlab-releaser`,
    });
  });

  it(`should parse github ssh`, () => {
    const repository = getPkgRepo({repository: {url: `git@github.com:joyent/node.git`}});
    expect(repository).to.contain({
      domain: `github.com`,
      type: `github`,
      user: `joyent`,
      project: `node`,
    });
  });

  it(`should parse private gitlab ssh`, () => {
    const repository = getPkgRepo({repository: {url: `git@gitlab.team.com:username/test.git`}});
    expect(repository).to.contain({
      domain: `gitlab.team.com`,
      type: `gitlab`,
      user: `username`,
      project: `test`,
    });
  });

  it(`should parse github short`, () => {
    const repository = getPkgRepo({repository: {url: `a/b`}});
    expect(repository).to.contain({
      domain: `github.com`,
      type: `github`,
      user: `a`,
      project: `b`,
    });
  });

  it(`should parse bitbucket`, () => {
    const repository = getPkgRepo({repository: {url: `https://bitbucket.org/a/b.git`}});
    expect(repository).to.contain({
      domain: `bitbucket.org`,
      type: `bitbucket`,
      user: `a`,
      project: `b`,
    });
  });

  it(`should parse svn`, () => {
    const repository = getPkgRepo({repository: {url: `svn://a/b`}});
    expect(repository).to.contain({
      domain: `a`,
      project: null,
      type: null,
      user: null,
    });
  });

  it(`should parse https`, () => {
    const repository = getPkgRepo({repository: {url: `https://a/b`}});
    expect(repository).to.contain({
      domain: `a`,
      project: null,
      type: null,
      user: null,
    });
  });

  it(`should parse a url with an @`, () => {
    const repository = getPkgRepo({repository: {url: `a@b.com`}});
    expect(repository).to.contain({
      domain: null,
      project: null,
      type: null,
      user: null,
    });
  });

  it(`should fix bad protocol`, () => {
    const repository = getPkgRepo({repository: {url: `badprotocol://a/b`}});
    expect(repository).to.contain({
      domain: `a`,
      project: null,
      type: null,
      user: null,
    });
  });

  it(`should parse github enterprise http url`, () => {
    const repository = getPkgRepo({repository: {url: `http://github.mycompany.dev/user/myRepo`}});
    expect(repository).to.contain({
      domain: `github.mycompany.dev`,
      user: `user`,
      project: `myRepo`,
      type: `github`,
    });
  });

  it(`should parse unknown git URL`, () => {
    const repository = getPkgRepo({repository: {url: `git@git.ourdomain.co:group1/group2/group3/project.git`}});
    expect(repository).to.contain({
      domain: `git.ourdomain.co`,
      user: `group1/group2/group3`,
      project: `project`,
      type: null,
    });
  });

  it(`should parse simple unknown host`, () => {
    const repository = getPkgRepo({repository: {url: `https://unknown-host/`}});
    expect(repository).to.contain({
      domain: `unknown-host`,
      project: null,
      type: null,
      user: null,
    });
  });

  it(`should parse weird unknown host`, () => {
    const repository = getPkgRepo({repository: {url: `https://unknown-host/.git`}});
    expect(repository).to.contain({
      domain: `unknown-host`,
      project: null,
      type: null,
      user: null,
    });
  });
});
