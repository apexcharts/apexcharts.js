import { ResizeHandler } from './src/ResizeHandler.js'

interface ResizeOptions {
  preserveAspectRatio: boolean
  aroundCenter: boolean
  grid: number
  degree: number
}

declare module '@svgdotjs/svg.js' {
  interface Element {
    resize(): this

    resize(enable: boolean): this
    resize(options: ResizeOptions): this
    resize(handler: ResizeHandler): this
    resize(attr?: ResizeHandler | ResizeOptions | boolean): this
  }
}
