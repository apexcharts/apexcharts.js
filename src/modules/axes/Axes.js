// @ts-check
import XAxis from './XAxis'
import YAxis from './YAxis'

export default class Axes {
  /**
   * @param {import('../../types/internal').ChartStateW} w
   * @param {import('../../types/internal').ChartContext} ctx
   */
  constructor(w, ctx) {
    this.w = w
    this.ctx = ctx // needed: passes ctx to XAxis/YAxis for event callbacks
  }

  /**
   * @param {string} type
   * @param {any} elgrid
   */
  drawAxis(type, elgrid) {
    const gl = this.w.globals
    const cnf = this.w.config

    const xAxis = new XAxis(this.w, this.ctx, elgrid)
    const yAxis = new YAxis(this.w, { theme: this.ctx.theme, timeScale: this.ctx.timeScale }, elgrid)

    if (gl.axisCharts && type !== 'radar') {
      let elXaxis, elYaxis

      if (gl.isBarHorizontal) {
        elYaxis = yAxis.drawYaxisInversed(0)
        elXaxis = xAxis.drawXaxisInversed(0)

        this.w.dom.elGraphical.add(elXaxis)
        this.w.dom.elGraphical.add(elYaxis)
      } else {
        elXaxis = xAxis.drawXaxis()
        this.w.dom.elGraphical.add(elXaxis)

        /**
         * @param {ApexYAxis} yaxe
         * @param {number} index
         */
        cnf.yaxis.map((yaxe, index) => {
          if (gl.ignoreYAxisIndexes.indexOf(index) === -1) {
            elYaxis = yAxis.drawYaxis(index)
            this.w.dom.Paper.add(elYaxis)

            if (this.w.config.grid.position === 'back') {
              const inner = this.w.dom.Paper.children()[1]
              if (inner) {
                inner.remove()
                this.w.dom.Paper.add(inner)
              }
            }
          }
        })
      }
    }
  }
}
