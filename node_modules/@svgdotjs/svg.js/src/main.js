/* Optional Modules */
import './modules/optional/arrange.js'
import './modules/optional/class.js'
import './modules/optional/css.js'
import './modules/optional/data.js'
import './modules/optional/memory.js'
import './modules/optional/sugar.js'
import './modules/optional/transform.js'

import { extend, makeInstance } from './utils/adopter.js'
import { getMethodNames, getMethodsFor } from './utils/methods.js'
import Box from './types/Box.js'
import Color from './types/Color.js'
import Container from './elements/Container.js'
import Defs from './elements/Defs.js'
import Dom from './elements/Dom.js'
import Element from './elements/Element.js'
import Ellipse from './elements/Ellipse.js'
import EventTarget from './types/EventTarget.js'
import Fragment from './elements/Fragment.js'
import Gradient from './elements/Gradient.js'
import Image from './elements/Image.js'
import Line from './elements/Line.js'
import List from './types/List.js'
import Marker from './elements/Marker.js'
import Matrix from './types/Matrix.js'
import Morphable, {
  NonMorphable,
  ObjectBag,
  TransformBag,
  makeMorphable,
  registerMorphableType
} from './animation/Morphable.js'
import Path from './elements/Path.js'
import PathArray from './types/PathArray.js'
import Pattern from './elements/Pattern.js'
import PointArray from './types/PointArray.js'
import Point from './types/Point.js'
import Polygon from './elements/Polygon.js'
import Polyline from './elements/Polyline.js'
import Rect from './elements/Rect.js'
import Runner from './animation/Runner.js'
import SVGArray from './types/SVGArray.js'
import SVGNumber from './types/SVGNumber.js'
import Shape from './elements/Shape.js'
import Svg from './elements/Svg.js'
import Symbol from './elements/Symbol.js'
import Text from './elements/Text.js'
import Tspan from './elements/Tspan.js'
import * as defaults from './modules/core/defaults.js'
import * as utils from './utils/utils.js'
import * as namespaces from './modules/core/namespaces.js'
import * as regex from './modules/core/regex.js'

export {
  Morphable,
  registerMorphableType,
  makeMorphable,
  TransformBag,
  ObjectBag,
  NonMorphable
}

export { defaults, utils, namespaces, regex }
export const SVG = makeInstance
export { default as parser } from './modules/core/parser.js'
export { default as find } from './modules/core/selector.js'
export * from './modules/core/event.js'
export * from './utils/adopter.js'
export {
  getWindow,
  registerWindow,
  restoreWindow,
  saveWindow,
  withWindow
} from './utils/window.js'

/* Animation Modules */
export { default as Animator } from './animation/Animator.js'
export {
  Controller,
  Ease,
  PID,
  Spring,
  easing
} from './animation/Controller.js'
export { default as Queue } from './animation/Queue.js'
export { default as Runner } from './animation/Runner.js'
export { default as Timeline } from './animation/Timeline.js'

/* Types */
export { default as Array } from './types/SVGArray.js'
export { default as Box } from './types/Box.js'
export { default as Color } from './types/Color.js'
export { default as EventTarget } from './types/EventTarget.js'
export { default as Matrix } from './types/Matrix.js'
export { default as Number } from './types/SVGNumber.js'
export { default as PathArray } from './types/PathArray.js'
export { default as Point } from './types/Point.js'
export { default as PointArray } from './types/PointArray.js'
export { default as List } from './types/List.js'

/* Elements */
export { default as Circle } from './elements/Circle.js'
export { default as ClipPath } from './elements/ClipPath.js'
export { default as Container } from './elements/Container.js'
export { default as Defs } from './elements/Defs.js'
export { default as Dom } from './elements/Dom.js'
export { default as Element } from './elements/Element.js'
export { default as Ellipse } from './elements/Ellipse.js'
export { default as ForeignObject } from './elements/ForeignObject.js'
export { default as Fragment } from './elements/Fragment.js'
export { default as Gradient } from './elements/Gradient.js'
export { default as G } from './elements/G.js'
export { default as A } from './elements/A.js'
export { default as Image } from './elements/Image.js'
export { default as Line } from './elements/Line.js'
export { default as Marker } from './elements/Marker.js'
export { default as Mask } from './elements/Mask.js'
export { default as Path } from './elements/Path.js'
export { default as Pattern } from './elements/Pattern.js'
export { default as Polygon } from './elements/Polygon.js'
export { default as Polyline } from './elements/Polyline.js'
export { default as Rect } from './elements/Rect.js'
export { default as Shape } from './elements/Shape.js'
export { default as Stop } from './elements/Stop.js'
export { default as Style } from './elements/Style.js'
export { default as Svg } from './elements/Svg.js'
export { default as Symbol } from './elements/Symbol.js'
export { default as Text } from './elements/Text.js'
export { default as TextPath } from './elements/TextPath.js'
export { default as Tspan } from './elements/Tspan.js'
export { default as Use } from './elements/Use.js'

extend([Svg, Symbol, Image, Pattern, Marker], getMethodsFor('viewbox'))

extend([Line, Polyline, Polygon, Path], getMethodsFor('marker'))

extend(Text, getMethodsFor('Text'))
extend(Path, getMethodsFor('Path'))

extend(Defs, getMethodsFor('Defs'))

extend([Text, Tspan], getMethodsFor('Tspan'))

extend([Rect, Ellipse, Gradient, Runner], getMethodsFor('radius'))

extend(EventTarget, getMethodsFor('EventTarget'))
extend(Dom, getMethodsFor('Dom'))
extend(Element, getMethodsFor('Element'))
extend(Shape, getMethodsFor('Shape'))
extend([Container, Fragment], getMethodsFor('Container'))
extend(Gradient, getMethodsFor('Gradient'))

extend(Runner, getMethodsFor('Runner'))

List.extend(getMethodNames())

registerMorphableType([
  SVGNumber,
  Color,
  Box,
  Matrix,
  SVGArray,
  PointArray,
  PathArray,
  Point
])

makeMorphable()
