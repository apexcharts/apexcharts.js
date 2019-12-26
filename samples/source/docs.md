# XML format for generating samples for multiple frameworks

Start by copying template.xml. Most sections are optional.

## &lt;title>

Sample title

## &lt;style>

Optional CSS. If not provided the default style `#chart { max-width: 650px; margin: 35px auto; }` is used.

## &lt;scripts>

Optional external scripts or stylesheets.

## &lt;html>

Optional [nunjucks](https://mozilla.github.io/nunjucks/templating.html) template used to generate html template for various framewors. If not provided the default value is `{{ charts[0] }}`, which works for most simple single-chart samples. This template accepts two variables:

- `format` - `'vanilla-js'`, `'react'` or `'vue'`
- `charts` - an object to access format-specific chart embedding html. Charts without ids can be accessed via 0-based index, charts with id - via the corresponding attribute. See column/dynamic-loaded-chart.xml for a complex example.

## &lt;chart>

Sample may consist of several charts. Each of them has its own id, options and series.

### &lt;id>

Optional chart id. By default 0-based index is used. Must be a number or a variable-like name.

### &lt;options>

Chart options passed to apexcharts. The code shouldn't be surrounded by curly braces. `chart.type` option is mandatory. `chart.height` and `chart.width` values are extracted with regexp if provided for code generation.

### &lt;series>

A series array.

## &lt;vanilla-js-script>

Optional vanilla js specific code, that with the access to chart instances (named as `chart`, `chart{index}`, `chart{id}`).

## &lt;react-state>

Optional additional React state properties. See area/area-datetime.xml for example.

## &lt;react-script>

Optional React specific code. Allows to add new component class methods.

## &lt;vue-data>

Optional Vue data properties.

## &lt;vue-script>

Optional Vue specific code. Allows to add component methods and other top-level instance options.

# Notes

* To build samples from source run `npm run build:samples`.

* In order for charts to look the same for e2e testing purposes `Math.random` was overridden with a deterministic random number generator.

* If one of &lt;vanilla-js-script>, &lt;react-script> or &lt;vue-script> sections is present in xml, html files will only be generated for formats with custom code. E.g. if only &lt;react-script> section is provided vanilla-js and vue format won't be generated.
