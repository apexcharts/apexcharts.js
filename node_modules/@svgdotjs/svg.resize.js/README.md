# svg.resize.js

An extension of [svg.js](https://github.com/svgdotjs/svg.js) which allows to resize elements which are selected with [svg.select.js](https://github.com/svgdotjs/svg.select.js)

# Demo

For a demo see http://svgdotjs.github.io/svg.resize.js/

# Get Started

Install `svg.js`, `svg.select.js` and `svg.resize.js` using npm:

```bash
npm i @svgdotjs/svg.js @svgdotjs/svg.select.js @svgdotjs/svg.resize.js
```

Or get it from a cnd:

```html
<link rel="stylesheet" href="https://unpkg.com/@svgdotjs/svg.resize.js@latest/dist/svg.resize.css" />
<script src="https://unpkg.com/@svgdotjs/svg.js"></script>
<!-- the select plugin comes bundled with the resize plugin -->
<!-- <script src="https://unpkg.com/@svgdotjs/svg.select.js"></script> -->
<script src="https://unpkg.com/@svgdotjs/svg.resize.js"></script>
```

Select and resize a rectangle using this simple piece of code:

```ts
var canvas = new SVG().addTo('body').size(500, 500)
canvas.rect(50, 50).fill('red').select().resize()
```

# Usage

Activate resizing

```ts
rect.select().resize()
```

Deactivate resizing

```ts
rect.resize(false)
```

Preserve aspect ratio, resize around center and snap to grid:

```ts
rect.resize({ preserveAspectRatio: true, aroundCenter: true, grid: 10, degree: 0.1 })
```

# Options

- `preserveAspectRatio`: Preserve the aspect ratio of the element while resizing
- `aroundCenter`: Resize around the center of the element
- `grid`: Snaps the shape to a virtual grid while resizing
- `degree`: Snaps to an angle when rotating

# Events

While resizing, a `resize` event is fired. It contains the following properties (in `event.detail`):

- `box`: The resulting bounding box after the resize operation
- `angle`: The resulting rotation angle after the resize operation
- `eventType`: The type of resize operation (the event fired by the select plugin)
- `event`: The original event
- `handler`: The resize handler

```ts
rect.on('resize', (event) => {
  console.log(event.detail)
})
```

# Contributing

```bash
git clone https://github.com/svgdotjs/svg.resize.js.git
cd svg.resize.js
npm install
npm run dev
```

# Migration from svg.js v2

- The option naming changed a bit. Please double check
- The former events were removed. The resize event now serves the same purpose
