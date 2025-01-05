import { makeInstance } from '../../utils/adopter.js'
import { registerMethods } from '../../utils/methods.js'

// Get all siblings, including myself
export function siblings() {
  return this.parent().children()
}

// Get the current position siblings
export function position() {
  return this.parent().index(this)
}

// Get the next element (will return null if there is none)
export function next() {
  return this.siblings()[this.position() + 1]
}

// Get the next element (will return null if there is none)
export function prev() {
  return this.siblings()[this.position() - 1]
}

// Send given element one step forward
export function forward() {
  const i = this.position()
  const p = this.parent()

  // move node one step forward
  p.add(this.remove(), i + 1)

  return this
}

// Send given element one step backward
export function backward() {
  const i = this.position()
  const p = this.parent()

  p.add(this.remove(), i ? i - 1 : 0)

  return this
}

// Send given element all the way to the front
export function front() {
  const p = this.parent()

  // Move node forward
  p.add(this.remove())

  return this
}

// Send given element all the way to the back
export function back() {
  const p = this.parent()

  // Move node back
  p.add(this.remove(), 0)

  return this
}

// Inserts a given element before the targeted element
export function before(element) {
  element = makeInstance(element)
  element.remove()

  const i = this.position()

  this.parent().add(element, i)

  return this
}

// Inserts a given element after the targeted element
export function after(element) {
  element = makeInstance(element)
  element.remove()

  const i = this.position()

  this.parent().add(element, i + 1)

  return this
}

export function insertBefore(element) {
  element = makeInstance(element)
  element.before(this)
  return this
}

export function insertAfter(element) {
  element = makeInstance(element)
  element.after(this)
  return this
}

registerMethods('Dom', {
  siblings,
  position,
  next,
  prev,
  forward,
  backward,
  front,
  back,
  before,
  after,
  insertBefore,
  insertAfter
})
