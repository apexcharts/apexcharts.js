import { getOrigin, isDescriptive } from '../../utils/utils.js'
import { delimiter, transforms } from '../core/regex.js'
import { registerMethods } from '../../utils/methods.js'
import Matrix from '../../types/Matrix.js'

// Reset all transformations
export function untransform() {
  return this.attr('transform', null)
}

// merge the whole transformation chain into one matrix and returns it
export function matrixify() {
  const matrix = (this.attr('transform') || '')
    // split transformations
    .split(transforms)
    .slice(0, -1)
    .map(function (str) {
      // generate key => value pairs
      const kv = str.trim().split('(')
      return [
        kv[0],
        kv[1].split(delimiter).map(function (str) {
          return parseFloat(str)
        })
      ]
    })
    .reverse()
    // merge every transformation into one matrix
    .reduce(function (matrix, transform) {
      if (transform[0] === 'matrix') {
        return matrix.lmultiply(Matrix.fromArray(transform[1]))
      }
      return matrix[transform[0]].apply(matrix, transform[1])
    }, new Matrix())

  return matrix
}

// add an element to another parent without changing the visual representation on the screen
export function toParent(parent, i) {
  if (this === parent) return this

  if (isDescriptive(this.node)) return this.addTo(parent, i)

  const ctm = this.screenCTM()
  const pCtm = parent.screenCTM().inverse()

  this.addTo(parent, i).untransform().transform(pCtm.multiply(ctm))

  return this
}

// same as above with parent equals root-svg
export function toRoot(i) {
  return this.toParent(this.root(), i)
}

// Add transformations
export function transform(o, relative) {
  // Act as a getter if no object was passed
  if (o == null || typeof o === 'string') {
    const decomposed = new Matrix(this).decompose()
    return o == null ? decomposed : decomposed[o]
  }

  if (!Matrix.isMatrixLike(o)) {
    // Set the origin according to the defined transform
    o = { ...o, origin: getOrigin(o, this) }
  }

  // The user can pass a boolean, an Element or an Matrix or nothing
  const cleanRelative = relative === true ? this : relative || false
  const result = new Matrix(cleanRelative).transform(o)
  return this.attr('transform', result)
}

registerMethods('Element', {
  untransform,
  matrixify,
  toParent,
  toRoot,
  transform
})
