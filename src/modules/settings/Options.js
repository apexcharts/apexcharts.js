/**
 * ApexCharts Options for setting the initial configuration of ApexCharts
 **/
import { optionYAxis, optionXAxis } from './options/axis'
import {
  optionXAxisAnnotation,
  optionYAxisAnnotation,
  optionPointAnnotation
} from './options/annotations'
import { optionChart } from './options/chart'
import { optionPlotOptions } from './options/plotOptions'
import { optionTooltip } from './options/tooltip'
import { optionLegend } from './options/legend'
import { optionGrid } from './options/grid'
import { optionTitle, optionSubtitle } from './options/titlesubtitle'

export default class Options {
  init() {
    return {
      annotations: {
        position: 'front',
        yaxis: [optionYAxisAnnotation],
        xaxis: [optionXAxisAnnotation],
        points: [optionPointAnnotation]
      },
      chart: optionChart,
      plotOptions: optionPlotOptions,
      colors: undefined,
      dataLabels: {
        enabled: true,
        enabledOnSeries: undefined,
        formatter(val) {
          return val !== null ? val : ''
        },
        textAnchor: 'middle',
        offsetX: 0,
        offsetY: 0,
        style: {
          fontSize: '12px',
          fontFamily: undefined,
          colors: undefined
        },
        dropShadow: {
          enabled: false,
          top: 1,
          left: 1,
          blur: 1,
          color: '#000',
          opacity: 0.45
        }
      },
      fill: {
        type: 'solid',
        colors: undefined, // array of colors
        opacity: 0.85,
        gradient: {
          shade: 'dark',
          type: 'horizontal',
          shadeIntensity: 0.5,
          gradientToColors: undefined,
          inverseColors: true,
          opacityFrom: 1,
          opacityTo: 1,
          stops: [0, 50, 100],
          colorStops: []
        },
        image: {
          src: [],
          width: undefined, // optional
          height: undefined // optional
        },
        pattern: {
          style: 'sqaures', // String | Array of Strings
          width: 6,
          height: 6,
          strokeWidth: 2
        }
      },
      grid: optionGrid,
      labels: [],
      legend: optionLegend,
      markers: {
        discrete: [],
        size: 0,
        colors: undefined,
        //strokeColor: '#fff', // TODO: deprecate in major version 4.0
        strokeColors: '#fff',
        strokeWidth: 2,
        strokeOpacity: 0.9,
        fillOpacity: 1,
        shape: 'circle',
        radius: 2,
        offsetX: 0,
        offsetY: 0,
        onClick: undefined,
        onDblClick: undefined,
        hover: {
          size: undefined,
          sizeOffset: 3
        }
      },
      noData: {
        text: undefined,
        align: 'center',
        verticalAlign: 'middle',
        offsetX: 0,
        offsetY: 0,
        style: {
          color: undefined,
          fontSize: '14px',
          fontFamily: undefined
        }
      },
      responsive: [], // breakpoints should follow ascending order 400, then 700, then 1000
      series: undefined,
      states: {
        normal: {
          filter: {
            type: 'none',
            value: 0
          }
        },
        hover: {
          filter: {
            type: 'lighten',
            value: 0.15
          }
        },
        active: {
          allowMultipleDataPointsSelection: false,
          filter: {
            type: 'darken',
            value: 0.65
          }
        }
      },
      title: optionTitle,
      subtitle: optionSubtitle,
      stroke: {
        show: true,
        curve: 'smooth', // "smooth" / "straight" / "stepline"
        lineCap: 'butt', // round, butt , square
        width: 2,
        colors: undefined, // array of colors
        dashArray: 0 // single value or array of values
      },
      tooltip: optionTooltip,
      xaxis: optionXAxis,
      yaxis: optionYAxis,
      theme: {
        mode: 'light',
        palette: 'palette1', // If defined, it will overwrite globals.colors variable
        monochrome: {
          // monochrome allows you to select just 1 color and fill out the rest with light/dark shade (intensity can be selected)
          enabled: false,
          color: '#008FFB',
          shadeTo: 'light',
          shadeIntensity: 0.65
        }
      }
    }
  }
}
