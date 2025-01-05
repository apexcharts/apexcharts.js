// Map function
export function map(array, block) {
  let i
  const il = array.length
  const result = []

  for (i = 0; i < il; i++) {
    result.push(block(array[i]))
  }

  return result
}

// Filter function
export function filter(array, block) {
  let i
  const il = array.length
  const result = []

  for (i = 0; i < il; i++) {
    if (block(array[i])) {
      result.push(array[i])
    }
  }

  return result
}

// Degrees to radians
export function radians(d) {
  return ((d % 360) * Math.PI) / 180
}

// Radians to degrees
export function degrees(r) {
  return ((r * 180) / Math.PI) % 360
}

// Convert camel cased string to dash separated
export function unCamelCase(s) {
  return s.replace(/([A-Z])/g, function (m, g) {
    return '-' + g.toLowerCase()
  })
}

// Capitalize first letter of a string
export function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

// Calculate proportional width and height values when necessary
export function proportionalSize(element, width, height, box) {
  if (width == null || height == null) {
    box = box || element.bbox()

    if (width == null) {
      width = (box.width / box.height) * height
    } else if (height == null) {
      height = (box.height / box.width) * width
    }
  }

  return {
    width: width,
    height: height
  }
}

/**
 * This function adds support for string origins.
 * It searches for an origin in o.origin o.ox and o.originX.
 * This way, origin: {x: 'center', y: 50} can be passed as well as ox: 'center', oy: 50
 **/
export function getOrigin(o, element) {
  const origin = o.origin
  // First check if origin is in ox or originX
  let ox = o.ox != null ? o.ox : o.originX != null ? o.originX : 'center'
  let oy = o.oy != null ? o.oy : o.originY != null ? o.originY : 'center'

  // Then check if origin was used and overwrite in that case
  if (origin != null) {
    ;[ox, oy] = Array.isArray(origin)
      ? origin
      : typeof origin === 'object'
        ? [origin.x, origin.y]
        : [origin, origin]
  }

  // Make sure to only call bbox when actually needed
  const condX = typeof ox === 'string'
  const condY = typeof oy === 'string'
  if (condX || condY) {
    const { height, width, x, y } = element.bbox()

    // And only overwrite if string was passed for this specific axis
    if (condX) {
      ox = ox.includes('left')
        ? x
        : ox.includes('right')
          ? x + width
          : x + width / 2
    }

    if (condY) {
      oy = oy.includes('top')
        ? y
        : oy.includes('bottom')
          ? y + height
          : y + height / 2
    }
  }

  // Return the origin as it is if it wasn't a string
  return [ox, oy]
}

const descriptiveElements = new Set(['desc', 'metadata', 'title'])
export const isDescriptive = (element) =>
  descriptiveElements.has(element.nodeName)

export const writeDataToDom = (element, data, defaults = {}) => {
  const cloned = { ...data }

  for (const key in cloned) {
    if (cloned[key].valueOf() === defaults[key]) {
      delete cloned[key]
    }
  }

  if (Object.keys(cloned).length) {
    element.node.setAttribute('data-svgjs', JSON.stringify(cloned)) // see #428
  } else {
    element.node.removeAttribute('data-svgjs')
    element.node.removeAttribute('svgjs:data')
  }
}
