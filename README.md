<p align="center"><img src="https://apexcharts.com/media/apexcharts-logo.png"></p>

<p align="center">
  <a href="https://github.com/apexcharts/apexcharts.js/blob/master/LICENSE"><img src="https://img.shields.io/badge/License-MIT-brightgreen.svg" alt="License"></a>
  <a href="https://qalint.com/open-source" ><img src="https://img.shields.io/badge/QA%20Lint-Open%20Source-brightgreen.svg?longCache=true&style=popout-square" alt="QA Lint" /></a>
  <a href="https://travis-ci.com/apexcharts/apexcharts.js"><img src="https://api.travis-ci.com/apexcharts/apexcharts.js.svg?branch=master" alt="build" /></a>
  <img alt="downloads" src="https://img.shields.io/npm/dm/apexcharts.svg">
  <a href="https://www.npmjs.com/package/apexcharts"><img src="https://img.shields.io/npm/v/apexcharts.svg" alt="ver"></a>
  <img alt="gzip" src="https://img.shields.io/bundlephobia/minzip/apexcharts.svg?label=gzip">
  <a href="https://github.com/prettier/prettier"><img src="https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square" alt="prettier"></a>
  <a href="https://patreon.com/junedchhipa"><img src="https://img.shields.io/badge/patrons-5-blue.svg?style=flat&logo=patreon" alt="patrons" /></a>
</p>



<p align="center">
  <a href="https://twitter.com/intent/tweet?text=Create%20visualizations%20with%20this%20free%20and%20open-source%20JavaScript%20Chart%20library&url=https://www.apexcharts.com&hashtags=javascript,charts,visualizations,developers,apexcharts"><img src="https://img.shields.io/twitter/url/http/shields.io.svg?style=social"> </a>
</p>

<p align="center">A modern JavaScript charting library to build interactive charts and visualizations with simple API.</p>


<p align="center"><a href="https://apexcharts.com/javascript-chart-demos/"><img src="https://apexcharts.com/media/apexcharts-banner.png"></a></p>

## Browsers support

| [<img src="https://raw.githubusercontent.com/alrra/browser-logos/master/src/firefox/firefox_48x48.png" alt="Firefox" width="24px" height="24px" />](http://godban.github.io/browsers-support-badges/)<br/>Firefox | [<img src="https://raw.githubusercontent.com/alrra/browser-logos/master/src/chrome/chrome_48x48.png" alt="Chrome" width="24px" height="24px" />](http://godban.github.io/browsers-support-badges/)<br/>Chrome | [<img src="https://raw.githubusercontent.com/alrra/browser-logos/master/src/safari/safari_48x48.png" alt="Safari" width="24px" height="24px" />](http://godban.github.io/browsers-support-badges/)<br/>Safari | [<img src="https://raw.githubusercontent.com/alrra/browser-logos/master/src/edge/edge_48x48.png" alt="Edge" width="24px" height="24px" />](http://godban.github.io/browsers-support-badges/)<br/> Edge | [<img src="https://upload.wikimedia.org/wikipedia/commons/1/1b/Internet_Explorer_9_icon.svg" alt="IE" width="24px" height="24px" />](http://godban.github.io/browsers-support-badges/)<br/> IE11 |
| --------- | --------- | --------- | --------- | --------- | 
| 31+ ✔ | 35+ ✔ | 6+ ✔ | Edge ✔ | IE11 ✔ |

## Download and Installation

##### Installing via npm
```bash
npm install apexcharts --save
```

##### Direct &lt;script&gt; include
```html
<script src="https://cdn.jsdelivr.net/npm/apexcharts"></script>
```

## Wrappers for Vue/React/Angular
Integrate easily with 3rd party frameworks
- [vue-apexcharts](https://github.com/apexcharts/vue-apexcharts)
- [react-apexcharts](https://github.com/apexcharts/react-apexcharts)
- Angular - (No plugin is created for Angular, but typings are provided in /types/apexcharts.d.ts)

## Usage
```js
import ApexCharts from 'apexcharts'
```

To create a basic bar chart with minimal configuration, write as follows:
```js
var options = {
  chart: {
    type: 'bar'
  },
  series: [{
    name: 'sales',
    data: [30, 40, 35, 50, 49, 60, 70, 91, 125]
  }],
  xaxis: {
    categories: [1991, 1992, 1993, 1994, 1995, 1996, 1997, 1998, 1999]
  }
}

var chart = new ApexCharts(document.querySelector("#chart"), options);
chart.render();
```
This will render the following chart
<p align="center"><a href="https://apexcharts.com/javascript-chart-demos/column-charts/"><img src="https://apexcharts.com/media/first-bar-chart.svg"></a></p>

### A little more than the basic

You can create a combination of different charts, sync them and give your desired look with unlimited possibilities.
Below is an example of synchronized charts with github style.
<p align="center"><a href="https://apexcharts.com/javascript-chart-demos/area-charts/github-style/"><img src="https://apexcharts.com/media/github-charts.gif"></a></p>


## Interactivity
Zoom, Pan, Scroll through data. Make selections and load other charts using those selections.
An example showing some interactivity
<p align="center"><a href="https://codepen.io/apexcharts/pen/QrbEQg" target="_blank"><img src="https://apexcharts.com/media/interactivity.gif" alt="interactive chart"></a></p>

## Dynamic Series Update
Another approach to Drill down charts where one selection updates the data of other charts.
An example of loading dynamic series into charts is shown below
<p align="center"><a href="https://apexcharts.com/javascript-chart-demos/column-charts/dynamic-loaded-chart/"><img src="https://apexcharts.com/media/dynamic-selection.gif" alt="dynamic-loading-chart" /></a></p>


## Annotations
Annotations allows you to write custom text on specific values or on axes values. Valuable to expand the visual appeal of your chart and make it more informative.
<p align="center"><a href="https://apexcharts.com/docs/annotations/"><img src="https://apexcharts.com/media/annotations" alt="annotations" /></a></p>

## Mixed Charts
You can combine more than one chart type to create a combo/mixed chart. Possible combinations can be line/area/column together in a single chart. Each chart-type can have it's own y-axis.
<p align="center"><a href="https://apexcharts.com/javascript-chart-demos/mixed-charts/"><img src="https://apexcharts.com/wp-content/uploads/2018/05/line-column-area-mixed-chart.svg" alt="annotations" width="490" /></a></p>

## Candlestick
Use a candlestick chart (a common financial chart) to describe price changes of a security, derivative, or currency. Below image show how you can use another chart as a brush/preview-pane which acts as a handle to browse the main candlestick chart.
<p align="center"><a href="https://apexcharts.com/javascript-chart-demos/candlestick-charts/"><img src="https://apexcharts.com/media/candlestick.png" alt="candlestick" width="490" /></a></p>

## Heatmaps
Use Heatmaps to represent data through colors and shades. Frequently used with bigger data collections, they are valuable for recognizing patterns and area of focus. 
<p align="center"><a href="https://apexcharts.com/javascript-chart-demos/heatmap-charts/"><img src="https://apexcharts.com/media/heatmap-charts.png" alt="heatmap" /></a></p>

## Gauges
The tiny gauges are an important part of a dashboard and are useful in displaying single series data. A demo of these gauges:
<p align="center"><a href="https://apexcharts.com/javascript-chart-demos/radialbar-charts/"><img src="https://apexcharts.com/media/radialbars-gauges.png" width="490" alt="radialbar-chart" /></a></p>

## Sparklines
Utilize sparklines to indicate trends in data, for example, occasional increments or declines, monetary cycles, or to feature most extreme and least values:
<p align="center"><a href="https://apexcharts.com/javascript-chart-demos/sparklines/"><img src="https://apexcharts.com/media/sparklines.png" alt="sparkline-chart" /></a></p>


## What's included

The download bundle includes the following files and directories providing a minified single file in the dist folder. Every asset including icon/css is bundled in the js itself to avoid loading multiple files.

```
apexcharts/
├── dist/
│   └── apexcharts.min.js
├── src/
│   ├── assets/
│   ├── charts/
│   ├── modules/
│   ├── utils/
│   └── apexcharts.js
└── samples/
```

## Development
#### Install dependencies and run project

```bash
npm install
npm run dev
```
This will start the webpack watch and any changes you make to `src` folder will auto-compile and output will be produced in the `dist` folder.

#### Minifying the src
```bash
npm run build
```


## Where do I go next?

Head over to the <a href="https://apexcharts.com/docs/">documentation</a> section to read more about how to use different kinds of charts and explore all options.

## Contacts
Email: <a href="info@apexcharts.com">info@apexcharts.com</a>

Twitter: <a href="https://twitter.com/apexcharts">@apexcharts</a>

Facebook: <a href="https://facebook.com/apexcharts">fb.com/apexcharts</a>

## Dependency
ApexCharts uses <a href="http://svgjs.com/" target="_blank">SVG.js</a> for drawing shapes, animations, applying svg filters and a lot more under the hood. The library is bundled in the final build file, so you don't need to include it.


## Supporting ApexCharts
ApexCharts is an open source project. <br /> You can help by becoming a sponsor on <a href="https://patreon.com/junedchhipa">Patreon</a> or doing a one time donation on <a href="https://paypal.me/junedchhipa">PayPal</a> <br />

<a href="https://patreon.com/junedchhipa"><img src="https://c5.patreon.com/external/logo/become_a_patron_button.png" alt="Become a Patron" /> </a>

## Our Supporters

Financial contributions to ApexCharts go towards ongoing development costs, servers, etc. You can join them in supporting ApexCharts development by visiting our page on [Patreon](patreon.com/junedchhipa)!


### Sponsors
Become a sponsor and get your logo on our website's home-page with a link to your site. [[Become a sponsor](https://www.patreon.com/join/junedchhipa)]

<a href="https://www.santego.fr/?ref=apexcharts.com" target="_blank" style="text-align: center; display: inline-block;"><img src="https://apexcharts.com/media/sponsors/santego.png" width="100" height="100" /></a>


## License
ApexCharts is released under MIT license. You are free to use, modify and distribute this software, as long as the copyright header is left intact.
