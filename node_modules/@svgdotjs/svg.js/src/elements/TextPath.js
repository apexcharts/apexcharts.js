import { nodeOrNew, register, wrapWithAttrCheck } from '../utils/adopter.js'
import { registerMethods } from '../utils/methods.js'
import { xlink } from '../modules/core/namespaces.js'
import Path from './Path.js'
import PathArray from '../types/PathArray.js'
import Text from './Text.js'
import baseFind from '../modules/core/selector.js'

export default class TextPath extends Text {
  // Initialize node
  constructor(node, attrs = node) {
    super(nodeOrNew('textPath', node), attrs)
  }

  // return the array of the path track element
  array() {
    const track = this.track()

    return track ? track.array() : null
  }

  // Plot path if any
  plot(d) {
    const track = this.track()
    let pathArray = null

    if (track) {
      pathArray = track.plot(d)
    }

    return d == null ? pathArray : this
  }

  // Get the path element
  track() {
    return this.reference('href')
  }
}

registerMethods({
  Container: {
    textPath: wrapWithAttrCheck(function (text, path) {
      // Convert text to instance if needed
      if (!(text instanceof Text)) {
        text = this.text(text)
      }

      return text.path(path)
    })
  },
  Text: {
    // Create path for text to run on
    path: wrapWithAttrCheck(function (track, importNodes = true) {
      const textPath = new TextPath()

      // if track is a path, reuse it
      if (!(track instanceof Path)) {
        // create path element
        track = this.defs().path(track)
      }

      // link textPath to path and add content
      textPath.attr('href', '#' + track, xlink)

      // Transplant all nodes from text to textPath
      let node
      if (importNodes) {
        while ((node = this.node.firstChild)) {
          textPath.node.appendChild(node)
        }
      }

      // add textPath element as child node and return textPath
      return this.put(textPath)
    }),

    // Get the textPath children
    textPath() {
      return this.findOne('textPath')
    }
  },
  Path: {
    // creates a textPath from this path
    text: wrapWithAttrCheck(function (text) {
      // Convert text to instance if needed
      if (!(text instanceof Text)) {
        text = new Text().addTo(this.parent()).text(text)
      }

      // Create textPath from text and path and return
      return text.path(this)
    }),

    targets() {
      return baseFind('svg textPath').filter((node) => {
        return (node.attr('href') || '').includes(this.id())
      })

      // Does not work in IE11. Use when IE support is dropped
      // return baseFind('svg textPath[*|href*=' + this.id() + ']')
    }
  }
})

TextPath.prototype.MorphArray = PathArray
register(TextPath, 'TextPath')
