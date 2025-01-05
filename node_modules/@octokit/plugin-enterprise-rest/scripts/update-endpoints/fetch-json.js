const { readFileSync, writeFileSync } = require("fs");
const path = require("path");

const { graphql } = require("@octokit/graphql");
const prettier = require("prettier");

// workaround because VERSION is not set for some reason
if (process.env.GITHUB_EVENT_PATH) {
  const payload = JSON.parse(
    readFileSync(process.env.GITHUB_EVENT_PATH, "utf8")
  );
  console.log(`process.env.VERSION`);
  console.log(process.env.VERSION);

  console.log(`payload`);
  console.log(payload);
  process.env.VERSION = payload.client_payload.version;
}

if (!process.env.VERSION) {
  throw new Error(`VERSION environment variable must be set`);
}

const QUERY = `
  fragment endpointFields on Endpoint {
    name
    scope(format: CAMELCASE)
    id(format: CAMELCASE)
    method
    url
    isDeprecated
    description
    documentationUrl
    previews(required: true) {
      name
    }
    headers {
      name
      value
    }
    parameters {
      name
      description
      in
      type
      required
      enum
      allowNull
      mapToData
      validation
      alias
      deprecated
    }
    responses {
      code
      description
      examples {
        data
      }
    }
    renamed {
      before {
        scope(format: CAMELCASE)
        id(format: CAMELCASE)
      }
      after {
        scope(format: CAMELCASE)
        id(format: CAMELCASE)
      }
      date
      note
    }
  }

  query ($version: String) {
    ghe219: endpoints(version: $version, ghe: GHE_219, filter: { isLegacy: false, isGithubCloudOnly: false }) {
      ...endpointFields
    }
    ghe218: endpoints(version: $version, ghe: GHE_218, filter: { isLegacy: false, isGithubCloudOnly: false }) {
      ...endpointFields
    }
    ghe217: endpoints(version: $version, ghe: GHE_217, filter: { isLegacy: false, isGithubCloudOnly: false }) {
      ...endpointFields
    }
    ghe216: endpoints(version: $version, ghe: GHE_216, filter: { isLegacy: false, isGithubCloudOnly: false }) {
      ...endpointFields
    }
  }
`;

main();

async function main() {
  const results = await graphql(QUERY, {
    url: "https://octokit-routes-graphql-server.now.sh/",
    version: process.env.VERSION
  });

  for (const [key, endpoints] of Object.entries(results)) {
    const filename = key.replace(/ghe2(\d+)/, "ghe-2.$1-endpoints.json");
    writeFileSync(
      path.resolve(__dirname, "generated", filename),
      prettier.format(JSON.stringify(endpoints), {
        parser: "json"
      })
    );
  }
}
