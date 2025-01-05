;(function () {
  try {
    if (SVGElement.prototype.innerHTML) return
  } catch (e) {
    return
  }

  const serializeXML = function (node, output) {
    const nodeType = node.nodeType
    if (nodeType === 3) {
      output.push(
        node.textContent
          .replace(/&/, '&amp;')
          .replace(/</, '&lt;')
          .replace('>', '&gt;')
      )
    } else if (nodeType === 1) {
      output.push('<', node.tagName)
      if (node.hasAttributes()) {
        ;[].forEach.call(node.attributes, function (attrNode) {
          output.push(' ', attrNode.name, '="', attrNode.value, '"')
        })
      }
      output.push('>')
      if (node.hasChildNodes()) {
        ;[].forEach.call(node.childNodes, function (childNode) {
          serializeXML(childNode, output)
        })
      } else {
        // output.push('/>')
      }
      output.push('</', node.tagName, '>')
    } else if (nodeType === 8) {
      output.push('<!--', node.nodeValue, '-->')
    }
  }

  Object.defineProperty(SVGElement.prototype, 'innerHTML', {
    get: function () {
      const output = []
      let childNode = this.firstChild
      while (childNode) {
        serializeXML(childNode, output)
        childNode = childNode.nextSibling
      }
      return output.join('')
    },
    set: function (markupText) {
      while (this.firstChild) {
        this.removeChild(this.firstChild)
      }

      try {
        const dXML = new DOMParser()
        dXML.async = false

        const sXML =
          "<svg xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink'>" +
          markupText +
          '</svg>'
        const svgDocElement = dXML.parseFromString(
          sXML,
          'text/xml'
        ).documentElement

        let childNode = svgDocElement.firstChild
        while (childNode) {
          this.appendChild(this.ownerDocument.importNode(childNode, true))
          childNode = childNode.nextSibling
        }
      } catch (e) {
        throw new Error('Can not set innerHTML on node')
      }
    }
  })

  Object.defineProperty(SVGElement.prototype, 'outerHTML', {
    get: function () {
      const output = []
      serializeXML(this, output)
      return output.join('')
    },
    set: function (markupText) {
      while (this.firstChild) {
        this.removeChild(this.firstChild)
      }

      try {
        const dXML = new DOMParser()
        dXML.async = false

        const sXML =
          "<svg xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink'>" +
          markupText +
          '</svg>'
        const svgDocElement = dXML.parseFromString(
          sXML,
          'text/xml'
        ).documentElement

        let childNode = svgDocElement.firstChild
        while (childNode) {
          this.parentNode.insertBefore(
            this.ownerDocument.importNode(childNode, true),
            this
          )
          // this.appendChild(this.ownerDocument.importNode(childNode, true));
          childNode = childNode.nextSibling
        }
      } catch (e) {
        throw new Error('Can not set outerHTML on node')
      }
    }
  })
})()
