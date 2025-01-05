const { writeFileSync } = require("fs");
const { resolve: pathResolve } = require("path");

const prettier = require("prettier");
const sortKeys = require("sort-keys");

const WORKAROUNDS = require("./workarounds");

const GHE_VERSIONS = ["2.16", "2.17", "2.18", "2.19"];
const newRoutes = {};

generateRoutes();

async function generateRoutes() {
  for (const version of GHE_VERSIONS) {
    const endpoints = require(`./generated/ghe-${version}-endpoints.json`);
    endpoints.concat(WORKAROUNDS).forEach(endpoint => {
      const scope = endpoint.scope;

      if (!newRoutes[scope]) {
        newRoutes[scope] = {};
      }

      const idName = endpoint.id;
      const url = endpoint.url.toLowerCase().replace(/\{(\w+)\}/g, ":$1");

      // new route
      newRoutes[scope][idName] = {
        method: endpoint.method,
        headers: endpoint.headers.reduce((result, header) => {
          if (!result) {
            result = {};
          }
          result[header.name] = header.value;
          return result;
        }, undefined),
        params: endpoint.parameters.reduce((result, param) => {
          result[param.name] = {
            type: param.type
          };
          if (param.allowNull) {
            result[param.name].allowNull = true;
          }
          if (param.required) {
            result[param.name].required = true;
          }
          if (param.mapToData) {
            result[param.name].mapTo = "data";
          }
          if (param.enum) {
            result[param.name].enum = param.enum;
          }
          if (param.validation) {
            result[param.name].validation = param.validation;
          }
          if (param.deprecated) {
            result[param.name].deprecated = true;

            if (param.alias) {
              result[param.name].alias = param.alias;
              result[param.name].type = result[param.alias].type;
            } else {
              result[param.name].type = param.type;
              result[param.name].description = param.description;
            }
          }

          return result;
        }, {}),
        url
      };

      const previewHeaders = endpoint.previews
        .map(preview => `application/vnd.github.${preview.name}-preview+json`)
        .join(",");

      if (previewHeaders) {
        newRoutes[scope][idName].headers = {
          accept: previewHeaders
        };
      }

      if (endpoint.renamed) {
        newRoutes[scope][
          idName
        ].deprecated = `octokit.${endpoint.renamed.before.scope}.${endpoint.renamed.before.id}() has been renamed to octokit.${endpoint.renamed.after.scope}.${endpoint.renamed.after.id}() (${endpoint.renamed.date})`;
      }

      if (endpoint.isDeprecated) {
        newRoutes[scope][
          idName
        ].deprecated = `octokit.${scope}.${idName}() is deprecated, see ${endpoint.documentationUrl}`;
      }
    });

    const newRoutesSorted = sortKeys(newRoutes, { deep: true });

    const allResultsPath = pathResolve(
      process.cwd(),
      `ghe-${version}/all.json`
    );
    writeFileSync(
      allResultsPath,
      prettier.format(JSON.stringify(newRoutesSorted), {
        parser: "json"
      })
    );
    console.log(`${allResultsPath} written.`);

    const enterpriseAdminResultsPath = pathResolve(
      process.cwd(),
      `ghe-${version}/enterprise-admin.json`
    );
    writeFileSync(
      enterpriseAdminResultsPath,
      prettier.format(JSON.stringify(newRoutesSorted.enterpriseAdmin), {
        parser: "json"
      })
    );
    console.log(`${enterpriseAdminResultsPath} written.`);

    const indexPath = pathResolve(process.cwd(), `ghe-${version}/index.js`);
    writeFileSync(
      indexPath,
      `module.exports = octokit =>
  octokit.registerEndpoints({
    enterpriseAdmin: require("./enterprise-admin.json")
  });
`
    );
    console.log(`${indexPath} written.`);

    const allPath = pathResolve(process.cwd(), `ghe-${version}/all.js`);
    writeFileSync(
      allPath,
      'module.exports = octokit => octokit.registerEndpoints(require("./all.json"));\n'
    );
    console.log(`${allPath} written.`);

    const readmePath = pathResolve(process.cwd(), `ghe-${version}/README.md`);
    const content = `# @octokit/plugin-enterprise-rest/ghe-${version}

## Enterprise Administration

\`\`\`js
${Object.keys(newRoutesSorted.enterpriseAdmin)
  .map(methodName =>
    endpointToMethod(
      "enterpriseAdmin",
      methodName,
      newRoutesSorted.enterpriseAdmin[methodName]
    )
  )
  .join("\n")}
\`\`\`

## Others

\`\`\`js
${Object.keys(newRoutesSorted)
  .filter(scope => scope !== "enterpriseAdmin")
  .map(scope =>
    Object.keys(newRoutesSorted[scope])
      .map(methodName =>
        endpointToMethod(scope, methodName, newRoutesSorted[scope][methodName])
      )
      .join("\n")
  )
  .join("\n")}
\`\`\`
`;
    writeFileSync(readmePath, prettier.format(content, { parser: "markdown" }));
    console.log(`${readmePath} written.`);
  }
}

function endpointToMethod(scope, methodName, meta) {
  return `octokit.${scope}.${methodName}(${Object.keys(meta.params)
    .filter(param => !/\./.test(param) && !meta.params[param].deprecated)
    .join(", ")});`;
}
