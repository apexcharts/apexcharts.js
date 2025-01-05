import { isImage } from '../modules/core/regex.js'
import { nodeOrNew, register, wrapWithAttrCheck } from '../utils/adopter.js'
import { off, on } from '../modules/core/event.js'
import { registerAttrHook } from '../modules/core/attr.js'
import { registerMethods } from '../utils/methods.js'
import { xlink } from '../modules/core/namespaces.js'
import Pattern from './Pattern.js'
import Shape from './Shape.js'
import { globals } from '../utils/window.js'

export default class Image extends Shape {
  constructor(node, attrs = node) {
    super(nodeOrNew('image', node), attrs)
  }

  // (re)load image
  load(url, callback) {
    if (!url) return this

    const img = new globals.window.Image()

    on(
      img,
      'load',
      function (e) {
        const p = this.parent(Pattern)

        // ensure image size
        if (this.width() === 0 && this.height() === 0) {
          this.size(img.width, img.height)
        }

        if (p instanceof Pattern) {
          // ensure pattern size if not set
          if (p.width() === 0 && p.height() === 0) {
            p.size(this.width(), this.height())
          }
        }

        if (typeof callback === 'function') {
          callback.call(this, e)
        }
      },
      this
    )

    on(img, 'load error', function () {
      // dont forget to unbind memory leaking events
      off(img)
    })

    return this.attr('href', (img.src = url), xlink)
  }
}

registerAttrHook(function (attr, val, _this) {
  // convert image fill and stroke to patterns
  if (attr === 'fill' || attr === 'stroke') {
    if (isImage.test(val)) {
      val = _this.root().defs().image(val)
    }
  }

  if (val instanceof Image) {
    val = _this
      .root()
      .defs()
      .pattern(0, 0, (pattern) => {
        pattern.add(val)
      })
  }

  return val
})

registerMethods({
  Container: {
    // create image element, load image and set its size
    image: wrapWithAttrCheck(function (source, callback) {
      return this.put(new Image()).size(0, 0).load(source, callback)
    })
  }
})

register(Image, 'Image')
