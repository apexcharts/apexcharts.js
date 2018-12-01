// Typescript declarations for Apex class and module. 
// Note: When you have a class and a module with the same name; the module is merged 
// with the class.  This is necessary since apexcharts exports the main ApexCharts class only.
//
// This is a sparse typed declarations of chart interfaces.  See Apex Chart documentation
// for comprehensive API:  https://apexcharts.com/docs/options
//
// There is on-going work to provide a comprehensive typed definition for this component.
// See https://github.com/DefinitelyTyped/DefinitelyTyped/pull/28733

declare class ApexCharts {
  constructor(el: any, options: any);
  render(): Promise<void>;
  updateOptions(options: any, redrawPaths: boolean, animate: boolean): Promise<void>;
  updateSeries(newSeries: ApexAxisChartSeries | ApexNonAxisChartSeries, animate: boolean): void;
  toggleSeries(seriesName: string): void;
  destroy(): void;
  addXaxisAnnotation(options: any, pushToMemory?: boolean, context?: any): void;
  addYaxisAnnotation(options: any, pushToMemory?: boolean, context?: any): void;
  addPointAnnotation(options: any, pushToMemory?: boolean, context?: any): void;
  addText(options: any, pushToMemory?: boolean, context?: any): void;
  static exec(chartID: string, fn: () => void, options: any): any;
  static initOnLoad(): void;
}

declare module ApexCharts {
  export interface ApexOptions {
    annotations?: ApexAnnotations;
    chart?: ApexChart;
    colors?: string[];
    dataLabels?: ApexDataLabels;
    series?: ApexAxisChartSeries | ApexNonAxisChartSeries;
    stroke?: ApexStroke;
    labels?: string[];
    legend?: ApexLegend;
    tooltip?: ApexTooltip;
    plotOptions?: ApexPlotOptions;
    xaxis?: ApexXAxis;
    yaxis?: ApexYAxis | ApexYAxis[];
    grid?: ApexGrid;
    title?: ApexTitle;
  }
}

/**
* Main Chart options
* See https://apexcharts.com/docs/options/chart/
*/
type ApexChart = {
  width?: string | number;
  height?: string | number;
  type: "line" | "area" | "bar" | "histogram" | "pie" | "donut" |
  "radialBar" | "scatter" | "bubble" | "heatmap";
  foreColor?: string;
  fontFamily: string;
  background?: string;
  dropShadow?: {
    enabled?: boolean;
    top?: number;
    left?: number;
    blur?: number;
    opacity?: number;
  };
  brush?: {
    enabled?: boolean;
    target?: string;
  };
  locales?: ApexLocale[];
  defaultLocale?: string;
  sparkline?: {
    enabled?: boolean;
  };
  stacked?: boolean;
  stackType?: "normal" | "100%";
  toolbar?: {
    show?: boolean;
    tools?: {
      download?: boolean;
      selection?: boolean;
      zoom?: boolean;
      zoomin?: boolean;
      zoomout?: boolean;
      pan?: boolean;
      reset?: boolean;
    };
    autoSelected?: "zoom" | "selection" | "pan";
  };
  zoom?: {
    enabled?: boolean;
    type?: "x" | "y" | "xy";
    zoomedArea?: {
      fill?: {
        color?: string;
        opacity?: number
      };
      stroke?: {
        color?: string;
        opacity?: number;
        width?: number
      }
    }
  };
  animations?: {
    enabled?: boolean;
    easing?: "linear" | "easein" | "easeout" | "easeinout";
    speed?: number;
    animateGradually?: {
      enabled?: boolean;
      delay?: number;
    }
    dynamicAnimation?: {
      enabled?: boolean;
      speed?: number;
    }
  };
};

/**
* Chart Title options
* See https://apexcharts.com/docs/options/title/
*/
type ApexTitle = {
  text: string;
  align?: "left" | "center" | "right";
  margin?: number;
  offsetX?: number;
  offsetY?: number;
  floating?: number;
  style?: {
    fontSize?: string;
    color?: string;
  };
};

/**
* Chart Series options.  
* Use ApexNonAxisChartSeries for Pie and Donut charts.
* See https://apexcharts.com/docs/options/series/
*/
type ApexAxisChartSeries = {
  name: string;
  data: number[] | { x: string; y: number }[];
}[];

type ApexNonAxisChartSeries = number[];

/**
* Options for the line drawn on line and area charts.
* See https://apexcharts.com/docs/options/stroke/
*/
type ApexStroke = {
  show?: boolean;
  curve?: "smooth" | "straight" | "stepline";
  lineCap?: "butt" | "square" | "round";
  colors?: string;
  width?: number;
  dashArray?: number | number[]
};

type ApexAnnotations = {
  position: string;
  yaxis: YAxisAnnotations[];
  xaxis: XAxisAnnotations[];
  points: PointAnnotations[];
};


type AnnotationLabel = {
  borderColor: string;
  borderWidth: number;
  text: string;
  textAnchor: string;
  offsetX: number;
  offsetY: number;
  style: AnnotationStyle;
  position?: string;
};

type AnnotationStyle = {
  background: string;
  color: string;
  fontSize: string;
  cssClass: string;
  padding?: {
    left?: number;
    right?: number;
    top?: number;
    bottom?: number;
  };
};

type XAxisAnnotations = {
  x: number;
  strokeDashArray: number;
  borderColor: string;
  offsetX: number;
  offsetY: number;
  label: {
    borderColor: string;
    borderWidth: number;
    text: string;
    textAnchor: string;
    position: string;
    orientation: string;
    offsetX: number;
    offsetY: number;
    style: AnnotationStyle;
  };
};

type YAxisAnnotations = {
  y: number;
  strokeDashArray: number;
  borderColor: string;
  offsetX: number;
  offsetY: number;
  yAxisIndex: number;
  label: Label;
};


type PointAnnotations = {
  x: number;
  y: null;
  yAxisIndex: number;
  seriesIndex: number;
  marker: {
    size: number;
    fillColor: string;
    strokeColor: string;
    strokeWidth: number;
    shape: string;
    radius: number;
  };
  label: Label;
};

/**
* Options for localization.
* See https://apexcharts.com/docs/options/chart/locales
*/
type ApexLocale = {
  name?: string;
  options?: {
    months?: string[];
    shortMonths?: string[];
    days?: string[];
    shortDays?: string[];
    toolbar?: {
      download?: string;
      selection?: string;
      selectionZoom?: string;
      zoomIn?: string;
      zoomOut?: string;
      pan?: string;
      reset?: string;
    }
  }
}

/**
* PlotOptions for specifying chart-type-specific configuration.
* See https://apexcharts.com/docs/options/plotoptions/bar/
*/
type ApexPlotOptions = {
  bar?: {
    horizontal?: boolean;
    endingShape?: "flat" | "rounded" | "arrow";
    columnWidth?: string;
    barHeight?: string;
    distributed?: boolean;
    colors?: {
      ranges?: [number, number, string];
      backgroundBarColors?: string[];
      backgroundBarOpacity?: number;
    };
    dataLabels?: {
      position?: string;
    }
  };
  candlestick?: {
    colors?: {
      upward?: string;
      downward?: string;
    };
    wick?: {
      useFillColor?: boolean
    }
  };
  heatmap?: {
    radius?: number;
    enableShades?: boolean;
    shadeIntensity?: number;
    colorScale?: {
      ranges?: [number, number, string];
      inverse?: boolean;
    }
  };
  pie?: {
    size?: number;
    donut?: {
      size?: string;
      background?: string;
      labels: {
        show?: boolean;
        name?: {
          show?: boolean;
          fontSize?: string;
          fontFamily?: string;
          color?: string,
          offsetY?: number
        },
        value?: {
          show?: boolean;
          fontSize?: string;
          fontFamily?: string;
          color?: string,
          offsetY?: number,
          formatter?(val: string): string;
        },
        total?: {
          show?: boolean;
          label?: string;
          color?: string;
          formatter?(w: object): string;
        }
      }
    };
    customScale?: number;
    offsetX?: number;
    offsetY?: number;
    dataLabels?: {
      offset?: number;
    }
  };
  radialBar?: {
    size?: number;
    inverseOrder?: boolean;
    startAngle?: number;
    endAngle?: number;
    offsetX?: number;
    offsetY?: number;
    hollow?: {
      margin?: number;
      size?: string;
      background?: string;
      image?: string;
      width?: number;
      height?: number;
      offsetX?: number;
      offsetY?: number;
      clipped?: boolean;
      position?: "front" | "back";
    };
    track?: {
      show?: boolean;
      startAngle?: number;
      endAngle?: number;
      background?: string;
      strokeWidth?: string;
      opacity?: number;
      margin?: number;
      dropShadow?: {
        enabled?: boolean;
        top?: number;
        left?: number;
        blur?: number;
        opacity?: number
      }
    };
    dataLabels?: {
      show?: boolean;
      name?: {
        show?: boolean;
        fontSize?: string;
        color?: string;
        offsetY?: number;
      };
      value?: {
        show?: boolean;
        fontSize?: string;
        color?: string;
        offsetY?: number;
        formatter?(val: number): string;
      };
      total?: {
        show?: boolean;
        label?: string;
        color?: string;
        formatter?(opts: object): string;
      };
    }
  }
};

/**
* Chart Legend configuration options.
* See https://apexcharts.com/docs/options/legend/
*/
type ApexLegend = {
  show?: boolean;
  position?: "top" | "right" | "bottom" | "left";
  horizontalAlign?: "left" | "center" | "right";
  verticalAlign?: "top" | "middle" | "bottom";
  floating?: boolean;
  fontSize?: string;
  offsetX?: number;
  offsetY?: number;
  formatter?(val: string): string;
  textAnchor?: string;
  labels?: {
    color?: string
    useSeriesColors?: boolean;
  };
  markers?: {
    size?: number;
    strokeColor?: string
    strokeWidth?: number;
    offsetX?: number;
    offsetY?: number;
    radius?: number;
    shape?: "circle" | "square";
  };
  itemMargin?: {
    horizontal?: number;
    vertical?: number;
  };
  containerMargin?: {
    left?: number;
    top?: number;
  };
  onItemClick?: {
    toggleDataSeries?: boolean;
  };
  onItemHover?: {
    highlightDataSeries?: boolean;
  }
};

/**
* Chart Datalabels options
* See https://apexcharts.com/docs/options/datalabels/
*/
type ApexDataLabels = {
  enabled?: boolean;
  formatter?(val: number): string;
  textAnchor?: "start" | "middle" | "end";
  offsetX?: number;
  offsetY?: number;
  style?: {
    fontSize?: string;
    colors?: string[];
  };
  dropShadow?: {
    enabled: boolean;
    top?: number;
    left?: number;
    blur?: number;
    opacity?: number;
  }
};

/**
* Chart Tooltip options
* See https://apexcharts.com/docs/options/tooltip/
*/
type ApexTooltip = {
  enabled?: boolean;
  shared: true;
  followCursor?: boolean;
  intersect?: boolean;
  inverseOrder?: boolean;
  custom?(options: any): void;
  theme?: string;
  fillSeriesColor?: boolean;
  onDatasetHover?: {
    highlightDAtaSeries?: boolean;
  };
  x?: {
    show?: boolean;
    format?: string;
    formatter?(val: number): string;
  }
  y?: {
    show?: boolean;
    formatter?(val: number): string;
    title?: {
      formatter?(seriesName: string): string;
    }
  };
  z?: {
    formatter?(val: number): string;
    title?: string
  };
  marker?: {
    show?: boolean
  };
  items: {
    display: string
  };
  fixed: {
    enabled: boolean;
    position: string; // topRight; topLeft; bottomRight; bottomLeft
    offsetX: number;
    offsetY: number
  }
};

/**
* X Axis options
* See https://apexcharts.com/docs/options/xaxis/
*/
type ApexXAxis = {
  type?: "categories" | "datetime" | "numeric";
  categories?: string[] | number[];
  labels?: {
    show?: boolean;
    rotate?: number;
    rotateAlways?: boolean;
    hideOverlappingLabels?: boolean;
    showDuplicates?: boolean;
    trim?: boolean;
    minHeight?: number;
    maxHeight?: number;
    style?: {
      colors?: [];
      fontSize?: string;
      fontFamily?: string;
      cssClass?: string;
    };
    offsetX?: number;
    offsetY?: number;
    format?: string;
    formatter?(value: string, timestamp: number): string;
    datetimeFormatter?: {
      year?: string;
      month?: string;
      day?: string;
      hour?: string;
      minute?: string;
    };
  };
  axisBorder?: {
    show: boolean;
    color: string;
    offsetX: number;
    offsetY: number;
    strokeWidth: number;
  };
  axisTicks?: {
    show?: boolean;
    borderType?: string;
    color?: string;
    height?: number;
    offsetX?: number;
    offsetY?: number;
  };
  tickAmount?: number;
  min?: number;
  max?: number;
  range?: number;
  floating?: boolean;
  position?: string;
  title?: {
    text?: string;
    offsetX?: number;
    offsetY?: number;
    style?: {
      color?: string;
      fontSize?: string;
      cssClass?: string;
    };
  };
  crosshairs?: {
    show?: boolean;
    width?: number | string;
    position?: string;
    opacity?: number;
    stroke?: {
      color?: string;
      width?: number;
      dashArray?: number;
    };
    fill?: {
      type?: string;
      color?: string;
      gradient?: {
        colorFrom?: string;
        colorTo?: string;
        stops?: number[];
        opacityFrom?: number;
        opacityTo?: number;
      };
    };
    dropShadow?: {
      enabled?: boolean;
      top?: number;
      left?: number;
      blur?: number;
      opacity?: number;
    };
  };
  tooltip?: {
    enabled?: boolean;
    offsetY?: number;
  };
};

/**
* Y Axis options
* See https://apexcharts.com/docs/options/yaxis/
*/
type ApexYAxis = {
  seriesName?: string;
  opposite?: boolean;
  tickAmount?: number;
  min?: number;
  max?: number;
  floating?: boolean;
  decimalsInFloat?: number;
  labels?: {
    show?: boolean;
    maxWidth?: number;
    style?: {
      color?: string;
      fontSize?: string;
      cssClass?: string;
    };
    offsetX?: number;
    offsetY?: number;
    formatter?(val: number): string;
  };
  axisBorder?: {
    show?: boolean;
    color?: string;
    offsetX?: number;
    offsetY?: number
  };
  axisTicks?: {
    show?: boolean;
    borderType?: string;
    color?: string;
    width?: number;
    offsetX?: number;
    offsetY?: number
  };
  title?: {
    text?: string;
    rotate?: number;
    offsetX?: number;
    offsetY?: number;
    style?: {
      color?: string;
      fontSize?: string;
      cssClass?: string;
    };
  };
  crosshairs?: {
    show?: boolean;
    position?: string;
    stroke?: {
      color?: string;
      width?: number;
      dashArray?: number
    };
  };
  tooltip?: {
    enabled?: boolean;
    offsetX?: number;
  };
};

/**
* Plot X and Y grid options
* See https://apexcharts.com/docs/options/grid/
*/
type ApexGrid = {
  show?: boolean;
  borderColor?: string;
  strokeDashArray?: number;
  position?: "front" | "back";
  xaxis?: {
    lines?: {
      show?: boolean;
      offsetX?: number;
      offsetY?: number;
    }
  };
  yaxis?: {
    lines?: {
      show?: boolean;
      offsetX?: number;
      offsetY?: number;
    }
  };
  row?: {
    colors?: string[];
    opacity?: number
  };
  column?: {
    colors?: string[];
    opacity?: number;
  };
  padding?: {
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
  };
};

declare module "apexcharts" {
  export = ApexCharts;
}