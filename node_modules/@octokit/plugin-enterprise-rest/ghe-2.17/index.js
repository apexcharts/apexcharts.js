module.exports = octokit =>
  octokit.registerEndpoints({
    enterpriseAdmin: require("./enterprise-admin.json")
  });
