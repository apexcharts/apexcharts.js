<p align="center"><img src="https://apexcharts.com/media/apexcharts-logo.png"></p>

<p align="center">
  <a href="https://github.com/apexcharts/apexcharts.js/blob/master/LICENSE"><img src="https://img.shields.io/badge/License-MIT-brightgreen.svg" alt="License"></a>
  <a href="https://github.com/apexcharts/apexcharts.js/blob/master/LICENSE"><img src="https://img.shields.io/badge/price-FREE-0098f7.svg" alt="FREE"></a>
  <a href="https://qalint.com/open-source" ><img src="https://img.shields.io/badge/QA%20Lint-Open%20Source-brightgreen.svg?longCache=true&style=popout-square" alt="QA Lint" /></a>
  <a href="https://www.npmjs.com/package/apexcharts"><img src="https://img.shields.io/npm/v/apexcharts.svg" alt="ver"></a>
</p>

<p align="center">
  <a href="https://twitter.com/intent/tweet?text=Create%20visualizations%20with%20this%20free%20and%20open-source%20JavaScript%20Chart%20library&url=https://www.apexcharts.com&hashtags=javascript,charts,visualizations,developers,apexcharts"><img src="https://img.shields.io/twitter/url/http/shields.io.svg?style=social"> </a>
</p>

<p align="center">A modern JavaScript charting library to build interactive charts and visualizations with simple API.</p>

<p align="center"><a href="https://apexcharts.com/javascript-chart-demos/"><img src="https://apexcharts.com/media/apexcharts-banner.png"></a></p>

## Why another Chart Library?
It's a long read, so I have written a detailed explanation on this <a href="https://medium.com/@juned.chhipa/bridging-the-gap-between-low-level-and-high-level-charting-libraries-a8f6c1819ba5" target="_blank">medium post</a>


## Download and Installation

##### Installing via npm
[![NPM](https://nodei.co/npm/apexcharts.png?mini=true)](https://npmjs.org/package/apexcharts)

##### Direct &lt;script&gt; include
```html
<script src="https://unpkg.com/apexcharts/dist/apexcharts.min.js"></script>
```

## Usage

### Creating your first chart
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
<p align="left"><a href="https://apexcharts.com/javascript-chart-demos/column-charts/"><img src="https://apexcharts.com/media/first-bar-chart.svg"></a></p>

### A little more than the basic

You can create a combination of different charts, sync them and give your desired look with unlimited possibilites.
Below is an example of synchronized charts with github style.
<p align="left"><a href="https://apexcharts.com/javascript-chart-demos/area-charts/github-style/"><img src="https://apexcharts.com/media/github-charts.gif"></a></p>


## Some interactivity
Zoom, Pan, Scroll through data. Make selections and load other charts using those selections.
An example showing some interactivity
<p align="left"><a href="https://codepen.io/apexcharts/pen/QrbEQg" target="_blank"><img src="https://apexcharts.com/media/interactivity.gif" alt="interactive chart"></a></p>

## Dynamic Data Updation
Another approach to Drill down charts where one selection updates the data of other charts.
An example of loading dynamic series into charts is shown below
<p align="left"><a href="https://apexcharts.com/javascript-chart-demos/column-charts/dynamic-loaded-chart/"><img src="https://apexcharts.com/media/dynamic-selection.gif" alt="dynamic-loading-chart" /></a></p>


## Annotations
Annotations allows you to write custom text on specific values or on axes values. Valuable to expand the visual appeal of your chart and make it more informative.
<p align="left"><a href="https://apexcharts.com/docs/annotations/"><img src="https://apexcharts.com/media/annotations" alt="annotations" /></a></p>

## Mixed Charts
You can combine more than one chart type to create a combo/mixed chart. Possible combinations can be line/area/column together in a single chart. Each chart-type can have it's own y-axis.
<p align="left"><a href="https://apexcharts.com/javascript-chart-demos/mixed-charts/"><img src="https://apexcharts.com/wp-content/uploads/2018/05/line-column-area-mixed-chart.svg" alt="annotations" width="490" /></a></p>

## Heatmaps
Use Heatmaps to represent data through colors and shades. Frequently used with bigger data collections, they are valuable for recognizing patterns and area of focus. 
<p align="left"><a href="https://apexcharts.com/javascript-chart-demos/heatmap-charts/"><img src="https://apexcharts.com/media/heatmap-charts.png" alt="heatmap" /></a></p>

## Gauges
The tiny gauges are an important part of a dashboard and are useful in displaying single series data. A demo of these gauges:
<p align="left"><a href="https://apexcharts.com/javascript-chart-demos/radialbar-charts/"><img src="https://apexcharts.com/media/radialbars-gauges.png" alt="radialbar-chart" /></a></p>

## Sparklines
Utilize sparklines to indicate trends in data, for example, occasional increments or declines, monetary cycles, or to feature most extreme and least values:
<p align="left"><a href="https://apexcharts.com/javascript-chart-demos/sparklines/"><img src="https://apexcharts.com/media/sparklines.png" alt="sparkline-chart" /></a></p>


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
npm run start
```
This will start the webpack watch and any changes you make to `src` folder will autocompile and output will be produced in `dist` folder.

#### Minifying the src
```bash
npm run build
```

## Where do I go next?

Head over to the <a href="https://apexcharts.com/docs/">documentation</a> section to read more about how to use different kinds of charts and explore all options.

## Credits.
ApexCharts uses <a href="http://svgjs.com/" target="_blank">SVG.js</a> for drawing shapes, animations, applying svg filters and a lot more under the hood.

## License
ApexCharts is released under MIT license. You are free to use, modify and distribute this software, as long as the copyright header is left intact.
