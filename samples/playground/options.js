export const optionsPattern = {
  title: 'Chart options',
  type: Object,
  required: true,
  attrs: {
    annotations: {
      type: Object,
      attrs: {
        position: {
          title:
            'Whether to put the annotations behind the charts or in front of it',
          type: String,
          choices: ['front', 'back'],
          default: 'front'
        },
        yaxis: {
          type: Array,
          item: {
            y: {
              title: 'Value on which the annotation will be drawn',
              type: Number,
              default: 0
            },
            y2: {
              title:
                'If you provide this additional y2 value, a region will be drawn from y to y2',
              type: Number
            },
            strokeDashArray: {
              title:
                'Creates dashes in borders of the SVG path. A higher number creates more space between dashes in the border.',
              type: Number,
              default: 1
            },
            borderColor: {
              title: 'Color of the annotation line',
              type: 'color',
              default: '#c2c2c2'
            },
            fillColor: {
              title:
                'Fill Color of the region. Only applicable if y2 is provided.',
              type: 'color',
              default: '#c2c2c2'
            },
            opacity: {
              title: 'Opacity of the filled region',
              type: Number,
              default: 0.3
            },
            offsetX: {
              title: 'Sets the left offset for annotation line',
              type: Number,
              default: 0
            },
            offsetY: {
              title: 'Sets the top offset for annotation line',
              type: Number,
              default: -3
            },
            width: {
              title: 'Sets the width for annotation line',
              default: '100%'
            },
            yAxisIndex: {
              title:
                'When there are multiple y-axis, setting this options will put the annotation for that particular y-axis',
              type: Number,
              default: 0
            },
            label: {
              type: Object,
              attrs: {
                borderColor: {
                  title: 'Border Color of the label',
                  type: 'color',
                  default: '#c2c2c2'
                },
                borderWidth: {
                  title: 'Border width of the label',
                  type: Number,
                  default: 1
                },
                borderRadius: {
                  title: 'Border-radius of the label',
                  type: Number,
                  default: 2
                },
                text: {
                  title: 'Text for tha annotation label',
                  type: String
                },
                textAnchor: {
                  title:
                    'The alignment of text relative to label’s drawing position',
                  type: String,
                  choices: ['start', 'middle', 'end'],
                  default: 'end'
                },
                position: {
                  type: String,
                  choices: ['left', 'right'],
                  default: 'right'
                },
                offsetX: {
                  title: 'Sets the left offset for annotation label',
                  type: Number,
                  default: 0
                },
                offsetY: {
                  title: 'Sets the top offset for annotation label',
                  type: Number,
                  default: 0
                },
                style: {
                  type: Object,
                  attrs: {
                    background: {
                      title: 'Background Color for the annotation label',
                      type: 'color',
                      default: '#fff'
                    },
                    color: {
                      title: 'ForeColor for the annotation label',
                      type: 'color',
                      default: '#777'
                    },
                    fontSize: {
                      title: 'FontSize for the annotation label',
                      type: String,
                      default: '12px'
                    },
                    fontWeight: {
                      title: 'Font-weight for the annotation label',
                      default: 400
                    },
                    fontFamily: {
                      title: 'Font-family for the annotation label',
                      type: String
                    },
                    cssClass: {
                      title:
                        'A custom CSS class to give to the annotation label elements',
                      type: String,
                      default: 'apexcharts-yaxis-annotation-label'
                    },
                    padding: {
                      type: Object,
                      attrs: {
                        left: {
                          title: 'Left padding for the label',
                          type: Number,
                          default: 5
                        },
                        right: {
                          title: 'Right padding for the label',
                          type: Number,
                          default: 5
                        },
                        top: {
                          title: 'Top padding for the label',
                          type: Number,
                          default: 0
                        },
                        bottom: {
                          title: 'Bottom padding for the label',
                          type: Number,
                          default: 2
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        xaxis: {
          type: Array,
          item: {
            type: Object,
            attrs: {
              x: {
                title: 'Value on which the annotation will be drawn',
                type: Number,
                default: 0
              },
              x2: {
                title:
                  'If you provide this additional x2 value, a region will be drawn from x to x2',
                type: Number,
                default: null
              },
              strokeDashArray: {
                title:
                  'Creates dashes in borders of SVG path. A higher number creates more space between dashes in the border.',
                type: Number,
                default: 1
              },
              borderColor: {
                title: 'Color of the annotation line',
                type: 'color',
                default: '#c2c2c2'
              },
              fillColor: {
                title:
                  'Fill Color of the region. Only applicable if x2 is provided.',
                type: 'color',
                default: '#c2c2c2'
              },
              opacity: {
                title: 'Opacity of the filled region',
                type: Number,
                default: 0.3
              },
              offsetX: {
                title: 'Sets the left offset for annotation line',
                type: Number,
                default: 0
              },
              offsetY: {
                title: 'Sets the top offset for annotation line',
                type: Number,
                default: 0
              },
              label: {
                type: Object,
                attrs: {
                  borderColor: {
                    title: 'Border color of the label',
                    type: 'color',
                    default: '#c2c2c2'
                  },
                  borderWidth: {
                    title: 'Border width of the label',
                    type: Number,
                    default: 1
                  },
                  borderRadius: {
                    title: 'Border-radius of the label',
                    type: Number,
                    default: 2
                  },
                  text: {
                    title: 'Text for tha annotation label',
                    type: String
                  },
                  textAnchor: {
                    title:
                      'The alignment of text relative to label’s drawing position',
                    type: String,
                    choices: ['start', 'middle', 'end'],
                    default: 'middle'
                  },
                  position: {
                    type: String,
                    choices: ['top', 'bottom'],
                    default: 'top'
                  },
                  orientation: {
                    type: String,
                    choices: ['vertical', 'horizontal'],
                    default: 'vertical'
                  },
                  offsetX: {
                    title: 'Sets the left offset for annotation label',
                    type: Number,
                    default: 0
                  },
                  offsetY: {
                    title: 'Sets the top offset for annotation label',
                    type: Number,
                    default: 0
                  },
                  style: {
                    type: Object,
                    attrs: {
                      background: {
                        type: 'color',
                        default: '#fff'
                      },
                      color: {
                        title: 'ForeColor for the annotation label',
                        type: 'color'
                      },
                      fontSize: {
                        title: 'FontSize for the annotation label',
                        type: String,
                        default: '12px'
                      },
                      fontWeight: {
                        title: 'Font-weight for the annotation label',
                        default: 400
                      },
                      fontFamily: {
                        title: 'Font-family for the annotation label',
                        type: String
                      },
                      cssClass: {
                        title:
                          ' A custom CSS class to give to the annotation label elements',
                        type: String,
                        default: 'apexcharts-xaxis-annotation-label'
                      }
                    }
                  }
                }
              }
            }
          }
        },
        points: {
          type: Array,
          item: {
            type: Object,
            attrs: {
              x: {
                title:
                  'X Value on which the annotation will be drawn (can be either timestamp for datetime x-axis or string category for category x-axis)',
                default: 0
              },
              y: {
                title: 'Y Value on which the annotation will be drawn',
                type: Number,
                default: null
              },
              yAxisIndex: {
                title:
                  'When there are multiple y-axis, setting this options will put the point annotation for that particular y-axis’ y value',
                type: Number,
                default: 0
              },
              seriesIndex: {
                title:
                  'In a multiple series, you will have to specify which series the annotation’s y value belongs to. Not required for single series',
                type: Number,
                default: 0
              },
              marker: {
                type: Object,
                attrs: {
                  size: {
                    title: 'Size of the marker',
                    type: Number,
                    default: 0
                  },
                  fillColor: {
                    title: 'Fill Color of the marker point',
                    type: 'color',
                    default: '#fff'
                  },
                  strokeColor: {
                    title: 'Stroke Color of the marker point',
                    type: 'color',
                    default: '#333'
                  },
                  strokeWidth: {
                    title: 'Stroke Size of the marker point',
                    type: Number,
                    default: 3
                  },
                  shape: {
                    title: 'Shape of the marker',
                    type: String,
                    choices: ['circle', 'square'],
                    default: 'circle'
                  },
                  radius: {
                    title: 'Radius of the marker (applies to square shape)',
                    type: Number,
                    default: 2
                  },
                  offsetX: {
                    title: 'Sets the left offset of the marker',
                    type: Number,
                    default: 0
                  },
                  offsetY: {
                    title: 'Sets the top offset of the marker',
                    type: Number,
                    default: 0
                  },
                  cssClass: {
                    title: 'Additional CSS classes to append to the marker',
                    type: String,
                    default: ''
                  }
                }
              },
              label: {
                type: Object,
                attrs: {
                  borderColor: {
                    title: 'Border Color of the label',
                    type: 'color',
                    default: '#c2c2c2'
                  },
                  borderWidth: {
                    title: 'Border width of the label',
                    type: Number,
                    default: 1
                  },
                  borderRadius: {
                    title: 'Border-radius of the label',
                    type: Number,
                    default: 2
                  },
                  text: {
                    title: 'Text for tha annotation label',
                    type: String
                  },
                  textAnchor: {
                    title:
                      'The alignment of text relative to label’s drawing position',
                    type: String,
                    choices: ['start', 'middle', 'end'],
                    default: 'middle'
                  },
                  offsetX: {
                    title: 'Sets the left offset for annotation label',
                    type: Number,
                    default: 0
                  },
                  offsetY: {
                    title: 'Sets the top offset for annotation label',
                    type: Number,
                    default: -15
                  },
                  style: {
                    type: Object,
                    attrs: {
                      background: {
                        title: 'Background Color for the annotation label',
                        type: 'color',
                        default: '#fff'
                      },
                      color: {
                        title: 'ForeColor for the annotation label',
                        type: 'color',
                        default: '#777'
                      },
                      fontSize: {
                        title: '',
                        type: String,
                        default: '12px'
                      },
                      fontWeight: {
                        title: 'Font-weight for the annotation label',
                        default: 400
                      },
                      fontFamily: {
                        title: 'Font-family for the annotation label',
                        type: String
                      },
                      cssClass: {
                        title:
                          'A custom Css Class to give to the annotation label elements',
                        type: String,
                        default: 'apexcharts-point-annotation-label'
                      },
                      padding: {
                        type: Object,
                        attrs: {
                          left: {
                            title: 'Left padding for the label',
                            type: Number,
                            default: 5
                          },
                          right: {
                            title: 'Right padding for the label',
                            type: Number,
                            default: 5
                          },
                          top: {
                            title: 'Top padding for the label',
                            type: Number,
                            default: 0
                          },
                          bottom: {
                            title: 'Bottom padding for the label',
                            type: Number,
                            default: 2
                          }
                        }
                      }
                    }
                  }
                }
              },
              image: {
                type: Object,
                attrs: {
                  path: {
                    title:
                      'Provide a full path of the image to display in place of annotation',
                    type: String
                  },
                  width: {
                    title: 'Width of image annotation',
                    type: Number,
                    default: 20
                  },
                  height: {
                    title: 'Height of image annotation',
                    type: Number,
                    default: 20
                  },
                  offsetX: {
                    title: 'Left offset of the image',
                    type: Number,
                    default: 0
                  },
                  offsetY: {
                    title: 'Top offset of the image',
                    type: Number,
                    default: 0
                  }
                }
              }
            }
          }
        },
        texts: {
          type: Array,
          item: {
            type: Object,
            attrs: {
              x: {
                title:
                  'X (left) position for the text relative to the element specified in `appendTo` property',
                type: Number,
                default: 0
              },
              y: {
                title:
                  'Y (top) position for the text relative to the element specified in `appendTo` property',
                type: Number,
                default: 0
              },
              text: {
                title: 'The main text to be displayed',
                type: String,
                default: ''
              },
              textAnchor: {
                title:
                  'The alignment of text relative to label’s drawing position',
                type: String,
                choices: ['start', 'middle', 'end'],
                default: 'start'
              },
              foreColor: {
                title: 'ForeColor for the annotation label',
                type: 'color'
              },
              fontSize: {
                title: 'FontSize for the annotation label',
                type: String,
                default: '13px'
              },
              fontFamily: {
                title: 'Font-family for the annotation label',
                type: String
              },
              fontWeight: {
                title: 'Font-weight for the annotation label',
                default: 400
              },
              appendTo: {
                title:
                  'A query selector to which the text element will be appended',
                type: String,
                default: '.apexcharts-annotations'
              },
              backgroundColor: {
                type: String,
                default: 'transparent'
              },
              borderColor: {
                title: 'Border Color for the label',
                type: 'color',
                default: '#c2c2c2'
              },
              borderRadius: {
                title: 'Border Radius for the label',
                type: Number,
                default: 0
              },
              borderWidth: {
                title: 'Border width for the label',
                type: Number,
                default: 0
              },
              paddingLeft: {
                title: 'Left padding for the label',
                type: Number,
                default: 4
              },
              paddingRight: {
                title: 'Right padding for the label',
                type: Number,
                default: 4
              },
              paddingTop: {
                title: 'Top padding for the label',
                type: Number,
                default: 2
              },
              paddingBottom: {
                title: 'Bottom padding for the label',
                type: Number,
                default: 2
              }
            }
          }
        },
        images: {
          type: Array,
          item: {
            type: Object,
            attrs: {
              path: {
                title: 'An absolute path to the image',
                type: String,
                default: ''
              },
              x: {
                title:
                  'Left position for the image relative to the element specified in `appendTo` property',
                type: Number,
                default: 0
              },
              y: {
                title:
                  'Top position for the image relative to the element specified in `appendTo` property',
                type: Number,
                default: 0
              },
              width: {
                title: 'The width of the image',
                type: Number,
                default: 20
              },
              height: {
                title: 'The height of the image',
                type: Number,
                default: 20
              },
              appendTo: {
                title:
                  'A query selector to which the image element will be appended',
                type: String,
                default: '.apexcharts-annotations'
              }
            }
          }
        }
      }
    },
    chart: {
      type: Object,
      required: true,
      attrs: {
        animations: {
          type: Object,
          attrs: {
            enabled: {
              title:
                'Enable or disable all the animations that happen initially or during data update',
              type: Boolean,
              default: true
            },
            easing: {
              type: String,
              choices: ['linear', 'easein', 'easeout', 'easeinout'],
              default: 'easeinout'
            },
            speed: {
              title: 'Speed at which animation runs',
              type: Number,
              default: 800
            },
            animateGradually: {
              type: Object,
              attrs: {
                enabled: {
                  title:
                    'Gradually animate one by one every data in the series instead of animating all at once',
                  type: Boolean,
                  default: true
                },
                delay: {
                  title: 'Speed at which gradual (one by one) animation runs',
                  type: Number,
                  default: 150
                }
              }
            },
            dynamicAnimation: {
              type: Object,
              attrs: {
                enabled: {
                  title:
                    'Animate the chart when data is changed and chart is re-rendered',
                  type: Boolean,
                  default: true
                },
                speed: {
                  title:
                    'Speed at which dynamic animation runs whenever data changes',
                  type: Number,
                  default: 350
                }
              }
            }
          }
        },
        background: {
          title:
            'Background color for the chart area. If you want to set background with css, use .apexcharts-canvas to set it.',
          type: 'color',
          default: '#fff'
        },
        brush: {
          title:
            'Note: One important configuration to set in a brush chart is the chart.selection option. The range which you set in chart.selection will act as brush in the brush chart.',
          url: 'https://apexcharts.com/docs/options/chart/brush/',
          type: Object,
          attrs: {
            enabled: {
              title:
                'After you enable brush, you need to set target chart ID to allow the brush chart to capture events on the target chart',
              type: Boolean,
              default: false
            },
            target: {
              title:
                'Chart ID of the target chart to sync the brush chart and the target chart',
              type: String
            },
            autoScaleYaxis: {
              title:
                'If set to true, the Y-axis will automatically scale based on the visible min/max range',
              type: Boolean,
              default: false
            }
          }
        },
        defaultLocale: {
          title:
            'Preselected language that the chart should render initially and the selected locale has to be present in the locales array',
          url: 'https://apexcharts.com/docs/localization/',
          type: String,
          choices: [
            'ca',
            'cs',
            'de',
            'el',
            'en',
            'es',
            'fi',
            'fr',
            'he',
            'hi',
            'hr',
            'hy',
            'id',
            'it',
            'ka',
            'ko',
            'lt',
            'nb',
            'nl',
            'pl',
            'pt',
            'pt-br',
            'rs',
            'ru',
            'se',
            'sk',
            'sl',
            'sq',
            'th',
            'tr',
            'ua',
            'zh-cn'
          ],
          default: 'en'
        },
        dropShadow: {
          type: Object,
          attrs: {
            enabled: {
              title: 'Enable a dropshadow for paths of the SVG',
              type: Boolean,
              default: false
            },
            enabledOnSeries: {
              // BUG: Array or Number
              title:
                'Provide series index on which the dropshadow should be enabled',
              type: Number
            },
            top: {
              title: 'Set top offset for shadow',
              type: Number,
              default: 0
            },
            left: {
              title: 'Set left offset for shadow',
              type: Number,
              default: 0
            },
            blur: {
              title: 'Set blur distance for shadow',
              type: Number,
              default: 3
            },
            color: {
              title:
                'Give a color to the shadow. If array is provided, each series can have different shadow color.',
              type: 'color',
              default: '#000'
            },
            opacity: {
              title: 'Set the opacity of shadow',
              type: Number,
              default: 0.35
            }
          }
        },
        fontFamily: {
          title: 'Sets the font family for all the text elements of the chart',
          type: String,
          default: 'Helvetica, Arial, sans-serif'
        },
        foreColor: {
          title: 'Sets the text color for the chart',
          type: 'color',
          default: '#373d3f'
        },
        group: {
          title:
            'A chart group is created to perform interactive operations at the same time in all the charts. In case you want to create synchronized charts, you will need to provide this property.',
          url: 'https://apexcharts.com/docs/chart-types/synchronized-charts/',
          type: String
        },
        events: {
          type: Object,
          attrs: {
            animationEnd: {
              title: 'Fires when the chart’s initial animation is finished',
              default: function(chartContext, options) {}
            },
            beforeMount: {
              title: 'Fires before the chart has been drawn on screen',
              default: function(chartContext, config) {}
            },
            mounted: {
              title: 'Fires after the chart has been drawn on screen',
              default: function(chartContext, config) {}
            },
            updated: {
              title:
                'Fires when the chart has been dynamically updated either with `updateOptions()` or `updateSeries()` functions',
              default: function(chartContext, config) {}
            },
            click: {
              title: 'Fires when user clicks on any area of the chart',
              default: function(event, chartContext, config) {
                // The last parameter config contains additional information like `seriesIndex` and `dataPointIndex` for cartesian charts
              }
            },
            mouseMove: {
              title: 'Fires when user moves mouse on any area of the chart',
              default: function(event, chartContext, config) {
                // The last parameter config contains additional information like `seriesIndex` and `dataPointIndex` for cartesian charts
              }
            },
            legendClick: {
              title: 'Fires when user clicks on legend',
              default: function(chartContext, seriesIndex, config) {}
            },
            markerClick: {
              title: 'Fires when user clicks on the markers',
              url: 'https://apexcharts.com/docs/options/markers/',
              default: function(
                event,
                chartContext,
                { seriesIndex, dataPointIndex, config }
              ) {}
            },
            selection: {
              title: 'Fires when user selects rect using the selection tool',
              default: function(chartContext, { xaxis, yaxis }) {
                //  The second argument contains the yaxis and xaxis coordinates where user made the selection
              }
            },
            dataPointSelection: {
              title:
                'Fires when user clicks on a datapoint (bar/column/marker/bubble/donut-slice)',
              url:
                'https://apexcharts.com/docs/options/chart/events/#dataPointSelection',
              default: function(event, chartContext, config) {}
            },
            dataPointMouseEnter: {
              title:
                'Fires when user’s mouse enter on a datapoint (bar/column/marker/bubble/donut-slice)',
              url:
                'https://apexcharts.com/docs/options/chart/events/#dataPointMouseEnter',
              default: function(event, chartContext, config) {}
            },
            dataPointMouseLeave: {
              title:
                'Fires when user’s mouse leaves a datapoint (bar/column/marker/bubble/donut-slice)',
              default: function(event, chartContext, config) {}
            },
            beforeZoom: {
              title:
                'This function, if defined, runs just before zooming in/out of the chart allowing you to set a custom range for zooming in/out',
              url:
                'https://apexcharts.com/docs/options/chart/events/#beforeZoom',
              default: function(chartContext, { xaxis }) {}
            },
            beforeResetZoom: {
              title:
                'This function, if defined, runs just before the user hits the HOME button on the toolbar to reset the chart to it’s original state. The function allows you to set a custom axes range for the initial view of the chart.',
              url:
                'https://apexcharts.com/docs/options/chart/events/#beforeResetZoom',
              default: function(chartContext, opts) {}
            },
            zoomed: {
              title:
                'Fires when user zooms in/out the chart using either the selection zooming tool or zoom in/out buttons',
              default: function(chartContext, { xaxis, yaxis }) {
                // The 2nd argument includes information of the new xaxis/yaxis generated after zooming
              }
            },
            scrolled: {
              title: 'Fires when user scrolls using the pan tool',
              default: function(chartContext, { xaxis }) {
                // The 2nd argument includes information of the new xaxis generated after scrolling
              }
            },
            brushScrolled: {
              title: 'Fires when user drags the brush in a brush chart',
              default: function(chartContext, { xaxis, yaxis }) {
                // The 2nd argument includes information of the new axes generated after scrolling the brush
              }
            }
          }
        },
        height: {
          title: 'Height of the chart',
          url: 'https://apexcharts.com/docs/options/chart/height/#height',
          default: 'auto'
        },
        id: {
          title:
            'A chart ID is a unique identifier that will be used in calling certain ApexCharts methods',
          url: 'https://apexcharts.com/docs/options/chart/id/#id',
          type: String
        },
        locales: {
          type: Object,
          attrs: {
            defaultLocale: {
              title:
                "You can specify a default locale if you have set multiple locales. Later on, you can also override the locale dynamically by calling `chart.setLocale('fr')` also.",
              type: String,
              default: 'en'
            },
            // BUG: implement it, needs array type
            locales: {
              type: Array,
              item: {
                type: Object,
                attrs: {
                  name: {
                    title:
                      'Name of the locale you will be defining options for. Can be `en`, `fr`, etc.',
                    type: String,
                    default: 'en'
                  },
                  options: {
                    type: Object,
                    attrs: {
                      months: {
                        title: 'Full month names in your preferred language',
                        default: [
                          'January',
                          'February',
                          'March',
                          'April',
                          'May',
                          'June',
                          'July',
                          'August',
                          'September',
                          'October',
                          'November',
                          'December'
                        ]
                      },
                      shortMonths: {
                        title: 'Abbreviations of months',
                        default: [
                          'Jan',
                          'Feb',
                          'Mar',
                          'Apr',
                          'May',
                          'Jun',
                          'Jul',
                          'Aug',
                          'Sep',
                          'Oct',
                          'Nov',
                          'Dec'
                        ]
                      },
                      days: {
                        title: 'Full names of days in your language',
                        default: [
                          'Sunday',
                          'Monday',
                          'Tuesday',
                          'Wednesday',
                          'Thursday',
                          'Friday',
                          'Saturday'
                        ]
                      },
                      shortDays: {
                        title: ' Abbreviated day names',
                        default: [
                          'Sun',
                          'Mon',
                          'Tue',
                          'Wed',
                          'Thu',
                          'Fri',
                          'Sat'
                        ]
                      },
                      toolbar: {
                        type: Object,
                        attrs: {
                          download: {
                            title:
                              'Tooltip title text which appears when you hover over download icon',
                            type: String,
                            default: 'Download SVG'
                          },
                          selection: {
                            title:
                              'Tooltip title text which appears when you hover over selection icon',
                            type: String,
                            default: 'Selection'
                          },
                          selectionZoom: {
                            title:
                              'Tooltip title text which appears when you hover over selection zoom icon',
                            type: String,
                            default: 'Selection Zoom'
                          },
                          zoomIn: {
                            title:
                              'Tooltip title text which appears when you hover over zoom in icon',
                            type: String,
                            default: 'Zoom In'
                          },
                          zoomOut: {
                            title:
                              'Tooltip title text which appears when you hover over zoom out icon',
                            type: String,
                            default: 'Zoom Out'
                          },
                          pan: {
                            title:
                              'Tooltip title text which appears when you hover over pan icon',
                            type: String,
                            default: 'Panning'
                          },
                          reset: {
                            title:
                              'Tooltip title text which appears when you hover over reset icon',
                            type: String,
                            default: 'Reset Zoom'
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        offsetX: {
          title: 'Sets the left offset for the whole chart',
          type: Number,
          default: 0
        },
        offsetY: {
          title: 'Sets the top offset for the entire chart',
          type: Number,
          default: 0
        },
        parentHeightOffset: {
          title:
            'A small increment in height added to the parent of chart element',
          type: Number,
          default: 15
        },
        redrawOnParentResize: {
          title:
            'Re-render the chart when the element size gets changed or the size of the parent element gets changed. Useful in conditions where the chart container resizes after page reload.',
          type: Boolean,
          default: true
        },
        redrawOnWindowResize: {
          title:
            'Re-render the chart when the window in which chart is rendered gets resized. Useful when rendering chart in iframes.',
          type: Boolean,
          default: true
        },
        selection: {
          type: Object,
          attrs: {
            enabled: {
              title:
                'To allow selection in axis charts. Selection will not be enabled for category x-axis charts, but only for charts having numeric x-axis. For eg., timeline charts.',
              type: Boolean,
              default: true
            },
            type: {
              title:
                'Allow selection either on both x-axis, y-axis or on both axis',
              type: String,
              choices: ['x', 'y', 'xy'],
              default: 'x'
            },
            fill: {
              type: Object,
              attrs: {
                color: {
                  title:
                    'Background color of the selection rect which is drawn when user drags on the chart',
                  type: 'color',
                  default: '#24292e'
                },
                opacity: {
                  title: 'Opacity of background color of the selection rect',
                  type: Number,
                  default: 0.1
                }
              }
            },
            stroke: {
              type: Object,
              attrs: {
                width: {
                  title: 'Border thickness of the selection rect',
                  type: Number,
                  default: 1
                },
                dashArray: {
                  title:
                    'Creates dashes in borders of svg path. Higher number creates more space between dashes in the border.',
                  type: Number,
                  default: 3
                },
                color: {
                  title: 'Colors of selection border',
                  type: 'color',
                  default: '#24292e'
                },
                opacity: {
                  title: 'Opacity of selection border',
                  type: Number,
                  default: 0.4
                }
              }
            },
            xaxis: {
              type: Object,
              attrs: {
                min: {
                  title:
                    'Start value of x-axis. For a time-series chart, a timestamp should be provided.',
                  type: Number
                },
                max: {
                  title:
                    'End value of x-axis. For a time-series chart, a timestamp should be provided.',
                  type: Number
                }
              }
            },
            yaxis: {
              type: Object,
              attrs: {
                min: {
                  title:
                    'Start value of y-axis. (if used in a multiple y-axes chart, this considers the 1st y-axis).',
                  type: Number
                },
                max: {
                  title:
                    'End value of y-axis (if used in a multiple y-axes chart, this considers the 1st y-axis).',
                  type: Number
                }
              }
            }
          }
        },
        sparkline: {
          type: Object,
          attrs: {
            enabled: {
              title:
                'Sparkline hides all the elements of the charts other than the primary paths. Helps to visualize data in small areas',
              type: Boolean,
              default: false
            }
          }
        },
        stacked: {
          title:
            'Enables stacked option for axis charts. Note: A stacked chart works only for same chart types and won’t work in combo/mixed charts combinations. So, an area series combined with a column series will not work.',
          type: Boolean,
          default: false
        },
        stackType: {
          title:
            'When stacked, should the stacking be percentage based or normal stacking',
          type: String,
          choices: ['normal', '100%'],
          default: 'normal'
        },
        toolbar: {
          type: Object,
          attrs: {
            show: {
              title: 'Display the toolbar/menu in the top right corner',
              type: Boolean,
              default: true
            },
            offsetX: {
              title: 'Sets the left offset of the toolbar',
              type: Number,
              default: 0
            },
            offsetY: {
              title: 'Sets the top offset of the toolbar',
              type: Number,
              default: 0
            },
            tools: {
              type: Object,
              attrs: {
                download: {
                  title:
                    'Show the download menu/hamburger icon in the toolbar. If you want to display a custom icon instead of hamburger icon, you can provide HTML string in this property.',
                  url:
                    'https://apexcharts.com/docs/options/chart/toolbar/#download',
                  type: Boolean,
                  default: true
                },
                selection: {
                  title:
                    'Show the rectangle selection icon in the toolbar. If you want to display a custom icon for selection, you can provide HTML string in this property. Make sure to also enable `chart.selection` when showing the selection tool.',
                  url:
                    'https://apexcharts.com/docs/options/chart/toolbar/#selection',
                  type: Boolean,
                  default: true
                },
                zoom: {
                  title:
                    'Show the zoom icon which is used for zooming by dragging selection on the chart area. If you want to display a custom icon for zoom, you can provide HTML string in this property.',
                  type: Boolean,
                  default: true
                },
                zoomin: {
                  title:
                    'Show the zoom-in icon which zooms in 50% from the visible chart area. If you want to display a custom icon for zoom-in, you can provide HTML string in this property.',
                  type: Boolean,
                  default: true
                },
                zoomout: {
                  title:
                    'Show the zoom-out icon which zooms out 50% from the visible chart area. If you want to display a custom icon for zoom-out, you can provide HTML string in this property.',
                  type: Boolean,
                  default: true
                },
                pan: {
                  title: 'Show the panning icon in the toolbar',
                  type: Boolean,
                  default: true
                },
                reset: {
                  title:
                    'Reset the chart data to it’s initial state after zommin/zoomout/panning. If you want to display a custom icon for reset, you can provide HTML string in this property.',
                  type: Boolean,
                  default: true
                },
                customIcons: {
                  title: 'Allows to add additional icon buttons in the toolbar',
                  url:
                    'https://apexcharts.com/docs/options/chart/toolbar/#customIcons',
                  default: []
                }
              }
            },
            export: {
              type: Object,
              attrs: {
                csv: {
                  type: Object,
                  attrs: {
                    filename: {
                      title:
                        'Name of the csv file. Defaults to auto generated chart ID.',
                      type: String
                    },
                    columnDelimiter: {
                      title: 'Delimeter to separate data-items',
                      type: String,
                      default: ','
                    },
                    headerCategory: {
                      title: 'Column Title of X values',
                      type: String,
                      default: 'category'
                    },
                    headerValue: {
                      title: 'Column Title of Y values',
                      type: String,
                      default: 'value'
                    },
                    dateFormatter: {
                      title:
                        'If timestamps are provided as X values, those timestamps can be formatted to convert them to date strings',
                      default: function(timestamp) {
                        return new Date(timestamp).toDateString()
                      }
                    }
                  }
                },
                png: {
                  type: Object,
                  attrs: {
                    filename: {
                      type: String
                    }
                  }
                },
                svg: {
                  type: Object,
                  attrs: {
                    filename: {
                      type: String
                    }
                  }
                }
              }
            },
            autoSelected: {
              title:
                'Automatically select one of the following tools when the chart loads',
              choices: ['zoom', 'selection', 'pan'],
              type: String,
              default: 'zoom'
            }
          }
        },
        type: {
          title: 'Chart type',
          type: String,
          choices: [
            'line',
            'area',
            'bar',
            'radar',
            'histogram',
            'pie',
            'donut',
            'radialBar',
            'scatter',
            'bubble',
            'heatmap',
            'candlestick'
          ],
          required: true,
          default: 'line'
        },
        width: {
          title:
            'Width of the chart. Accepts Number (400) OR String (‘400px’).',
          default: '100%'
        },
        zoom: {
          type: Object,
          attrs: {
            enable: {
              title:
                "To allow zooming in axis charts. Note: In a category x-axis chart, to enable zooming, you will also need to set xaxis.tickPlacement: 'on'.",
              url: 'https://apexcharts.com/docs/options/chart/zoom/#enabled',
              type: Boolean,
              default: true
            },
            type: {
              title:
                'Allow zooming either on both x-axis, y-axis or on both axis. Known Issue: In synchronized charts, xy or y will not update charts in sync, while x will work correctly.',
              type: String,
              choices: ['x', 'y', 'xy'],
              default: 'x'
            },
            autoScaleYaxis: {
              title:
                'When this option is turned on, the chart’s y-axis re-scales to a new low and high based on the visible area. Helpful in situations where the user zoomed in to a small area to get a better view.  Known Issue: This option doesn’t work in a multi-axis chart (when you have more than 1 y-axis).',
              type: Boolean,
              default: false
            },
            zoomedArea: {
              type: Object,
              url: 'https://apexcharts.com/docs/options/chart/zoom/#zoomedArea',
              attrs: {
                fill: {
                  type: Object,
                  attrs: {
                    color: {
                      title: 'Background color of the selection zoomed area',
                      type: 'color',
                      default: '#90CAF9'
                    },
                    opacity: {
                      title:
                        'Sets the transparency level of the selection fill',
                      type: Number,
                      default: 0.4
                    }
                  }
                },
                stroke: {
                  type: Object,
                  attrs: {
                    color: {
                      title: 'Border color of the selection zoomed area',
                      type: 'color',
                      default: '#0D47A1'
                    },
                    opacity: {
                      title:
                        'Sets the transparency level of the selection border',
                      type: Number,
                      default: 0.4
                    },
                    width: {
                      title: 'Sets the width selection border',
                      type: Number,
                      default: 1
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    colors: {
      title:
        'Colors for the chart’s series. When all colors of the array are used, it starts from the beginning.',
      url: 'https://apexcharts.com/docs/options/colors/',
      default: ['#2E93FA', '#66DA26', '#546E7A', '#E91E63', '#FF9800']
    },
    dataLabels: {
      type: Object,
      attrs: {
        enabled: {
          title: 'Whether to show dataLabels or not',
          type: Boolean,
          default: true
        },
        enabledOnSeries: {
          title:
            'Allows showing series only on specific series in a multi-series chart. For eg., if you have a line and a column chart, you can show dataLabels only on the line chart by specifying it’s index in this array property.'
        },
        formatter: {
          title:
            'The formatter function allows you to modify the value before displaying',
          url: 'https://apexcharts.com/docs/options/datalabels/#formatter',
          default: function(val, opts) {
            return val
          }
        },
        textAnchor: {
          title:
            'The alignment of text relative to dataLabel’s drawing position',
          type: String,
          choices: ['start', 'middle', 'end'],
          default: 'middle'
        },
        distributed: {
          title:
            'Similar to `plotOptions.bar.distributed`, this option makes each data-label discrete. So, when you provide an array of colors in `datalabels.style.colors`, the index in the colors array correlates with individual data-label index of all series.',
          type: Boolean,
          default: false
        },
        offsetX: {
          title: 'Sets the left offset for dataLabels',
          type: Number,
          default: 0
        },
        offsetY: {
          title: 'Sets the top offset for dataLabels',
          type: Number,
          default: 0
        },
        style: {
          type: Object,
          attrs: {
            fontSize: {
              title: 'Font size for the label',
              type: String,
              default: '14px'
            },
            fontFamily: {
              title: 'Font family for the label',
              type: String,
              default: 'Helvetica, Arial, sans-serif'
            },
            fontWeight: {
              title:
                'Font weight for the label. Can be String (‘bold’) or number (400/500).',
              type: String,
              default: 'bold'
            },
            colors: {
              title: 'Fore colors array for the labels'
            }
          }
        },
        background: {
          type: Object,
          attrs: {
            enabled: {
              title: 'Should draw a background rectangle around the label',
              type: Boolean,
              default: true
            },
            foreColor: {
              title:
                'Color of the label when background is enabled. This will override the `colors` above in `style` key.',
              type: 'color',
              default: '#fff'
            },
            padding: {
              type: Number,
              default: 4
            },
            borderRadius: {
              title: 'Border radius of the background rect',
              type: Number,
              default: 2
            },
            borderWidth: {
              title: 'Border width of the background rect',
              type: Number,
              default: 1
            },
            borderColor: {
              title: 'Border color of the background rect',
              type: 'color',
              default: '#fff'
            },
            opacity: {
              title: 'Opacity of the background color',
              type: Number,
              default: 0.9
            },
            dropShadow: {
              type: Object,
              attrs: {
                enabled: {
                  title: 'Enable a dropshadow for dataLabels background',
                  type: Boolean,
                  default: false
                },
                top: {
                  title: 'Set top offset for shadow',
                  type: Number,
                  default: 1
                },
                left: {
                  title: 'Set left offset for shadow',
                  type: Number,
                  default: 1
                },
                blur: {
                  title: 'Set blur distance for shadow',
                  type: Number,
                  default: 1
                },
                color: {
                  title: 'Set color of the shadow',
                  type: 'color',
                  default: '#000'
                },
                opacity: {
                  title: 'Set the opacity of shadow',
                  type: Number,
                  default: 0.45
                }
              }
            }
          }
        },
        dropShadow: {
          type: Object,
          attrs: {
            enabled: {
              title: 'Enable a text dropshadow',
              type: Boolean,
              default: false
            },
            top: {
              title: 'Set top offset for text shadow',
              type: Number,
              default: 1
            },
            left: {
              title: 'Set left offset for text shadow',
              type: Number,
              default: 1
            },
            blur: {
              title: 'Set blur distance for text shadow',
              type: Number,
              default: 1
            },
            color: {
              title: 'Set color of the text shadow',
              type: 'color',
              default: '#000'
            },
            opacity: {
              title: 'Set the opacity of text shadow',
              type: Number,
              default: 0.45
            }
          }
        }
      }
    },
    fill: {
      type: Object,
      attrs: {
        colors: {
          title:
            'Colors to fill the svg paths. Each index in the array corresponds to the series-index.',
          url: 'https://apexcharts.com/docs/options/fill/#colors'
        },
        opacity: {
          title: 'Opacity of the fill attribute',
          type: Number,
          default: 0.9
        },
        type: {
          title:
            'Whether to fill the paths with solid colors or gradient. In a multi-series chart, you can pass an array to allow a combination of fill types like this.',
          type: String,
          choices: ['solid', 'gradient', 'pattern', 'image'],
          default: 'solid'
        },
        gradient: {
          type: Object,
          attrs: {
            shade: {
              type: String,
              choices: ['light', 'dark'],
              default: 'dark'
            },
            type: {
              type: String,
              choices: ['horizontal', 'vertical', 'diagonal1', 'diagonal2'],
              default: 'horizontal'
            },
            shadeIntensity: {
              title: 'Intensity of the gradient shade',
              type: Number,
              default: 0.5
            },
            gradientToColors: {
              title:
                'Optional colors that ends the gradient to. The main `colors` array becomes the `gradientFromColors` and this array becomes the end colors of the `gradient.Each` index in the array corresponds to the series- index.'
            },
            inverseColors: {
              title: 'Inverse the start and end colors of the gradient',
              type: Boolean,
              default: true
            },
            opacityFrom: {
              title:
                "Start color's opacity. If you want different opacity for different series, you can pass an array of numbers. For eg., opacityFrom: [0.2, 0.8]",
              type: Number,
              default: 1
            },
            opacityTo: {
              title: "End color's opacity",
              type: Number,
              default: 1
            },
            stops: {
              title: 'Stops defines the ramp of colors to use on a gradient',
              default: [0, 50, 100]
            },
            colorStops: {
              title:
                'Override everything and define your own stops with unlimited color stops',
              url: 'https://apexcharts.com/docs/options/fill/#colorStops',
              default: []
            }
          }
        },
        image: {
          type: Object,
          attrs: {
            src: {
              title:
                'Array of image paths which will correspond to each series',
              default: []
            },
            width: {
              title: 'Width of each image for all the series',
              type: Number
            },
            height: {
              title: 'Height of each image for all the series',
              type: Number
            }
          }
        },
        pattern: {
          type: Object,
          attrs: {
            style: {
              type: String,
              choices: [
                'verticalLines',
                'horizontalLines',
                'slantedLines',
                'squares',
                'circles'
              ],
              default: 'verticalLines'
            },
            width: {
              title: 'Pattern width which will be repeated at this interval',
              type: Number,
              default: 6
            },
            height: {
              title: 'Pattern height which will be repeated at this interval',
              type: Number,
              default: 6
            },
            strokeWidth: {
              title:
                'Pattern lines width indicates the thickness of the stroke of pattern',
              type: Number,
              default: 2
            }
          }
        }
      }
    },
    grid: {
      type: Object,
      attrs: {
        show: {
          title: 'Visibility of grid area (including xaxis/yaxis)',
          type: Boolean,
          default: true
        },
        borderColor: {
          title: 'Colors of grid borders/lines',
          type: 'color',
          default: '#90A4AE'
        },
        strokeDashArray: {
          title:
            ' Creates dashes in borders of svg path. Higher number creates more space between dashes in the border.',
          type: Number,
          default: 0
        },
        position: {
          title: ' Whether to place grid behind chart paths of in front',
          type: String,
          choices: ['front', 'back'],
          default: 'back'
        },
        xaxis: {
          type: Object,
          attrs: {
            lines: {
              type: Object,
              attrs: {
                show: {
                  title: 'Whether to show/hide x-axis lines',
                  type: Boolean,
                  default: false
                }
              }
            }
          }
        },
        yaxis: {
          type: Object,
          attrs: {
            lines: {
              type: Object,
              attrs: {
                show: {
                  title: 'Whether to show/hide y-axis lines',
                  type: Boolean,
                  default: false
                }
              }
            }
          }
        },
        row: {
          type: Object,
          attrs: {
            colors: {
              title:
                'Grid background colors filling in row pattern. Each row will be filled with colors based on the index in this array. If less colors are specified, colors are repeated.'
            },
            opacity: {
              title: 'Opacity of the row background colors',
              type: Number,
              default: 0.5
            }
          }
        },
        column: {
          type: Object,
          attrs: {
            colors: {
              title:
                'Grid background colors filling in column pattern. Each column will be filled with colors based on the index in this array. If less colors are specified, colors are repeated.'
            },
            opacity: {
              title: 'Opacity of the column background colors',
              type: Number,
              default: 0.5
            }
          }
        },
        padding: {
          type: Object,
          attrs: {
            top: {
              title: 'Grid padding from top',
              type: Number,
              default: 0
            },
            right: {
              title: 'Grid padding from top',
              type: Number,
              default: 0
            },
            bottom: {
              title: 'Grid padding from top',
              type: Number,
              default: 0
            },
            left: {
              title: 'Grid padding from top',
              type: Number,
              default: 0
            }
          }
        }
      }
    },
    labels: {
      title:
        'In Axis Charts (line/column), `labels` can be set instead of setting xaxis categories option. While, in pie/donut charts, each label corresponds to value in series array.'
    },
    legend: {
      type: Object,
      attrs: {
        show: {
          title: 'Whether to show or hide the legend container',
          type: Boolean,
          default: true
        },
        showForSingleSeries: {
          title: 'Show legend even if there is just 1 series',
          type: Boolean,
          default: false
        },
        showForNullSeries: {
          title:
            'Allows you to hide a particular legend if it’s series contains all null values',
          type: Boolean,
          default: true
        },
        showForZeroSeries: {
          title:
            'Allows you to hide a particular legend if it’s series contains all 0 values',
          type: Boolean,
          default: true
        },
        position: {
          type: String,
          choices: ['top', 'right', 'bottom', 'left'],
          default: 'bottom'
        },
        horizontalAlign: {
          type: String,
          choices: ['top', 'center', 'right'],
          default: 'center'
        },
        floating: {
          title:
            'The floating option will take out the legend from the chart area and make it float above the chart',
          type: Boolean,
          default: false
        },
        fontSize: {
          title: 'Sets the font size of legend text elements',
          type: String,
          default: '14px'
        },
        fontFamily: {
          title: 'Sets the font family of legend text elements',
          type: String,
          default: 'Helvetica, Arial'
        },
        fontWeight: {
          title: 'Sets the font-weight of legend text elements',
          default: 400
        },
        formatter: {
          title:
            'A custom formatter function to append additional text to the legend series names',
          url: 'https://apexcharts.com/docs/options/legend/#formatter',
          default: function(seriesName, opts) {
            return [seriesName, ' - ', opts.w.globals.series[opts.seriesIndex]]
          }
        },
        inverseOrder: {
          title: 'Inverse the placement ordering of the legend items',
          type: Boolean,
          default: false
        },
        width: {
          title: 'Sets the width for legend container',
          type: Number
        },
        height: {
          title: 'Sets the height for legend container',
          type: Number
        },
        tooltipHoverFormatter: {
          title:
            'A formatter function to allow showing data values in the legend while hovering on the chart. This can be useful when you have multiple series, and you don’t want to show tooltips for each series together.',
          url:
            'https://apexcharts.com/docs/options/legend/#tooltipHoverFormatter',
          default: function(seriesName, opts) {
            return (
              seriesName +
              ' - <strong>' +
              opts.w.globals.series[opts.seriesIndex][opts.dataPointIndex] +
              '</strong>'
            )
          }
        },
        offsetX: {
          title: 'Sets the left offset for legend container',
          type: Number,
          default: 0
        },
        offsetY: {
          title: 'Sets the top offset for legend container',
          type: Number,
          default: 0
        },
        labels: {
          type: Object,
          attrs: {
            colors: {
              title:
                'Custom text colors for legend labels. Accepts an array of colors where each index corresponds to the series index.'
            },
            useSeriesColors: {
              title: 'Whether to use primary colors or not',
              type: Boolean,
              default: false
            }
          }
        },
        markers: {
          type: Object,
          attrs: {
            width: {
              title: 'Width of the marker that appears before series name',
              type: Number,
              default: 12
            },
            height: {
              title: 'Height of the marker',
              type: Number,
              default: 12
            },
            strokeWidth: {
              title: 'Stroke size of the marker point',
              type: Number,
              default: 0
            },
            strokeColor: {
              title: 'Stroke color of the marker point',
              type: 'color',
              default: '#fff'
            },
            fillColors: {
              title: 'Fill Colors of the marker point (array of colors)'
            },
            radius: {
              title: 'Border Radius of the marker',
              type: Number,
              default: 12
            },
            customHTML: {
              title: 'Custom HTML element to put in place of marker (function)',
              default: function() {}
            },
            onClick: {
              title: 'Fire an event when legend’s marker is clicked',
              default: function(chart, seriesIndex, opts) {}
            },
            offsetX: {
              title: 'Sets the left offset of the marker',
              type: Number,
              default: 0
            },
            offsetY: {
              title: 'Sets the top offset of the marker',
              type: Number,
              default: 0
            }
          }
        },
        itemMargin: {
          type: Object,
          attrs: {
            horizontal: {
              title: 'Horizontal margin for individual legend item',
              type: Number,
              default: 5
            },
            vertical: {
              title: 'Vertical margin for individual legend item',
              type: Number,
              default: 0
            }
          }
        },
        onItemClick: {
          type: Object,
          attrs: {
            toggleDataSeries: {
              title:
                'When clicked on legend item, it will toggle the visibility of the series in chart.',
              type: Boolean,
              default: true
            }
          }
        },
        onItemHover: {
          type: Object,
          attrs: {
            highlightDataSeries: {
              title:
                'When hovered on legend item, it will highlight the paths of the hovered series in chart.',
              type: Boolean,
              default: true
            }
          }
        }
      }
    },
    markers: {
      type: Object,
      attrs: {
        size: {
          title: 'Size of the marker point',
          url: 'https://apexcharts.com/docs/options/markers/#markerSize',
          type: Number,
          default: 0
        },
        colors: {
          title:
            'Sets the fill color(s) of the marker point. Accepts a single color or an array of colors in a multi-series chart.',
          type: 'color'
        },
        strokeColors: {
          title:
            'Stroke Color of the marker. Accepts a single color or an array of colors in a multi-series chart.',
          type: 'color',
          default: '#fff'
        },
        strokeWidth: {
          title: 'Stroke Size of the marker',
          type: Number,
          default: 2
        },
        strokeOpacity: {
          title: 'Opacity of the border around marker',
          type: Number,
          default: 0.9
        },
        strokeDashArray: {
          title:
            'Dashes in the border around marker. Higher number creates more space between dashes in the border.',
          type: Number,
          default: 0
        },
        fillOpacity: {
          title: 'Opacity of the marker fill color',
          type: Number,
          default: 1
        },
        discrete: {
          title:
            'Allows you to target individual data-points and style particular marker differently',
          default: []
        },
        shape: {
          title: 'Shape of the marker',
          type: String,
          choices: ['circle', 'square'],
          default: 'circle'
        },
        radius: {
          title: 'Radius of the marker (applies to square shape)',
          type: Number,
          default: 2
        },
        offsetX: {
          title: 'Sets the left offset of the marker',
          type: Number,
          default: 0
        },
        offsetY: {
          title: 'Sets the top offset of the marker',
          type: Number,
          default: 0
        },
        onClick: {
          title: 'Called when a marker is clicked',
          url: 'https://apexcharts.com/docs/options/markers/#markerOnClick',
          default: function(e) {}
        },
        onDblClick: {
          title: 'Called when a marker is double clicked',
          url: 'https://apexcharts.com/docs/options/markers/#markerOnDblClick',
          default: function(e) {}
        },
        showNullDataPoints: {
          title:
            'Whether to show markers for null values in a line/area chart. If disabled, any null values present in line/area charts will not be visible.',
          type: Boolean,
          default: true
        },
        hover: {
          type: Object,
          attrs: {
            size: {
              title: 'Fixed size of the marker when it is active',
              type: Number
            },
            sizeOffset: {
              title:
                'Unlike the fixed size, this option takes the original `markers.size` and increases/decreases the value based on it. So, if `markers.size: 6`, `markers.hover.sizeOffset: 3` will make the marker’s size `9` when hovered.',
              type: Number,
              default: 3
            }
          }
        }
      }
    },
    noData: {
      type: Object,
      attrs: {
        text: {
          title: 'The text to display when no-data is available',
          type: String
        },
        align: {
          type: String,
          choices: ['left', 'center', 'right'],
          default: 'center'
        },
        verticalAlign: {
          type: String,
          choices: ['top', 'middle', 'bottom'],
          default: 'middle'
        },
        offsetX: {
          title: 'Text offset from left',
          type: Number,
          default: 0
        },
        offsetY: {
          title: 'Text offset from top',
          type: Number,
          default: 0
        },
        style: {
          type: Object,
          attrs: {
            color: {
              title: 'Fore color of the text',
              type: 'color'
            },
            fontSize: {
              title: 'Font size of the text',
              type: String,
              default: '14px'
            },
            fontFamily: {
              title: 'Font family of the text',
              type: String
            }
          }
        }
      }
    },
    plotOptions: {
      type: Object,
      attrs: {
        area: {
          type: Object,
          attrs: {
            fillTo: {
              title:
                'When negative values are present in the area chart, this option fill the area either from 0 (origin) or from the end of the chart as illustrated below',
              type: String,
              choices: ['origin', 'end'],
              default: 'origin'
            }
          }
        },
        bar: {
          type: Object,
          attrs: {
            horizontal: {
              title:
                'This option will turn a column chart into a horiontal bar chart',
              type: Boolean,
              default: false
            },
            // startingShape: {
            //   type: String,
            //   choices: ['flat', 'rounded'],
            //   default: 'flat',
            // },
            // endingShape: {
            //   type: String,
            //   choices: ['flat', 'rounded'],
            //   default: 'flat',
            // },
            borderRadius: {
              type: Number,
              default: 0,
              title: 'Border Radius of bars/columns'
            },
            columnWidth: {
              title:
                "In column charts, columnWidth is the percentage of the available width in the grid-rect. Accepts '0%' to '100%'.",
              type: String,
              default: '70%'
            },
            barHeight: {
              title:
                "In horizontal bar charts, barHeight is the percentage of the available height in the grid-rect. Accepts '0%' to '100%'.",
              type: String,
              default: '70%'
            },
            distributed: {
              title:
                'Turn this option to make the bars discrete. Each value indicates one bar per series.',
              type: Boolean,
              default: false
            },
            rangeBarOverlap: {
              title:
                'In a rangeBar/timeline chart, the bars should overlap over each other instead of stacking if this option is enabled',
              type: Boolean,
              default: true
            },
            rangeBarGroupRows: {
              title:
                'In a multi-series rangeBar/timeline chart, group rows (horizontal bars) together instead of stacking up. Helpful when there are no overlapping rows but distinct values.',
              type: Boolean,
              default: false
            },
            colors: {
              type: Object,
              attrs: {
                ranges: {
                  type: Array,
                  item: {
                    type: Object,
                    attrs: {
                      from: {
                        title: 'Value indicating range’s upper limit',
                        type: Number,
                        default: 0
                      },
                      to: {
                        title: 'Value indicating range’s lower limit',
                        type: Number,
                        default: 0
                      },
                      color: {
                        title: 'Color to fill the range with',
                        type: 'color'
                      }
                    }
                  }
                },
                backgroundBarColors: {
                  title:
                    'Custom colors for background rects. The number of colors in the array is repeated if less colors than data-points are specified.',
                  default: []
                },
                backgroundBarOpacity: {
                  title: 'Opacity for background colors of the bar',
                  type: Number,
                  default: 1
                },
                backgroundBarRadius: {
                  title: 'Border radius for background rect of the bar',
                  type: Number,
                  default: 0
                }
              }
            },
            dataLabels: {
              type: Object,
              attrs: {
                position: {
                  type: String,
                  choices: ['top', 'center', 'bottom'],
                  default: 'top'
                },
                maxItems: {
                  title:
                    'Maximum limit of data-labels that can be displayed on a bar chart. If data-points exceed this number, data-labels won’t be shown.',
                  type: Number,
                  default: 100
                },
                hideOverflowingLabels: {
                  title:
                    'When there are values that are very close to one another, this property prevents it by hiding overlapping labels. Note: This affects only stacked charts',
                  type: Boolean,
                  default: true
                },
                orientation: {
                  type: String,
                  choices: ['horizontal', 'vertical'],
                  default: 'horizontal'
                }
              }
            }
          }
        },
        bubble: {
          type: Object,
          attrs: {
            minBubbleRadius: {
              title:
                'Minimum radius size of a bubble. If a bubble value is too small to be displayed, this size will be used.',
              type: Number
            },
            maxBubbleRadius: {
              title:
                'Maximum radius size of a bubble. If a bubble value is too large to cover the chart, this size will be used.',
              type: Number
            }
          }
        },
        candlestick: {
          type: Object,
          attrs: {
            colors: {
              type: Object,
              attrs: {
                upward: {
                  title:
                    'Color for the upward candle when the value/price closed above where it opened. Usually, a green color is used for this upward candle.',
                  type: 'color',
                  default: '#00B746'
                },
                downward: {
                  title:
                    'Color for the downward candle when the value/price closed below where it opened. Usually, a red color is used for this downward candle.',
                  type: 'color',
                  default: '#EF403C'
                }
              }
            },
            wick: {
              type: Object,
              attrs: {
                useFillColor: {
                  title:
                    'Use the same fill color for the wick. If this is false, the color of the wick falls back to the `stroke`.',
                  type: Boolean,
                  default: true
                }
              }
            }
          }
        },
        heatmap: {
          type: Object,
          attrs: {
            radius: {
              title: 'Radius of the rectangle inside heatmap',
              type: Number,
              default: 2
            },
            enableShades: {
              title: 'Enable different shades of color depending on the value',
              type: Boolean,
              default: true
            },
            shadeIntensity: {
              title:
                'The intensity of the shades generated for each value. Accepts from `0` to `1`.',
              type: Number,
              default: 0.5
            },
            reverseNegativeShade: {
              title:
                'When enabled, it will reverse the shades for negatives but keep the positive shades as it is now. An example of such use-case would be in a profit/loss chart where darker reds mean larger losses, darker greens mean larger gains.',
              type: Boolean,
              default: true
            },
            distributed: {
              title:
                'When turned on, each row in a heatmap will have it’s own lowest and highest range and colors will be shaded for each series. Default value is turned off.',
              type: Boolean,
              default: false
            },
            useFillColorAsStroke: {
              title:
                'If turned on, the stroke/border around the heatmap cell has the same color as the cell color',
              type: Boolean,
              default: false
            },
            colorScale: {
              type: Object,
              attrs: {
                ranges: {
                  type: Array,
                  item: {
                    type: Object,
                    attrs: {
                      from: {
                        title: 'Value indicating range’s upper limit',
                        type: Number,
                        default: 0
                      },
                      to: {
                        title: 'Value indicating range’s lower limit',
                        type: Number,
                        default: 0
                      },
                      color: {
                        title: 'Background color to fill the range with',
                        type: 'color'
                      },
                      foreColor: {
                        title:
                          'Fore Color of the text if data-labels is enabled',
                        type: 'color'
                      },
                      name: {
                        title:
                          'If a name is provided, it will be used in the legend. If it is not provided, the text falls back to `{from} - {to}`',
                        type: String
                      }
                    }
                  }
                },
                inverse: {
                  title:
                    'In a multiple series heatmap, flip the color-scale to fill the heatmaps vertically instead of horizontally',
                  type: Boolean,
                  default: false
                },
                min: {
                  title:
                    'Specify the lower range for heatmap color calculation',
                  type: Number
                },
                max: {
                  title:
                    'Specify the higher range for heatmap color calculation',
                  type: Number
                }
              }
            }
          }
        },
        treemap: {
          type: Object,
          attrs: {
            enableShades: {
              title: 'Enable different shades of color depending on the value',
              type: Boolean,
              default: true
            },
            shadeIntensity: {
              title:
                'The intensity of the shades generated for each value. Accepts from `0` to `1`.',
              type: Number,
              default: 0.5
            },
            reverseNegativeShade: {
              title:
                'When enabled, it will reverse the shades for negatives but keep the positive shades as it is now. An example of such use-case would be in a profit/loss chart where darker reds mean larger losses, darker greens mean larger gains.',
              type: Boolean,
              default: true
            },
            distributed: {
              title:
                'When turned on, each series in a treemap will have it’s own lowest and highest range and colors will be shaded for each series',
              type: Boolean,
              default: false
            },
            useFillColorAsStroke: {
              title:
                'When turned on, the stroke/border around the treemap cell has the same color as the cell color',
              type: Boolean,
              default: false
            },
            colorScale: {
              type: Object,
              attrs: {
                ranges: {
                  type: Array,
                  item: {
                    from: {
                      title: 'Value indicating range’s upper limit',
                      type: Number,
                      default: 0
                    },
                    to: {
                      title: 'Value indicating range’s lower limit',
                      type: Number,
                      default: 0
                    },
                    color: {
                      title: 'Background color to fill the range with',
                      type: 'color'
                    },
                    foreColor: {
                      title: 'Fore Color of the text if data-labels is enabled',
                      type: 'color'
                    },
                    name: {
                      type: String
                    }
                  }
                },
                inverse: {
                  title:
                    'In a multiple series treemap, flip the color-scale to fill the treemaps vertically instead of horizontally',
                  type: Boolean,
                  default: false
                },
                min: {
                  title:
                    'Specify the lower range for treemap color calculation',
                  type: Number
                },
                max: {
                  title:
                    'Specify the higher range for treemap color calculation',
                  type: Number
                }
              }
            }
          }
        },
        pie: {
          type: Object,
          attrs: {
            startAngle: {
              title:
                'A custom angle from which the pie/donut slices should start',
              type: Number,
              default: 0
            },
            expandOnClick: {
              title:
                'When clicked on the pie/donut slice, expand the slice to make it distinguished visually',
              type: Boolean,
              default: true
            },
            offsetX: {
              title: 'Sets the left offset of the whole pie area',
              type: Number,
              default: 0
            },
            offsetY: {
              title: 'Sets the top offset of the whole pie area',
              type: Number,
              default: 0
            },
            customScale: {
              title:
                'Transform the scale of whole pie/donut overriding the default calculations. Try variations like 0.5 and 1.5 to see how it scales based on the default width/height of the pie.',
              type: Number,
              default: 1
            },
            dataLabels: {
              title:
                ' All additional formatting/styling settings for dataLabels has to be done in dataLabels configuration',
              type: Object,
              attrs: {
                offset: {
                  title:
                    'Offset by which labels will move outside/inside of the donut area',
                  type: Number,
                  default: 0
                },
                minAngleToShowLabel: {
                  title:
                    'Minimum angle to allow data-labels to show. If the slice angle is less than this number, the label would not show to prevent overlapping issues.',
                  type: Number,
                  default: 10
                }
              }
            },
            donut: {
              type: Object,
              attrs: {
                size: {
                  title:
                    'Donut/ring size in percentage relative to the total pie area',
                  type: String,
                  default: '65%'
                },
                background: {
                  title: 'The background color of the pie',
                  type: String,
                  default: 'transparent'
                },
                labels: {
                  type: Object,
                  attrs: {
                    show: {
                      title: 'Whether to display inner labels or not',
                      type: Boolean,
                      default: false
                    },
                    name: {
                      type: Object,
                      attrs: {
                        show: {
                          title:
                            'Show the name of the respective bar associated with it’s value',
                          type: Boolean,
                          default: true
                        },
                        fontSize: {
                          title: 'FontSize of the name in donut’s label',
                          type: String,
                          default: '22px'
                        },
                        fontFamily: {
                          title: 'FontFamily of the name in donut’s label',
                          type: String,
                          default: 'Helvetica, Arial, sans-serif'
                        },
                        fontWeight: {
                          title: 'Font-weight of the name in dataLabel',
                          default: 600
                        },
                        color: {
                          title: 'Color of the name in the donut’s label',
                          type: 'color'
                        },
                        offsetY: {
                          title: 'Sets the top offset for name',
                          type: Number,
                          default: -10
                        },
                        formatter: {
                          title:
                            'A custom formatter function to apply on the name text in dataLabel',
                          default: function(val) {
                            return val
                          }
                        }
                      }
                    },
                    value: {
                      type: Object,
                      attrs: {
                        show: {
                          title:
                            'Show the value label associated with the name label',
                          type: Boolean,
                          default: true
                        },
                        fontSize: {
                          title: 'FontSize of the value label',
                          type: String,
                          default: '16px'
                        },
                        fontFamily: {
                          title: 'FontFamily of the value label',
                          type: String,
                          default: 'Helvetica, Arial, sans-serif'
                        },
                        fontWeight: {
                          title: 'Font weight of the value label in dataLabel',
                          default: 400
                        },
                        color: {
                          title: 'Color of the value label in dataLabel',
                          type: 'color'
                        },
                        offsetY: {
                          title: 'Sets the top offset for value label',
                          type: Number,
                          default: 16
                        },
                        formatter: {
                          title:
                            'A custom formatter function to apply on the value label in dataLabel',
                          default: function(val) {
                            return val
                          }
                        }
                      }
                    },
                    total: {
                      type: Object,
                      attrs: {
                        show: {
                          title:
                            'Show the total of all the series in the inner area of radialBar',
                          type: Boolean,
                          default: false
                        },
                        showAlways: {
                          title:
                            'Always show the total label and do not remove it even when user clicks/hovers over the slices',
                          type: Boolean,
                          default: false
                        },
                        label: {
                          title: 'Label for “total”',
                          type: String,
                          default: 'Total'
                        },
                        fontSize: {
                          title: 'FontSize of the total label',
                          type: String,
                          default: '22px'
                        },
                        fontFamily: {
                          title: 'FontFamily of the total label',
                          type: String,
                          default: 'Helvetica, Arial, sans-serif'
                        },
                        fontWeight: {
                          title: 'font-weight of the total label in dataLabel',
                          default: 600
                        },
                        color: {
                          title: 'Color of the total label',
                          type: 'color',
                          default: '#373d3f'
                        },
                        formatter: {
                          title:
                            'A custom formatter function to apply on the total value. It accepts one parameter `w` which contains the chart’s config and global objects. Defaults to a total of all series percentage divided by the length of series.',
                          default: function(w) {
                            return w.globals.seriesTotals.reduce(
                              (a, b) => a + b,
                              0
                            )
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        polarArea: {
          type: Object,
          attrs: {
            polygons: {
              type: Object,
              attrs: {
                strokeColor: {
                  title: 'The line/border color of the rings of the chart',
                  type: 'color',
                  default: '#e8e8e8'
                },
                strokeWidth: {
                  title: 'Border width of the rings of polarArea chart',
                  type: Number,
                  default: 1
                }
              }
            }
          }
        },
        radar: {
          type: Object,
          attrs: {
            size: {
              title:
                'A custom size for the inner radar. The default size calculation will be overridden with this.',
              type: Number
            },
            offsetX: {
              title: 'Sets the left offset of the radar',
              type: Number,
              default: 0
            },
            offsetY: {
              title: 'Sets the top offset of the radar',
              type: Number,
              default: 0
            },
            polygons: {
              type: Object,
              attrs: {
                strokeColors: {
                  title:
                    "The line/border color of the spokes of the chart excluding the connector lines. If you want to pass more than 1 color, you can pass an array instead of a String. `strokeColors: '#e8e8e8'` and `strokeColors: ['#e8e8e8', '#f1f1f1']` both are valid.",
                  type: 'color',
                  default: '#e8e8e8'
                },
                strokeWidth: {
                  title: 'Border width of the spokes of radar chart',
                  type: Number,
                  default: 1
                },
                connectorColors: {
                  title:
                    "The line color of the connector lines of the polygons. If you want to pass more than 1 color, you can pass an array instead of a String. `connectorColors: '#e8e8e8'` and `connectorColors: ['#e8e8e8', '#f1f1f1']` both are valid.",
                  type: 'color',
                  default: '#e8e8e8'
                },
                fill: {
                  type: Object,
                  attrs: {
                    colors: {
                      title:
                        'The polygons can be filled with a custom color. If you provide 2 colors, the colors will be repeated for the rest of the polygons.'
                    }
                  }
                }
              }
            }
          }
        },
        radialBar: {
          type: Object,
          attrs: {
            inverseOrder: {
              title:
                'Whether to make the first value of series innermost or outermost',
              type: Boolean,
              default: false
            },
            startAngle: {
              title: 'Angle from which the radialBars should start',
              type: Number,
              default: 0
            },
            endAngle: {
              title:
                'Angle to which the radialBars should end. The sum of the startAngle and endAngle should not exceed 360.',
              type: Number,
              default: 360
            },
            offsetX: {
              title: 'Sets the left offset for radialBars',
              type: Number,
              default: 0
            },
            offsetY: {
              title: 'Sets the top offset for radialBars',
              type: Number,
              default: 0
            },
            hollow: {
              type: Object,
              attrs: {
                margin: {
                  title:
                    'Spacing which will be subtracted from the available hollow size',
                  type: Number,
                  default: 5
                },
                size: {
                  title:
                    'Size in percentage relative to the total available size of chart',
                  type: String,
                  default: '50%'
                },
                background: {
                  title:
                    'Background color for the hollow part of the radialBars',
                  type: String,
                  default: 'transparent'
                },
                image: {
                  title:
                    'Optional image URL which can be displayed in the hollow area',
                  type: String
                },
                imageWidth: {
                  title: 'Width of the hollow image',
                  type: Number,
                  default: 150
                },
                imageHeight: {
                  title: 'Height of the hollow image',
                  type: Number,
                  default: 150
                },
                imageOffsetX: {
                  title: 'Sets the left offset of hollow image',
                  type: Number,
                  default: 0
                },
                imageOffsetY: {
                  title: 'Sets the top offset of hollow image',
                  type: Number,
                  default: 0
                },
                imageClipped: {
                  title:
                    'If true, the image doesn’t exceeds the hollow area and is contained within',
                  type: Boolean,
                  default: true
                },
                position: {
                  type: String,
                  choices: ['front', 'back'],
                  default: 'front'
                },
                dropShadow: {
                  type: Object,
                  attrs: {
                    enabled: {
                      title: 'Enable a dropshadow for paths of the SVG',
                      type: Boolean,
                      default: false
                    },
                    top: {
                      title: 'Set top offset for shadow',
                      type: Number,
                      default: 0
                    },
                    left: {
                      title: 'Set left offset for shadow',
                      type: Number,
                      default: 0
                    },
                    blur: {
                      title: 'Set blur distance for shadow',
                      type: Number,
                      default: 3
                    },
                    opacity: {
                      title: 'Set the opacity of shadow',
                      type: Number,
                      default: 0.5
                    }
                  }
                }
              }
            },
            track: {
              type: Object,
              attrs: {
                show: {
                  title: 'Show track under the bar lines',
                  type: Boolean,
                  default: true
                },
                startAngle: {
                  title: 'Angle from which the track should start',
                  type: Number
                },
                endAngle: {
                  title: 'Angle to which the track should end',
                  type: Number
                },
                background: {
                  title:
                    'Color of the track. If you want different color for each track, you can pass an array of colors.',
                  type: 'color',
                  default: '#f2f2f2'
                },
                strokeWidth: {
                  title: 'Width of the track',
                  type: String,
                  default: '97%'
                },
                opacity: {
                  title: 'Opacity of the track',
                  type: Number,
                  default: 1
                },
                margin: {
                  title: 'Spacing between each track',
                  type: Number,
                  default: 5
                },
                dropshadow: {
                  type: Object,
                  attrs: {
                    enabled: {
                      title: 'Enable a dropshadow for paths of the SVG',
                      type: Boolean,
                      default: false
                    },
                    top: {
                      title: 'Set top offset for shadow',
                      type: Number,
                      default: 0
                    },
                    left: {
                      title: 'Set left offset for shadow',
                      type: Number,
                      default: 0
                    },
                    blur: {
                      title: 'Set blur distance for shadow',
                      type: Number,
                      default: 3
                    },
                    opacity: {
                      title: 'Set the opacity of shadow',
                      type: Number,
                      default: 0.5
                    }
                  }
                }
              }
            },
            dataLabels: {
              type: Object,
              attrs: {
                show: {
                  title: 'Whether to display labels inside radialBars or not',
                  type: Boolean,
                  default: true
                },
                name: {
                  type: Object,
                  attrs: {
                    show: {
                      title:
                        'Show the name of the respective bar associated with it’s value',
                      type: Boolean,
                      default: true
                    },
                    fontSize: {
                      title: 'FontSize of the name in dataLabel',
                      type: String,
                      default: '16px'
                    },
                    fontFamily: {
                      title: 'FontFamily of the name in dataLabel',
                      type: String
                    },
                    fontWeight: {
                      title: 'Font-weight of the name in dataLabel',
                      default: 600
                    },
                    color: {
                      title: 'Color of the name in dataLabel',
                      type: 'color'
                    },
                    offsetY: {
                      title: 'Sets the top offset for name',
                      type: Number,
                      default: -10
                    }
                  }
                },
                value: {
                  type: Object,
                  attrs: {
                    show: {
                      title:
                        'Show the value label associated with the name label',
                      type: Boolean,
                      default: true
                    },
                    fontSize: {
                      title: 'FontSize of the value label in dataLabel',
                      type: String,
                      default: '14px'
                    },
                    fontFamily: {
                      title: 'fontFamily of the value label in dataLabel',
                      type: String
                    },
                    fontWeight: {
                      title: 'Font weight of the value label in dataLabel',
                      default: 400
                    },
                    color: {
                      title: 'Color of the value label in dataLabel',
                      type: 'color'
                    },
                    offsetY: {
                      title: 'Sets the top offset for value label',
                      type: Number,
                      default: 16
                    },
                    formatter: {
                      title:
                        'A custom formatter function to apply on the value label in dataLabel',
                      default: function(val) {
                        return val + '%'
                      }
                    }
                  }
                },
                total: {
                  type: Object,
                  attrs: {
                    show: {
                      title:
                        'Show the total of all the series in the inner area of radialBar',
                      type: Boolean,
                      default: false
                    },
                    label: {
                      title: 'Label for “total”',
                      type: String,
                      default: 'Total'
                    },
                    color: {
                      title: 'Color of the total label',
                      type: 'color',
                      default: '#373d3f'
                    },
                    fontSize: {
                      title: 'Font-size of the total label in dataLabel',
                      type: String,
                      default: '16px'
                    },
                    fontFamily: {
                      title: 'font-family of the total label in dataLabel',
                      type: String
                    },
                    fontWeight: {
                      title: 'font-weight of the total label in dataLabel',
                      default: 600
                    },
                    formatter: {
                      title:
                        'A custom formatter function to apply on the total value. It accepts one parameter w which contains the chart’s config and global objects. Defaults to a total of all series percentage divided by the length of series.',
                      default: function(w) {
                        return (
                          w.globals.seriesTotals.reduce((a, b) => {
                            return a + b
                          }, 0) /
                            w.globals.series.length +
                          '%'
                        )
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    responsive: {
      type: Array,
      item: {
        type: Object,
        attrs: {
          breakpoint: {
            title:
              'The breakpoint is the max screen width at which the original config object will be overridden by the responsive config object',
            type: Number
          },
          options: {
            title:
              'The new configuration object that you would like to override on the existing default configuration object. All the options which you set normally can be set here.',
            url: 'https://codepen.io/apexcharts/pen/ajpqJp'
          }
        }
      }
    },
    series: {
      title:
        'Accepts an array of [name, data] object for axis charts or an array of values for non-axis (pie/donut) charts',
      url: 'https://apexcharts.com/docs/series/'
    },
    states: {
      type: Object,
      attrs: {
        normal: {
          type: Object,
          attrs: {
            filter: {
              type: Object,
              attrs: {
                type: {
                  title: 'The filter function to apply on normal state',
                  type: String,
                  choices: ['none', 'lighten', 'darken'],
                  default: 'none'
                },
                value: {
                  title:
                    'A larger value intensifies the filter effect. Accepts values between `0` and `1`.',
                  type: Number,
                  default: 0
                }
              }
            }
          }
        },
        hover: {
          type: Object,
          attrs: {
            filter: {
              type: Object,
              attrs: {
                type: {
                  title: 'The filter function to apply on hover state',
                  type: String,
                  choices: ['none', 'lighten', 'darken'],
                  default: 'lighten'
                },
                value: {
                  title:
                    'A larger value intensifies the filter effect. Accepts values between `0` and `1`.',
                  type: Number,
                  default: 0.15
                }
              }
            }
          }
        },
        active: {
          type: Object,
          attrs: {
            allowMultipleDataPointsSelection: {
              title:
                'Whether to allow selection of multiple datapoints and give them active state or allow one dataPoint selection at a time',
              type: Boolean,
              default: false
            },
            filter: {
              type: Object,
              attrs: {
                type: {
                  title: 'The filter function to apply on active state',
                  type: String,
                  choices: ['none', 'lighten', 'darken'],
                  default: 'darken'
                },
                value: {
                  title:
                    'A larger value intensifies the filter effect. Accepts values between `0` and `1`.',
                  type: Number,
                  default: 0.35
                }
              }
            }
          }
        }
      }
    },
    stroke: {
      type: Object,
      attrs: {
        show: {
          title: 'To show or hide path-stroke / line',
          type: Boolean,
          default: true
        },
        curve: {
          title:
            'In line/area charts, whether to draw smooth lines or straight lines',
          url: 'https://apexcharts.com/docs/options/stroke/#curve',
          type: String,
          choices: ['smooth', 'straight', 'stepline'],
          default: 'smooth'
        },
        lineCap: {
          title: 'For setting the starting and ending points of stroke',
          url: 'https://apexcharts.com/docs/options/stroke/#lineCap',
          type: String,
          choices: ['butt', 'square', 'round'],
          default: 'butt'
        },
        colors: {
          title: 'Colors to fill the border for paths'
        },
        width: {
          title: 'Sets the width of border for svg path',
          type: Number,
          default: 2
        },
        dashArray: {
          title:
            'Creates dashes in borders of svg path. Higher number creates more space between dashes in the border.',
          type: Number,
          default: 0
        }
      }
    },
    subtitle: {
      type: Object,
      attrs: {
        text: {
          title: 'Text to display as a subtitle of chart',
          type: String
        },
        align: {
          title: 'Alignment of subtitle relative to chart area',
          type: String,
          choices: ['left', 'center', 'right'],
          default: 'left'
        },
        margin: {
          title: 'Vertical spacing around the subtitle text',
          type: Number,
          default: 10
        },
        offsetX: {
          title: 'Sets the left offset for subtitle text',
          type: Number,
          default: 0
        },
        offsetY: {
          title: 'Sets the top offset for subtitle text',
          type: Number,
          default: 0
        },
        floating: {
          title:
            'The floating option will take out the subtitle text from the chart area and make it float on top of the chart',
          type: Boolean,
          default: false
        },
        style: {
          type: Object,
          attrs: {
            fontSize: {
              title: 'Font size of the subtitle text',
              type: String,
              default: '12px'
            },
            fontWeight: {
              title: 'Font Weight of the subtitle text',
              type: String,
              default: 'normal'
            },
            fontFamily: {
              title: 'Font Family of the subtitle text',
              type: String
            },
            color: {
              title: 'Fore color of the subtitle text',
              type: 'color',
              default: '#9699a2'
            }
          }
        }
      }
    },
    theme: {
      type: Object,
      attrs: {
        mode: {
          title:
            'Changing it will also update the text and background colors of the chart',
          type: String,
          choices: ['light', 'dark'],
          default: 'light'
        },
        palette: {
          url: 'https://apexcharts.com/docs/options/theme/#palette',
          type: String,
          choices: [
            'palette1',
            'palette2',
            'palette3',
            'palette4',
            'palette5',
            'palette6',
            'palette7',
            'palette8',
            'palette9',
            'palette10'
          ],
          default: 'palette1'
        },
        monochrome: {
          title:
            'Single color is used as a base and shades are generated from that color',
          type: Object,
          attrs: {
            enabled: {
              title: 'Whether to enable monochrome theme option',
              type: Boolean,
              default: false
            },
            color: {
              title:
                'A hex color which will be used as the base color for generating shades',
              type: 'color',
              default: '#255aee'
            },
            shadeTo: {
              type: String,
              choices: ['light', 'dark'],
              default: 'light'
            },
            shadeIntensity: {
              title:
                'What should be the intensity while generating shades Accepts from `0` to `1`.',
              type: Number,
              default: 0.65
            }
          }
        }
      }
    },
    title: {
      type: Object,
      attrs: {
        text: {
          title: 'Text to display as a title of chart',
          type: String
        },
        align: {
          title: 'Alignment of title relative to chart area',
          type: String,
          choices: ['left', 'center', 'right'],
          default: 'left'
        },
        margin: {
          title: 'Vertical spacing around the title text',
          type: Number,
          default: 10
        },
        offsetX: {
          title: 'Sets the left offset for title text',
          type: Number,
          default: 0
        },
        offsetY: {
          title: 'Sets the top offset for title text',
          type: Number,
          default: 0
        },
        name: {
          title:
            'The floating option will take out the title text from the chart area and make it float on top of the chart',
          type: Boolean,
          default: false
        },
        style: {
          type: Object,
          attrs: {
            fontSize: {
              title: 'Font size of the title text',
              type: String,
              default: '14px'
            },
            fontWeight: {
              title: 'Font weight of the title text',
              type: String,
              default: 'bold'
            },
            fontFamily: {
              title: 'Font family of the title text',
              type: String
            },
            color: {
              title: 'Fore color of the title text',
              type: 'color',
              default: '#263238'
            }
          }
        }
      }
    },
    tooltip: {
      type: Object,
      attrs: {
        enabled: {
          title: 'Show tooltip when user hovers over chart area',
          type: Boolean,
          default: true
        },
        enabledOnSeries: {
          title:
            'Show tooltip only on certain series in a multi-series chart. Provide indices of those series which you would like to be shown.'
        },
        shared: {
          title: 'When having multiple series, show a shared tooltip',
          url: 'https://apexcharts.com/docs/options/tooltip/#shared',
          type: Boolean,
          default: true
        },
        followCursor: {
          title:
            'Follow user’s cursor position instead of putting tooltip on actual data points',
          type: Boolean,
          default: false
        },
        intersect: {
          title: 'Show tooltip only when user hovers exactly over datapoint',
          type: Boolean,
          default: false
        },
        inverseOrder: {
          title:
            'In multiple series, when having shared tooltip, inverse the order of series (for better comparison in stacked charts)',
          type: Boolean,
          default: false
        },
        custom: {
          title:
            'Draw a custom html tooltip instead of the default one based on the values provided in the function arguments',
          url: 'https://apexcharts.com/docs/options/tooltip/#custom'
        },
        fillSeriesColor: {
          title:
            'When enabled, fill the tooltip background with the corresponding series color',
          type: Boolean,
          default: false
        },
        theme: {
          url: 'https://apexcharts.com/docs/options/tooltip/#theme',
          type: String,
          choices: ['light', 'dark']
          // default: false, // BUG: fix it
        },
        style: {
          title: '',
          type: Object,
          attrs: {
            fontFamily: {
              title: 'Font family to apply on tooltip texts',
              type: String
            },
            fontSize: {
              title: 'Font size to apply on tooltip texts',
              type: String,
              default: '12px'
            }
          }
        },
        onDatasetHover: {
          type: Object,
          attrs: {
            highlightDataSeries: {
              title:
                'When user hovers over a datapoint of a particular series, other series will be grayed out making the current series highlight',
              type: Boolean,
              default: false
            }
          }
        },
        x: {
          type: Object,
          attrs: {
            show: {
              title:
                'Whether to show the tooltip title (x-axis values) on tooltip or not',
              type: Boolean,
              default: true
            },
            format: {
              title: 'The format of the x-axis value to show on the tooltip',
              url: 'https://apexcharts.com/docs/datetime/',
              type: String,
              default: 'dd MMM'
            },
            formatter: {
              title:
                'A custom formatter function which you can override and display according to your needs (a use case can be a date formatted using complex moment.js functions)'
            }
          }
        },
        y: {
          title:
            'In a multiple series, the tooltip.y property can accept array to target formatters of different series scales',
          type: Object, // BUG: can also be an array
          attrs: {
            formatter: {
              title:
                'To format the Y-axis values of tooltip, you can define a custom formatter function. By default, these values will be formatted according `yaxis.labels.formatter` function which will be overrided by this function if you define it.',
              default: function(
                value,
                { series, seriesIndex, dataPointIndex, w }
              ) {
                return value
              }
            },
            title: {
              type: Object,
              attrs: {
                formatter: {
                  title:
                    'The series name which appears besides values can be formatted using this function',
                  default: function(seriesName) {
                    return seriesName
                  }
                }
              }
            }
          }
        },
        z: {
          type: Object,
          attrs: {
            formatter: {
              title:
                'To format the z values of a Bubble series, you can use this function'
            },
            title: {
              title: 'A custom text for the z values of Bubble Series',
              type: String,
              default: 'Size: '
            }
          }
        },
        marker: {
          type: Object,
          attrs: {
            show: {
              title:
                'Whether to show the color coded marker shape in front of Series Name which helps to identify series in multiple datasets',
              type: Boolean,
              default: true
            }
          }
        },
        items: {
          type: Object,
          attrs: {
            display: {
              title: 'The css property of each tooltip item container',
              type: String,
              default: 'flex'
            }
          }
        },
        fixed: {
          type: Object,
          attrs: {
            enabled: {
              title: 'Set the tooltip to a fixed position',
              type: Boolean,
              default: false
            },
            position: {
              title:
                'When having a fixed tooltip, select a predefined position',
              type: String,
              choices: ['topLeft', 'topRight', 'bottomLeft', 'bottomRight'],
              default: 'topRight'
            },
            offsetX: {
              title:
                'Sets the left offset for the tooltip container in fixed position',
              type: Number,
              default: 0
            },
            offsetY: {
              title:
                'Sets the top offset for the tooltip container in fixed position',
              type: Number,
              default: 0
            }
          }
        }
      }
    },
    xaxis: {
      type: Object,
      attrs: {
        type: {
          type: String,
          choices: ['category', 'datetime', 'numeric'],
          default: 'category'
        },
        categories: {
          title: 'Categories are labels which are displayed on the x-axis',
          default: []
        },
        labels: {
          type: Object,
          attrs: {
            show: {
              title: 'Show labels on x-axis',
              type: Boolean,
              default: true
            },
            rotate: {
              title: 'Rotate angle for the x-axis labels',
              type: Number,
              default: -45
            },
            rotateAlways: {
              title:
                'Whether to rotate the labels always or to rotate only when the texts doesn’t fits the available width',
              type: Boolean,
              default: false
            },
            hideOverlappingLabels: {
              title:
                'When labels are too close and starts to overlap on one another, this option prevents overlapping of the labels',
              type: Boolean,
              default: true
            },
            showDuplicates: {
              title:
                'By default, duplicate labels are not printed to prevent conjusted values in datetime series. If you intentionally want to display same values in x-axis labels, turn on this option.',
              type: Boolean,
              default: false
            },
            trim: {
              title:
                'Append `...` to the text when it can’t fit the available space and rotate is turned off',
              type: Boolean,
              default: false
            },
            minHeight: {
              title: 'Minimum height for the labels',
              type: Number
            },
            maxHeight: {
              title: 'Maximum height for the labels when they are rotated',
              type: Number,
              default: 120
            },
            style: {
              type: Object,
              attrs: {
                colors: {
                  title:
                    'Fore color for the x-axis label. Accepts an array for distributed charts or accepts a single color string.',
                  default: []
                },
                fontSize: {
                  title: 'Font size for the x-axis label',
                  type: String,
                  default: '12px'
                },
                fontFamily: {
                  title: 'Font family for the x-axis label',
                  type: String,
                  default: 'Helvetica, Arial, sans-serif'
                },
                fontWeight: {
                  title: 'Font-weight for the x-axis label',
                  default: 400
                },
                cssClass: {
                  title: ' A custom Css Class to give to the label elements',
                  type: String,
                  default: 'apexcharts-xaxis-label'
                }
              }
            },
            offsetX: {
              title: 'Sets the left offset for label',
              type: Number,
              default: 0
            },
            offsetY: {
              title: 'Sets the top offset for label',
              type: Number,
              default: 0
            },
            format: {
              title: 'Formats the datetime value based on the format specifier',
              url: 'https://apexcharts.com/docs/datetime/',
              type: String
            },
            formatter: {
              title:
                'Overrides everything and applies a custom function for the xaxis value',
              url: 'https://apexcharts.com/docs/options/xaxis/#formatter'
            },
            datetimeUTC: {
              title:
                'When turned on, local datetime is converted into UTC. Turn it off if you supply date with timezone info and want to preserve it.',
              type: Boolean,
              default: true
            },
            datetimeFormatter: {
              title:
                'For the default timescale that is generated automatically based on the datetime difference, the below specifiers are used by default',
              type: Object,
              attrs: {
                year: {
                  title: 'Format specifier for the year',
                  type: String,
                  default: 'yyyy'
                },
                month: {
                  title: 'Format specifier for the month',
                  type: String,
                  default: "MMM 'yy"
                },
                day: {
                  title: 'Format specifier for the day of month',
                  type: String,
                  default: 'dd MMM'
                },
                hour: {
                  title: 'Format specifier for the hour of day',
                  type: String,
                  default: 'HH:mm'
                },
                minute: {
                  title: 'Format specifier for the minute',
                  type: String,
                  default: 'HH:mm:ss'
                },
                second: {
                  title: 'Format specifier for the second',
                  type: String,
                  default: 'HH:mm:ss'
                }
              }
            }
          }
        },
        axisBorder: {
          type: Object,
          attrs: {
            show: {
              title: 'Draw a horizontal border on the x-axis',
              type: Boolean,
              default: true
            },
            color: {
              title: 'Color of the horizontal axis border',
              type: 'color',
              default: '#78909C'
            },
            height: {
              title: 'Sets the border height of the xaxis line',
              type: Number,
              default: 1
            },
            width: {
              title: 'Sets the width of the xaxis line',
              default: '100%'
            },
            offsetX: {
              title: 'Sets the left offset of the axis border',
              type: Number,
              default: 0
            },
            offsetY: {
              title: 'Sets the top offset of the axis border',
              type: Number,
              default: 0
            }
          }
        },
        axisTicks: {
          type: Object,
          attrs: {
            show: {
              title: 'Draw ticks on the x-axis to specify intervals',
              type: Boolean,
              default: true
            },
            borderType: {
              type: String,
              choices: ['solid', 'dotted'],
              default: 'solid'
            },
            color: {
              title: 'Color of the ticks',
              type: 'color',
              default: '#78909C'
            },
            height: {
              title: 'Height of the ticks',
              type: Number,
              default: 6
            },
            offsetX: {
              title: 'Sets the left offset of the ticks',
              type: Number,
              default: 0
            },
            offsetY: {
              title: 'Sets the top offset of the ticks',
              type: Number,
              default: 0
            }
          }
        },
        tickAmount: {
          title: 'Number of Tick Intervals to show',
          url: 'https://apexcharts.com/docs/options/xaxis/#tickAmount',
          type: Number
        },
        tickPlacement: {
          title:
            'Whether to draw the ticks in between the data-points or on the data-points. Note: tickPlacement only works for xaxis.type: category charts and not for datetime charts.',
          type: String,
          choices: ['between', 'on'],
          default: 'between'
        },
        min: {
          title:
            'Lowest number to be set for the x-axis. The graph drawing beyond this number will be clipped off.',
          type: Number
        },
        max: {
          title:
            'Highest number to be set for the x-axis. The graph drawing beyond this number will be clipped off.',
          type: Number
        },
        range: {
          title:
            'Range takes the max value of x-axis, subtracts the provided range value and gets the min value based on that. So, technically it helps to keep the same range when min and max values gets updated dynamically.',
          type: Number
        },
        floating: {
          title:
            'Floating takes x-axis is taken out of normal flow and places x-axis on svg element directly, similar to an absolutely positioned element. Set the offsetX and offsetY then to adjust the position manually.',
          type: Boolean,
          default: false
        },
        position: {
          title: 'Setting this option allows you to change the x-axis position',
          type: String,
          choices: ['bottom', 'top'],
          default: 'bottom'
        },
        title: {
          type: Object,
          attrs: {
            text: {
              title:
                'Give the x-axis a title which will be displayed below the axis labels by default',
              type: String
            },
            offsetX: {
              title: 'Sets the left offset for xaxis title',
              type: Number,
              default: 0
            },
            offsetY: {
              title: 'Sets the top offset for the xaxis title',
              type: Number,
              default: 0
            },
            style: {
              type: Object,
              attrs: {
                color: {
                  title: 'ForeColor of the x-axis title',
                  type: 'color'
                },
                fontSize: {
                  title: 'Font size for the x-axis title',
                  type: String,
                  default: '12px'
                },
                fontFamily: {
                  title: 'Font family for the x-axis title',
                  type: String,
                  default: 'Helvetica, Arial, sans-serif'
                },
                fontWeight: {
                  title: 'Font-weight for the x-axis title',
                  default: 600
                },
                cssClass: {
                  title: 'A custom CSS Class to give to the x-axis title',
                  type: String,
                  default: 'apexcharts-xaxis-title'
                }
              }
            }
          }
        },
        crosshairs: {
          type: Object,
          attrs: {
            show: {
              title:
                'Show crosshairs on x-axis when user moves the mouse over chart area',
              type: Boolean,
              default: true
            },
            width: {
              url: 'https://apexcharts.com/docs/options/xaxis/#crosshairsWidth',
              default: 1
            },
            position: {
              type: String,
              choices: ['back', 'front'],
              default: 'back'
            },
            opacity: {
              title: ' Opacity of the crosshairs',
              type: Number,
              default: 0.9
            },
            stroke: {
              type: Object,
              attrs: {
                color: {
                  title: 'Border color of crosshairs',
                  type: 'color',
                  default: '#b6b6b6'
                },
                width: {
                  title: 'Border width of crosshairs',
                  type: Number,
                  default: 0
                },
                dashArray: {
                  title:
                    'Creates dashes in borders of crosshairs. Higher number creates more space between dashes in the border.',
                  type: Number,
                  default: 0
                }
              }
            },
            fill: {
              type: Object,
              attrs: {
                type: {
                  type: String,
                  choices: ['solid', 'gradient'],
                  default: 'solid'
                },
                color: {
                  title: 'Fill color of crosshairs',
                  type: 'color',
                  default: '#B1B9C4'
                },
                gradient: {
                  type: Object,
                  attrs: {
                    colorFrom: {
                      title: 'Crosshairs Gradient Color from',
                      type: 'color',
                      default: '#D8E3F0'
                    },
                    colorTo: {
                      title: 'Crosshairs Gradient Color to',
                      type: 'color',
                      default: '#BED1E6'
                    },
                    stops: {
                      title:
                        'Stops defines the ramp of colors to use on a gradient',
                      default: [0, 100]
                    },
                    opacityFrom: {
                      title: 'Crosshairs fill opacity from',
                      type: Number,
                      default: 0.4
                    },
                    opacityTo: {
                      title: 'Crosshairs fill opacity to',
                      type: Number,
                      default: 0.5
                    }
                  }
                }
              }
            },
            dropShadow: {
              type: Object,
              attrs: {
                enabled: {
                  title: 'Enable a dropshadow for crosshairs',
                  type: Boolean,
                  default: false
                },
                top: {
                  title: 'Set top offset for shadow',
                  type: Number,
                  default: 0
                },
                left: {
                  title: 'Set left offset for shadow',
                  type: Number,
                  default: 0
                },
                blur: {
                  title: 'Set blur distance for shadow',
                  type: Number,
                  default: 1
                },
                opacity: {
                  title: 'Set the opacity of shadow',
                  type: Number,
                  default: 0.4
                }
              }
            }
          }
        },
        tooltip: {
          type: Object,
          attrs: {
            enabled: {
              title: 'Show tooltip on x-axis or not',
              type: Boolean,
              default: true
            },
            formatter: {
              title:
                'A custom formatter function for the x-axis tooltip label. If undefined, the xaxis tooltip uses the default “X” value used in general tooltip.',
              default: function(val, opts) {}
            },
            offsetY: {
              title: 'Sets the top offset for x-axis tooltip',
              type: Number,
              default: 0
            },
            style: {
              type: Object,
              attrs: {
                fontSize: {
                  title: 'FontSize for the x-axis tooltip text',
                  type: String
                },
                fontFamily: {
                  title: 'FontFamily for the x-axis tooltip text',
                  type: String
                }
              }
            }
          }
        }
      }
    },
    yaxis: {
      type: Object,
      attrs: {
        show: {
          title: 'Whether to display the y-axis or not',
          type: Boolean,
          default: true
        },
        showAlways: {
          title:
            'Whether to hide y-axis when user toggles series through legend',
          type: Boolean,
          default: true
        },
        showForNullSeries: {
          title:
            'When turned off, it will hide the y-axis completely for a series which has no data or a series with all null values',
          type: Boolean,
          default: true
        },
        seriesName: {
          title:
            'In a multiple y-axis chart, you can target the scale of a y-axis to a particular series by referencing through the seriesName. The series item which have the same name property will be used to calculate the scale of the y-axis.',
          type: String
        },
        opposite: {
          title:
            'When enabled, will draw the yaxis on the right side of the chart',
          type: Boolean,
          default: false
        },
        reversed: {
          title:
            'Flip the chart upside down making it inversed and draw y-axis from bigger to smaller numbers',
          type: Boolean,
          default: false
        },
        logarithmic: {
          title: 'A non-linear scale when there is a large range of values',
          type: Boolean,
          default: false
        },
        tickAmount: {
          title: 'Number of tick intervals to show',
          type: Number,
          default: 6
        },
        min: {
          title:
            'Lowest number to be set for the y-axis. The graph drawing beyond this number will be clipped off. You can also pass a function here which should return a number. The function accepts an argument which by default is the smallest value in the y-axis. `function(min) { return min; }`',
          default: 6
        },
        max: {
          title:
            'Highest number to be set for the y-axis. The graph drawing beyond this number will be clipped off. You can also pass a function here which should return a number. The function accepts an argument which by default is the smallest value in the y-axis. `function(max) { return max; }`',
          default: 6
        },
        forceNiceScale: {
          title:
            'If set to `true`, the y-axis scales are forced to generate nice looking rounded numbers even when min/max are provided. Turn this off if you manually set min/max and want it to be unchanged.',
          type: Boolean,
          default: false
        },
        floating: {
          title:
            'Setting this options takes the y-axis out of the plotting area. Much behaves like `position: absolute` property of CSS.',
          type: Boolean,
          default: false
        },
        decimalsInFloat: {
          title:
            'Number of fractions to display when there are floating values in y-axis. Note: If you have defined a custom formatter function in `yaxis.labels.formatter`, this won’t have any effect.',
          type: Number
        },
        labels: {
          type: Object,
          attrs: {
            show: {
              title: 'Show labels on y-axis',
              type: Boolean,
              default: true
            },
            align: {
              type: String,
              choices: ['left', 'center', 'right'],
              default: 'right'
            },
            minWidth: {
              title: 'Minimum width for the y-axis labels',
              type: Number,
              default: 0
            },
            maxWidth: {
              title: 'Maximum width for the y-axis labels',
              type: Number,
              default: 160
            },
            style: {
              type: Object,
              attrs: {
                colors: {
                  title: 'ForeColor for the y-axis label',
                  default: []
                },
                fontSize: {
                  title: 'FontSize for the y-axis label',
                  type: String,
                  default: '12px'
                },
                fontFamily: {
                  title: 'Font-family for the y-axis label',
                  type: String,
                  default: 'Helvetica, Arial, sans-serif'
                },
                fontWeight: {
                  title: 'Font-weight for the y-axis label',
                  default: 400
                },
                cssClass: {
                  title: 'A custom CSS class to give to the label elements',
                  type: String,
                  default: 'apexcharts-yaxis-label'
                }
              }
            },
            offsetX: {
              title: 'Sets the left offset for label',
              type: Number,
              default: 0
            },
            offsetY: {
              title: 'Sets the top offset for label',
              type: Number,
              default: 0
            },
            rotate: {
              title:
                'Rotate y-axis text label to a specific angle from it’s center',
              type: Number,
              default: 0
            },
            formatter: {
              title:
                'Applies a custom function for the yaxis value. Note: In horizontal bar charts, the second parameters also contains additional data like `dataPointIndex` and `seriesIndex`.',
              default: function(value) {
                return val
              }
            }
          }
        },
        axisBorder: {
          type: Object,
          attrs: {
            show: {
              title: 'Draw a vertical border on the y-axis',
              type: Boolean,
              default: true
            },
            color: {
              title: 'Color of the horizontal axis border',
              type: 'color',
              default: '#78909C'
            },
            offsetX: {
              title: 'Sets the left offset of the axis border',
              type: Number,
              default: 0
            },
            offsetY: {
              title: 'Sets the top offset of the axis border',
              type: Number,
              default: 0
            }
          }
        },
        axisTicks: {
          type: Object,
          attrs: {
            show: {
              title: 'Draw ticks on the y-axis to specify intervals',
              type: Boolean,
              default: true
            },
            borderType: {
              type: String,
              choices: ['solid', 'dotted'],
              default: 'solid'
            },
            color: {
              title: ' Color of the ticks',
              type: 'color',
              default: '#78909C'
            },
            width: {
              title: 'Width of the ticks',
              type: Number,
              default: 6
            },
            offsetX: {
              title: 'Sets the left offset of the ticks',
              type: Number,
              default: 0
            },
            offsetY: {
              title: 'Sets the top offset of the ticks',
              type: Number,
              default: 0
            }
          }
        },
        title: {
          type: Object,
          attrs: {
            text: {
              title:
                'Give the y-axis a title which will be displayed below the axis labels by default',
              type: String
            },
            rotate: {
              title: 'Rotate the yaxis title either 90 or -90',
              type: Number,
              default: -90
            },
            offsetX: {
              title: 'Sets the left offset for yaxis title',
              type: Number,
              default: 0
            },
            offsetY: {
              title: 'Sets the top offset for the yaxis title',
              type: Number,
              default: 0
            },
            style: {
              type: Object,
              attrs: {
                color: {
                  title: 'ForeColor of the y-axis title',
                  type: 'color'
                },
                fontSize: {
                  title: 'FontSize for the y-axis title',
                  type: String,
                  default: '12px'
                },
                fontFamily: {
                  title: 'FontFamily for the y-axis title',
                  type: String,
                  default: 'Helvetica, Arial, sans-serif'
                },
                fontWeight: {
                  title: 'Font-weight for the y-axis title',
                  default: 600
                },
                cssClass: {
                  title: ' A custom CSS class to give to the y-axis title',
                  type: String,
                  default: 'apexcharts-yaxis-title'
                }
              }
            }
          }
        },
        crosshairs: {
          type: Object,
          attrs: {
            show: {
              title:
                'Show crosshairs on y-axis when user moves the mouse over chart area. Note: Make sure to have `yaxis.tooltip.enabled: true` to make the crosshair visible.',
              type: Boolean,
              default: true
            },
            position: {
              type: String,
              choices: ['back', 'front'],
              default: 'back'
            },
            stroke: {
              type: Object,
              attrs: {
                color: {
                  title: 'Border color of crosshairs',
                  type: 'color',
                  default: '#b6b6b6'
                },
                width: {
                  title: 'Border width of crosshairs',
                  type: Number,
                  default: 1
                },
                dashArray: {
                  title:
                    'Creates dashes in borders of crosshairs. Higher number creates more space between dashes in the border.',
                  default: 0
                }
              }
            }
          }
        },
        tooltip: {
          type: Object,
          attrs: {
            enabled: {
              title: 'Show tooltip on y-axis',
              type: Boolean,
              default: true
            },
            offsetX: {
              title: 'Sets the top offset for y-axis tooltip',
              type: Number,
              default: 0
            }
          }
        }
      }
    }
  }
}
