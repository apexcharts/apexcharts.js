import Dom from './Dom.js'
import { globals } from '../utils/window.js'
import { register, create } from '../utils/adopter.js'

class Fragment extends Dom {
  constructor(node = globals.document.createDocumentFragment()) {
    super(node)
  }

  // Import / Export raw xml
  xml(xmlOrFn, outerXML, ns) {
    if (typeof xmlOrFn === 'boolean') {
      ns = outerXML
      outerXML = xmlOrFn
      xmlOrFn = null
    }

    // because this is a fragment we have to put all elements into a wrapper first
    // before we can get the innerXML from it
    if (xmlOrFn == null || typeof xmlOrFn === 'function') {
      const wrapper = new Dom(create('wrapper', ns))
      wrapper.add(this.node.cloneNode(true))

      return wrapper.xml(false, ns)
    }

    // Act as setter if we got a string
    return super.xml(xmlOrFn, false, ns)
  }
}

register(Fragment, 'Fragment')

export default Fragment
