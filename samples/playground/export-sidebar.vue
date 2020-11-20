<template lang="pug">
div
  header.b-sidebar-header.w-100
    button.close.text-dark(type="button")
    h4.p-3.mb-0 Chart export
  div.px-3.py-2
    h6.mb-2 JS framework
    div.mb-4
      div.custom-control.custom-radio.custom-radio-three.d-inline-block
        input#none-framework.custom-control-input(type="radio", v-model="framework", value="none")
        label.custom-control-label(for="none-framework") Vanilla JS

      div.custom-control.custom-radio.custom-radio-three.d-inline-block.ml-3
        input#react-framework.custom-control-input(type="radio", v-model="framework", value="react")
        label.custom-control-label(for="react-framework") React

      div.custom-control.custom-radio.custom-radio-three.d-inline-block.ml-3
        input#vue-framework.custom-control-input(type="radio", v-model="framework", value="vue")
        label.custom-control-label(for="vue-framework") Vue

      div.custom-control.custom-radio.custom-radio-three.d-inline-block.ml-3
        input#angular-framework.custom-control-input(type="radio", v-model="framework", value="angular")
        label.custom-control-label(for="angular-framework") Angular

    div.mb-4(v-if="framework === 'none'")
      h6.mb-2 Get apexcharts library from:
      div.custom-control.custom-radio.custom-radio-three.d-inline-block
        input#npm-source.custom-control-input(type="radio", v-model="source", value="npm")
        label.custom-control-label(for="npm-source") npm package

      div.custom-control.custom-radio.custom-radio-three.d-inline-block.ml-3
        input#cdn-source.custom-control-input(type="radio", v-model="source", value="cdn")
        label.custom-control-label(for="cdn-source") CDN

    div.mb-5(v-for="codeBlock in codeBlocks")
      h6.mb-2 {{ codeBlock.title }}
      code-block(:lang="codeBlock.lang", :code="codeBlock.code", style="max-width: 600px;", v-if="codeBlock.code")
      a.btn.btn-primary.btn-sm(:href="codeBlock.url", target="_blank", rel="noopener", v-else-if="codeBlock.url") {{ codeBlock.action }}
</template>

<script>
import {prettifyObject} from './pattern';

export default {
  name: 'export-sidebar',
  props: ['data'],
  data() {
    return {
      source: '',
      framework: '',
    };
  },
  computed: {
    codeBlocks() {
      const blocks = []; //[{title, lang, code}]

      const npmPackages = [];
      if (this.framework === 'vue') {
        npmPackages.push('apexcharts', 'vue-apexcharts');
      } else if (this.framework === 'react') {
        npmPackages.push('apexcharts', 'react-apexcharts');
      } else if (this.framework === 'angular') {
        npmPackages.push('apexcharts', 'ng-apexcharts');
      } else if (this.framework === 'none') {
        if (this.source === 'npm') {
          npmPackages.push('apexcharts');
        } else if (this.source === 'cdn') {
          blocks.push({
            title: 'Add script to your html',
            lang: 'xml',
            code: '<script src="https://cdn.jsdelivr.net/npm/apexcharts"><'+'/script>',
          });
        }

        if (this.source) {
          blocks.push({
            title: 'Add chart element to html',
            lang: 'xml',
            code: '<div id="chart"></div>',
          });

          let jsCode;
          if (this.source === 'npm') {
            jsCode = "import ApexCharts from 'apexcharts';\n\nconst ";
          } else {
            jsCode = 'var ';
          }
          jsCode += `chart = new ApexCharts(document.querySelector("#chart"), ${prettifyObject(this.data.params.options)});\n` +
            `chart.render();`;
          blocks.push({
            title: 'Generate the chart',
            lang: 'javascript',
            code: jsCode,
          });
        }
      }

      if (npmPackages.length > 0) {
        blocks.push({
          title: `Install npm package${npmPackages.length > 1 ? 's' : ''}`,
          lang: 'shell',
          code: `npm install ${npmPackages.join(' ')}`,
        });
      }

      if (this.framework !== 'none') {
        const options = this.data.params.options;

        // Remove 'series' and 'chart.type' from options before converting to code
        const strippedOptions = Object.assign({}, options);
        delete strippedOptions.series;
        strippedOptions.chart = Object.assign({}, options.chart);
        delete strippedOptions.chart.type;

        if (this.framework === 'react') {
          blocks.push({
            title: 'Render the chart',
            lang: 'javascript',
            code: `import Chart from 'react-apexcharts';

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      options: ${prettifyObject(strippedOptions, 6)},
      series: ${prettifyObject(options.series, 6)},
    };
  }

  render() {
    return (
      <Chart options={this.state.options} series={this.state.series} type="${options.chart.type}" width={500} height={320} />
    );
  }
}`,
          });

          blocks.push({
            title: 'Read the docs for more details',
            url: 'https://github.com/apexcharts/react-apexcharts',
            action: 'Go to react-apexcharts'
          });
        } else if (this.framework === 'vue') {
          blocks.push({
            title: 'Register <apexchart> Vue component',
            lang: 'javascript',
            code: "import VueApexCharts from 'vue-apexcharts;\n" +
              "Vue.use(VueApexCharts);\n" +
              "Vue.component('apexchart', VueApexCharts);",
          });

          blocks.push({
            title: 'Add component to Vue template',
            lang: 'xml',
            code: `<template>
  <apexchart type="${options.chart.type}" :options="chartOptions" :series="series"></apexchart>
</template>,`
          });

          blocks.push({
            title: 'Provide chart options and data',
            lang: 'javascript',
            code: `export default {
  data() {
    return {
      chartOptions: ${prettifyObject(strippedOptions, 6)},
      series: ${prettifyObject(options.series, 6)},
    };
  },
};`,
          });

          blocks.push({
            title: 'Read the docs for more details',
            url: 'https://github.com/apexcharts/vue-apexcharts',
            action: 'Go to vue-apexcharts'
          });
        } else if (this.framework === 'angular') {
          blocks.push({
            title: 'In angular.json under "scripts',
            lang: 'javascript',
            code: `"scripts": [
  "node_modules/apexcharts/dist/apexcharts.min.js"
]`,
          });

          blocks.push({
            title: 'Add ng-apexcharts-module to imports',
            lang: 'javascript',
            code: `import { NgApexchartsModule } from "ng-apexcharts";

imports: [
  BrowserModule,
  FormsModule,
  ReactiveFormsModule,
  NgApexchartsModule,
  ...
]`,
          });

          blocks.push({
            title: 'Add chart to the template',
            lang: 'xml',
            code: `<apx-chart [series]="series" [chart]="chart" [title]="title"></apx-chart>`,
          });

          blocks.push({
            title: 'Read the docs for more details',
            url: 'https://github.com/apexcharts/ng-apexcharts',
            action: 'Go to ng-apexcharts'
          });
        }
      }

      return blocks;
    },
  },
};
</script>