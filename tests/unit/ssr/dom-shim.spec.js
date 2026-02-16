import { describe, it, expect, beforeEach } from 'vitest'
import { SSRDOMShim, SSRElement, SSRClassList } from '../../../src/ssr/DOMShim.js'

describe('SSRDOMShim', () => {
  let shim

  beforeEach(() => {
    shim = new SSRDOMShim()
  })

  describe('Element Creation', () => {
    it('should create SVG element with namespace', () => {
      const svgElement = shim.createElementNS('http://www.w3.org/2000/svg', 'svg')

      expect(svgElement).toBeDefined()
      expect(svgElement.nodeName).toBe('svg')
      expect(svgElement.namespaceURI).toBe('http://www.w3.org/2000/svg')
    })

    it('should create text node', () => {
      const textNode = shim.createTextNode('Hello World')

      expect(textNode.nodeName).toBe('#text')
      expect(textNode.textContent).toBe('Hello World')
      expect(textNode.nodeType).toBe(3)
    })

    it('should create multiple elements with different tags', () => {
      const rect = shim.createElementNS('http://www.w3.org/2000/svg', 'rect')
      const circle = shim.createElementNS('http://www.w3.org/2000/svg', 'circle')
      const path = shim.createElementNS('http://www.w3.org/2000/svg', 'path')

      expect(rect.nodeName).toBe('rect')
      expect(circle.nodeName).toBe('circle')
      expect(path.nodeName).toBe('path')
    })
  })

  describe('SSRElement Attributes', () => {
    let element

    beforeEach(() => {
      element = new SSRElement('rect')
    })

    it('should set and get attributes', () => {
      element.setAttribute('width', '100')
      element.setAttribute('height', '50')

      expect(element.getAttribute('width')).toBe('100')
      expect(element.getAttribute('height')).toBe('50')
    })

    it('should check if attribute exists', () => {
      element.setAttribute('x', '10')

      expect(element.hasAttribute('x')).toBe(true)
      expect(element.hasAttribute('y')).toBe(false)
    })

    it('should remove attributes', () => {
      element.setAttribute('fill', 'red')
      expect(element.hasAttribute('fill')).toBe(true)

      element.removeAttribute('fill')
      expect(element.hasAttribute('fill')).toBe(false)
    })
  })

  describe('SSRElement Children', () => {
    let parent, child1, child2

    beforeEach(() => {
      parent = new SSRElement('g')
      child1 = new SSRElement('rect')
      child2 = new SSRElement('circle')
    })

    it('should append child elements', () => {
      parent.appendChild(child1)
      parent.appendChild(child2)

      expect(parent.children.length).toBe(2)
      expect(parent.children[0]).toBe(child1)
      expect(parent.children[1]).toBe(child2)
    })

    it('should set parent node on appendChild', () => {
      parent.appendChild(child1)

      expect(child1.parentNode).toBe(parent)
    })

    it('should remove child elements', () => {
      parent.appendChild(child1)
      parent.appendChild(child2)

      parent.removeChild(child1)

      expect(parent.children.length).toBe(1)
      expect(parent.children[0]).toBe(child2)
      expect(child1.parentNode).toBe(null)
    })

    it('should insert before reference node', () => {
      parent.appendChild(child1)
      parent.insertBefore(child2, child1)

      expect(parent.children.length).toBe(2)
      expect(parent.children[0]).toBe(child2)
      expect(parent.children[1]).toBe(child1)
    })

    it('should append when insertBefore has no reference node', () => {
      parent.appendChild(child1)
      parent.insertBefore(child2, null)

      expect(parent.children.length).toBe(2)
      expect(parent.children[1]).toBe(child2)
    })

    it('should prevent adding self as child', () => {
      parent.appendChild(parent)

      expect(parent.children.length).toBe(0)
    })
  })

  describe('SSRElement Cloning', () => {
    let element

    beforeEach(() => {
      element = new SSRElement('rect')
      element.setAttribute('width', '100')
      element.setAttribute('height', '50')
      element.textContent = 'Test'
      element.style.fill = 'red'
    })

    it('should clone element without children (shallow)', () => {
      const child = new SSRElement('circle')
      element.appendChild(child)

      const clone = element.cloneNode(false)

      expect(clone.nodeName).toBe('rect')
      expect(clone.getAttribute('width')).toBe('100')
      expect(clone.getAttribute('height')).toBe('50')
      expect(clone.textContent).toBe('Test')
      expect(clone.style.fill).toBe('red')
      expect(clone.children.length).toBe(0)
    })

    it('should clone element with children (deep)', () => {
      const child1 = new SSRElement('circle')
      const child2 = new SSRElement('path')
      element.appendChild(child1)
      element.appendChild(child2)

      const clone = element.cloneNode(true)

      expect(clone.children.length).toBe(2)
      expect(clone.children[0].nodeName).toBe('circle')
      expect(clone.children[1].nodeName).toBe('path')
      expect(clone.children[0]).not.toBe(child1) // Different instance
    })
  })

  describe('SSRElement Dimensions', () => {
    it('should return default bounding client rect', () => {
      const element = new SSRElement('rect')
      const rect = element.getBoundingClientRect()

      expect(rect.width).toBe(0)
      expect(rect.height).toBe(0)
      expect(rect.top).toBe(0)
      expect(rect.left).toBe(0)
    })

    it('should use SSR dimensions if provided', () => {
      const element = new SSRElement('svg')
      element._ssrWidth = 500
      element._ssrHeight = 300

      const rect = element.getBoundingClientRect()

      expect(rect.width).toBe(500)
      expect(rect.height).toBe(300)
    })
  })

  describe('SSRElement Root Node', () => {
    it('should return self as root when no parent', () => {
      const element = new SSRElement('svg')

      expect(element.getRootNode()).toBe(element)
    })

    it('should return top-most parent as root', () => {
      const root = new SSRElement('svg')
      const group = new SSRElement('g')
      const rect = new SSRElement('rect')

      root.appendChild(group)
      group.appendChild(rect)

      expect(rect.getRootNode()).toBe(root)
    })
  })

  describe('SSRElement Serialization', () => {
    it('should serialize empty element as self-closing', () => {
      const element = new SSRElement('circle')
      element.setAttribute('cx', '50')
      element.setAttribute('cy', '50')
      element.setAttribute('r', '10')

      const str = element.toString()

      expect(str).toContain('<circle')
      expect(str).toContain('cx="50"')
      expect(str).toContain('cy="50"')
      expect(str).toContain('r="10"')
      expect(str).toContain('/>')
    })

    it('should serialize element with text content', () => {
      const element = new SSRElement('text')
      element.textContent = 'Hello World'

      const str = element.toString()

      expect(str).toBe('<text>Hello World</text>')
    })

    it('should serialize element with children', () => {
      const parent = new SSRElement('g')
      const child = new SSRElement('rect')
      child.setAttribute('width', '100')

      parent.appendChild(child)

      const str = parent.toString()

      expect(str).toContain('<g>')
      expect(str).toContain('<rect')
      expect(str).toContain('width="100"')
      expect(str).toContain('</g>')
    })

    it('should provide innerHTML getter', () => {
      const parent = new SSRElement('g')
      const child1 = new SSRElement('rect')
      const child2 = new SSRElement('circle')

      parent.appendChild(child1)
      parent.appendChild(child2)

      const html = parent.innerHTML

      expect(html).toContain('<rect')
      expect(html).toContain('<circle')
    })

    it('should provide outerHTML getter', () => {
      const element = new SSRElement('rect')
      element.setAttribute('x', '10')

      const html = element.outerHTML

      expect(html).toContain('<rect')
      expect(html).toContain('x="10"')
    })
  })

  describe('SSRClassList', () => {
    let classList

    beforeEach(() => {
      classList = new SSRClassList()
    })

    it('should add classes', () => {
      classList.add('class1')
      classList.add('class2', 'class3')

      expect(classList.contains('class1')).toBe(true)
      expect(classList.contains('class2')).toBe(true)
      expect(classList.contains('class3')).toBe(true)
    })

    it('should remove classes', () => {
      classList.add('class1', 'class2')
      classList.remove('class1')

      expect(classList.contains('class1')).toBe(false)
      expect(classList.contains('class2')).toBe(true)
    })

    it('should toggle classes', () => {
      const result1 = classList.toggle('class1')
      expect(result1).toBe(true)
      expect(classList.contains('class1')).toBe(true)

      const result2 = classList.toggle('class1')
      expect(result2).toBe(false)
      expect(classList.contains('class1')).toBe(false)
    })

    it('should force add with toggle', () => {
      classList.toggle('class1', true)
      expect(classList.contains('class1')).toBe(true)

      classList.toggle('class1', true)
      expect(classList.contains('class1')).toBe(true)
    })

    it('should force remove with toggle', () => {
      classList.add('class1')
      classList.toggle('class1', false)
      expect(classList.contains('class1')).toBe(false)

      classList.toggle('class1', false)
      expect(classList.contains('class1')).toBe(false)
    })

    it('should convert to string', () => {
      classList.add('class1', 'class2', 'class3')
      const str = classList.toString()

      expect(str).toContain('class1')
      expect(str).toContain('class2')
      expect(str).toContain('class3')
    })
  })

  describe('SSRDOMShim Helper Methods', () => {
    it('should create XMLSerializer', () => {
      const serializer = shim.createXMLSerializer()
      const element = new SSRElement('rect')
      element.setAttribute('width', '100')

      const result = serializer.serializeToString(element)

      expect(result).toContain('<rect')
      expect(result).toContain('width="100"')
    })

    it('should create DOMParser', () => {
      const parser = shim.createDOMParser()

      expect(parser.parseFromString).toBeDefined()
    })

    it('should return null for querySelector', () => {
      expect(shim.querySelector('.test')).toBe(null)
    })

    it('should return empty array for querySelectorAll', () => {
      const result = shim.querySelectorAll('.test')

      expect(Array.isArray(result)).toBe(true)
      expect(result.length).toBe(0)
    })

    it('should return empty object for getComputedStyle', () => {
      const styles = shim.getComputedStyle()

      expect(styles).toEqual({})
    })

    it('should return default rect for getBoundingClientRect', () => {
      const rect = shim.getBoundingClientRect()

      expect(rect.width).toBe(0)
      expect(rect.height).toBe(0)
    })

    it('should use element dimensions if available', () => {
      const element = new SSRElement('svg')
      element._ssrWidth = 400
      element._ssrHeight = 300

      const rect = shim.getBoundingClientRect(element)

      expect(rect.width).toBe(400)
      expect(rect.height).toBe(300)
    })
  })

  describe('SSRElement Properties', () => {
    it('should have isConnected property', () => {
      const element = new SSRElement('rect')

      expect(element.isConnected).toBe(true)
    })

    it('should have style object', () => {
      const element = new SSRElement('rect')
      element.style.fill = 'red'
      element.style.stroke = 'blue'

      expect(element.style.fill).toBe('red')
      expect(element.style.stroke).toBe('blue')
    })

    it('should have classList', () => {
      const element = new SSRElement('rect')
      element.classList.add('test-class')

      expect(element.classList.contains('test-class')).toBe(true)
    })

    it('should set innerHTML', () => {
      const element = new SSRElement('g')
      element.innerHTML = '<rect width="100"/>'

      expect(element.textContent).toBe('<rect width="100"/>')
      expect(element.children.length).toBe(0) // innerHTML just sets textContent
    })
  })
})
