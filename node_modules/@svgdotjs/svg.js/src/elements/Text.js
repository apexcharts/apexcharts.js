import {
  adopt,
  extend,
  nodeOrNew,
  register,
  wrapWithAttrCheck
} from '../utils/adopter.js'
import { registerMethods } from '../utils/methods.js'
import SVGNumber from '../types/SVGNumber.js'
import Shape from './Shape.js'
import { globals } from '../utils/window.js'
import * as textable from '../modules/core/textable.js'
import { isDescriptive, writeDataToDom } from '../utils/utils.js'

export default class Text extends Shape {
  // Initialize node
  constructor(node, attrs = node) {
    super(nodeOrNew('text', node), attrs)

    this.dom.leading = this.dom.leading ?? new SVGNumber(1.3) // store leading value for rebuilding
    this._rebuild = true // enable automatic updating of dy values
    this._build = false // disable build mode for adding multiple lines
  }

  // Set / get leading
  leading(value) {
    // act as getter
    if (value == null) {
      return this.dom.leading
    }

    // act as setter
    this.dom.leading = new SVGNumber(value)

    return this.rebuild()
  }

  // Rebuild appearance type
  rebuild(rebuild) {
    // store new rebuild flag if given
    if (typeof rebuild === 'boolean') {
      this._rebuild = rebuild
    }

    // define position of all lines
    if (this._rebuild) {
      const self = this
      let blankLineOffset = 0
      const leading = this.dom.leading

      this.each(function (i) {
        if (isDescriptive(this.node)) return

        const fontSize = globals.window
          .getComputedStyle(this.node)
          .getPropertyValue('font-size')

        const dy = leading * new SVGNumber(fontSize)

        if (this.dom.newLined) {
          this.attr('x', self.attr('x'))

          if (this.text() === '\n') {
            blankLineOffset += dy
          } else {
            this.attr('dy', i ? dy + blankLineOffset : 0)
            blankLineOffset = 0
          }
        }
      })

      this.fire('rebuild')
    }

    return this
  }

  // overwrite method from parent to set data properly
  setData(o) {
    this.dom = o
    this.dom.leading = new SVGNumber(o.leading || 1.3)
    return this
  }

  writeDataToDom() {
    writeDataToDom(this, this.dom, { leading: 1.3 })
    return this
  }

  // Set the text content
  text(text) {
    // act as getter
    if (text === undefined) {
      const children = this.node.childNodes
      let firstLine = 0
      text = ''

      for (let i = 0, len = children.length; i < len; ++i) {
        // skip textPaths - they are no lines
        if (children[i].nodeName === 'textPath' || isDescriptive(children[i])) {
          if (i === 0) firstLine = i + 1
          continue
        }

        // add newline if its not the first child and newLined is set to true
        if (
          i !== firstLine &&
          children[i].nodeType !== 3 &&
          adopt(children[i]).dom.newLined === true
        ) {
          text += '\n'
        }

        // add content of this node
        text += children[i].textContent
      }

      return text
    }

    // remove existing content
    this.clear().build(true)

    if (typeof text === 'function') {
      // call block
      text.call(this, this)
    } else {
      // store text and make sure text is not blank
      text = (text + '').split('\n')

      // build new lines
      for (let j = 0, jl = text.length; j < jl; j++) {
        this.newLine(text[j])
      }
    }

    // disable build mode and rebuild lines
    return this.build(false).rebuild()
  }
}

extend(Text, textable)

registerMethods({
  Container: {
    // Create text element
    text: wrapWithAttrCheck(function (text = '') {
      return this.put(new Text()).text(text)
    }),

    // Create plain text element
    plain: wrapWithAttrCheck(function (text = '') {
      return this.put(new Text()).plain(text)
    })
  }
})

register(Text, 'Text')
