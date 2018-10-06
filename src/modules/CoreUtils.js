/*
 ** Util functions which are dependent on ApexCharts instance
 */

class CoreUtils {
  constructor (ctx) {
    this.ctx = ctx
    this.w = ctx.w
  }

  // Some config objects can be array - and we need to extend them correctly
  static extendArrayProps (configInstance, options) {
    if (options.yaxis) {
      options = configInstance.extendYAxis(options)
    }
    if (options.annotations) {
      if (options.annotations.yaxis) {
        options = configInstance.extendYAxisAnnotations(options)
      }
      if (options.annotations.xaxis) {
        options = configInstance.extendXAxisAnnotations(options)
      }
      if (options.annotations.points) {
        options = configInstance.extendPointAnnotations(options)
      }
    }

    return options
  }
}

export default CoreUtils
