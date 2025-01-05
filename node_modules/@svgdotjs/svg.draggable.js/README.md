# svg.draggable.js

A plugin for the [svgdotjs.github.io](https://svgdotjs.github.io/) library to make elements draggable.

svg.draggable.js is licensed under the terms of the MIT License.

## Usage

Install the plugin:

```sh
npm install @svgdotjs/svg.js @svgdotjs/svg.draggable.js
```

Include this plugin after including the svg.js library in your html document.

```html
<script src="node_modules/@svgdotjs/svg.js/dist/svg.js"></script>
<script src="node_modules/@svgdotjs/svg.draggable.js/dist/svg.draggable.js"></script>
```

Or for esm just require it:

```js
import { SVG } from '@svgdotjs/svg.js'
import '@svgdotjs/svg.draggable.js'
```

To make an element draggable just call `draggable()` on the element

```javascript
var draw = SVG()
  .addTo('#canvas')
  .size(400, 400)
var rect = draw.rect(100, 100)

rect.draggable()
```

Yes indeed, that's it! Now the `rect` is draggable.

## Events

The Plugin fires 4 different events

- beforedrag (cancelable)
- dragstart
- dragmove (cancelable)
- dragend

You can bind/unbind listeners to this events:

```javascript
// bind
rect.on('dragstart.namespace', function (event) {
  // event.detail.event hold the given data explained below
  // this == rect
})

// unbind
rect.off('dragstart.namespace')
```

### event.detail

`beforedrag`, `dragstart`, `dragmove` and `dragend` gives you the mouse / touch `event` and the `handler` which calculates the drag.
Except for `beforedrag` the events also give you `detail.box` which holds the initial or new bbox of the element before or after the drag.

You can use this property to implement custom drag behavior as seen below.

Please note that the bounding box is not what you would expect for nested svgs because those calculate their bbox based on their content and not their x, y, width and height values. Therefore stuff like constraints needs to be implemented a bit differently.

### Cancelable Events

You can prevent the default action of `beforedrag` and `dragmove` with a call to `event.preventDefault()` in the callback function.
The shape won't be dragged in this case. That is helpfull if you want to implement your own drag handling.

```javascript
rect.draggable().on('beforedrag', e => {
  e.preventDefault()
  // no other events are bound
  // drag was completely prevented
})

rect.draggable().on('dragmove', e => {
  e.preventDefault()
  e.detail.handler.move(100, 200)
  // events are still bound e.g. dragend will fire anyway
})
```

### Custom Drag Behavior

#### Constraints

```js
// Some constraints (x, y, width, height)
const constraints = new SVG.Box(100, 100, 400, 400)

rect.on('dragmove.namespace', e => {
  const { handler, box } = e.detail
  e.preventDefault()

  let { x, y } = box

  // In case your dragged element is a nested element,
  // you are better off using the rbox() instead of bbox()

  if (x < constraints.x) {
    x = constraints.x
  }

  if (y < constraints.y) {
    y = constraints.y
  }

  if (box.x2 > constraints.x2) {
    x = constraints.x2 - box.w
  }

  if (box.y2 > constraints.y2) {
    y = constraints.y2 - box.h
  }

  handler.move(x - (x % 50), y - (y % 50))
})
```

#### Snap to grid

```js
rect.on('dragmove.namespace', e => {
  const { handler, box } = e.detail
  e.preventDefault()

  handler.move(box.x - (box.x % 50), box.y - (box.y % 50))
})
```

## Remove

The draggable functionality can be removed calling draggable again with false as argument:

```javascript
rect.draggable(false)
```

## Restrictions

- If your root-svg is transformed this plugin won't work properly in Firefox. Viewbox however is not affected.

## Dependencies

This module requires svg.js >= v3.0.10
