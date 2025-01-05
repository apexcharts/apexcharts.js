# svg.select.js

An extension of [svg.js](https://github.com/svgdotjs/svg.js) which allows to select elements with mouse

## Demo

For a demo see http://svgjs.dev/svg.resize.js/

## Get Started

- Install `svg.js` and `svg.select.js` using npm:

  ```bash
  npm i @svgdotjs/svg.js @svgdotjs/svg.select.js
  ```

- Or get it from a cnd:

  ```html
  <script src="https://unpkg.com/@svgdotjs/svg.js"></script>
  <script src="https://unpkg.com/@svgdotjs/svg.select.js"></script>
  ```

- Select a rectangle using this simple piece of code:

  ```ts
  var canvas = new SVG().addTo('body').size(500, 500)
  canvas.rect(50, 50).fill('red').select()
  ```

## Usage

Select

```ts
var canvas = SVG().addTo('body')
var rect = canvas.rect(100, 100)
var polygon = canvas.polygon([
  [100, 100],
  [200, 100],
  [200, 200],
  [100, 200],
])
rect.select()
polygon.pointSelect()

// both also works
polygon.select().pointSelect()
```

Unselect

```ts
rect.select(false)
```

## Adaptation

Sometimes, the default shape is not to your liking. Therefore, you can create your own handles by passing in a create and update function:

```ts
rect.select({
  createHandle: (group, p, index, pointArr, handleName) => group.circle(10).css({ stroke: '#666', fill: 'blue' }),
  updateHandle: (group, p, index, pointArr, handleName) => group.center(p[0], p[1]),
  createRot: (group) => group.circle(10).css({ stroke: '#666', fill: 'blue' }),
  updateRot: (group, rotPoint, handlePoints) => group.center(p[0], p[1]),
})

polygon.pointSelect({
  createHandle: (group, p, index, pointArr, handleName) => group.circle(10).css({ stroke: '#666', fill: 'blue' }),
  updateHandle: (group, p, index, pointArr, handleName) => group.center(p[0], p[1]),
})
```

You can style the selection with the classes

- `svg_select_shape` - _normal selection_
- `svg_select_shape_pointSelection` - _point selection_
- `svg_select_handle`- _any normal selection handles_
- `svg_select_handle_lt` - _left top_
- `svg_select_handle_rt` - _right top_
- `svg_select_handle_rb` - _right bottom_
- `svg_select_handle_lb` - _left bottom_
- `svg_select_handle_t` - _top_
- `svg_select_handle_r` - _right_
- `svg_select_handle_b` - _bottom_
- `svg_select_handle_l` - _left_
- `svg_select_handle_rot` - _rotation point_
- `svg_select_handle_point` - _point select point_

## Contributing

```bash
git clone https://github.com/svgdotjs/svg.select.js.git
cd svg.select.js
npm install
npm run dev
```

## Migration from svg.js v2

- The css classes changed. In case you used your own styling, you'll need to adapt
- A lot of options got dropped in favor of the `create` and `update` functions
  - In case you want to hide certain handles, just create an element without any size and pass a noop to update
- the deepSelect option was moved to its own function and renamed to `pointSelect`
