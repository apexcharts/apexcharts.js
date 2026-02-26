export default class Events {
  constructor(w, ctx) {
    this.w = w
    this.ctx = ctx // needed: eventList, keyboardNavigation, core.setupBrushHandler, fireEvent args

    this.documentEvent = this.documentEvent.bind(this)
  }

  addEventListener(name, handler) {
    const w = this.w

    if (Object.prototype.hasOwnProperty.call(w.globals.events, name)) {
      w.globals.events[name].push(handler)
    } else {
      w.globals.events[name] = [handler]
    }
  }

  removeEventListener(name, handler) {
    const w = this.w
    if (!Object.prototype.hasOwnProperty.call(w.globals.events, name)) {
      return
    }

    const index = w.globals.events[name].indexOf(handler)
    if (index !== -1) {
      w.globals.events[name].splice(index, 1)
    }
  }

  fireEvent(name, args) {
    const w = this.w

    if (!Object.prototype.hasOwnProperty.call(w.globals.events, name)) {
      return
    }

    if (!args || !args.length) {
      args = []
    }

    const evs = w.globals.events[name]
    const l = evs.length

    for (let i = 0; i < l; i++) {
      evs[i].apply(null, args)
    }
  }

  setupEventHandlers() {
    const w = this.w
    const me = this.ctx

    const clickableArea = w.dom.baseEl.querySelector(w.globals.chartClass)

    this.ctx.eventList.forEach((event) => {
      clickableArea.addEventListener(
        event,
        (e) => {
          const capturedSeriesIndex =
            e.target.getAttribute('i') === null &&
            w.globals.capturedSeriesIndex !== -1
              ? w.globals.capturedSeriesIndex
              : e.target.getAttribute('i')
          const capturedDataPointIndex =
            e.target.getAttribute('j') === null &&
            w.globals.capturedDataPointIndex !== -1
              ? w.globals.capturedDataPointIndex
              : e.target.getAttribute('j')

          const opts = Object.assign({}, w, {
            seriesIndex: w.globals.axisCharts ? capturedSeriesIndex : 0,
            dataPointIndex: capturedDataPointIndex,
          })

          if (e.type === 'keydown') {
            if (
              w.config.chart.accessibility.enabled &&
              w.config.chart.accessibility.keyboard.enabled
            ) {
              if (me.ctx.keyboardNavigation) {
                me.ctx.keyboardNavigation.handleKey(e)
              }
              if (typeof w.config.chart.events.keyDown === 'function') {
                w.config.chart.events.keyDown(e, me, opts)
              }
              me.ctx.events.fireEvent('keydown', [e, me, opts])
            }
          } else if (e.type === 'keyup') {
            if (
              w.config.chart.accessibility.enabled &&
              w.config.chart.accessibility.keyboard.enabled
            ) {
              if (typeof w.config.chart.events.keyUp === 'function') {
                w.config.chart.events.keyUp(e, me, opts)
              }
              me.ctx.events.fireEvent('keyup', [e, me, opts])
            }
          } else if (e.type === 'mousemove' || e.type === 'touchmove') {
            if (typeof w.config.chart.events.mouseMove === 'function') {
              w.config.chart.events.mouseMove(e, me, opts)
            }
          } else if (e.type === 'mouseleave' || e.type === 'touchleave') {
            if (typeof w.config.chart.events.mouseLeave === 'function') {
              w.config.chart.events.mouseLeave(e, me, opts)
            }
          } else if (
            (e.type === 'mouseup' && e.which === 1) ||
            e.type === 'touchend'
          ) {
            if (typeof w.config.chart.events.click === 'function') {
              w.config.chart.events.click(e, me, opts)
            }
            me.ctx.events.fireEvent('click', [e, me, opts])
          }
        },
        { capture: false, passive: true }
      )
    })

    this.ctx.eventList.forEach((event) => {
      w.dom.baseEl.addEventListener(event, this.documentEvent, {
        passive: true,
      })
    })

    this.ctx.core.setupBrushHandler()
  }

  documentEvent(e) {
    const w = this.w
    const target = e.target.className

    if (e.type === 'click') {
      const elMenu = w.dom.baseEl.querySelector('.apexcharts-menu')
      if (
        elMenu &&
        elMenu.classList.contains('apexcharts-menu-open') &&
        target !== 'apexcharts-menu-icon'
      ) {
        elMenu.classList.remove('apexcharts-menu-open')
      }
    }

    w.globals.clientX =
      e.type === 'touchmove' ? e.touches[0].clientX : e.clientX
    w.globals.clientY =
      e.type === 'touchmove' ? e.touches[0].clientY : e.clientY
  }
}
