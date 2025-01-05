import { SelectHandler, PointSelectHandler } from './src/SelectHandler.js'

interface SelectionOptions {
  createHandle?: (el: Element) => Element
  updateHandle?: (el: Element, point: number[]) => void
  createRot?: (el: Element) => Element
  updateRot?: (el: Element, rotPoint: number[], handlePoints: number[][]) => void
}

declare module '@svgdotjs/svg.js' {
  interface Element {
    select(): this
    select(enable: boolean): this
    select(options: SelectionOptions): this
    select(handler: SelectHandler): this
    select(attr?: SelectHandler | SelectionOptions | boolean): this
  }

  interface Polygon {
    pointSelect(): this
    pointSelect(enable: boolean): this
    pointSelect(options: SelectionOptions): this
    pointSelect(handler: PointSelectHandler): this
    pointSelect(attr?: PointSelectHandler | SelectionOptions | boolean): this
  }
  interface Polyline {
    pointSelect(): this
    pointSelect(enable: boolean): this
    pointSelect(options: SelectionOptions): this
    pointSelect(handler: PointSelectHandler): this
    pointSelect(attr?: PointSelectHandler | SelectionOptions | boolean): this
  }
  interface Line {
    pointSelect(): this
    pointSelect(enable: boolean): this
    pointSelect(options: SelectionOptions): this
    pointSelect(handler: PointSelectHandler): this
    pointSelect(attr?: PointSelectHandler | SelectionOptions | boolean): this
  }
}
