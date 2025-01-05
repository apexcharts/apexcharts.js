# @npmcli/query

Parser and tools for `npm query`.

## parser(str)

The `parser` method receives a query `string` and parses that string using
[`postcss-selector-parser`](https://www.npmjs.com/package/postcss-selector-parser),
it then modifies the returned ast to include information that is then essential
to translate that structure into navigating
[Arborist](https://github.com/npm/cli/tree/latest/workspaces/arborist).

## LICENSE

[ISC](./LICENSE)

