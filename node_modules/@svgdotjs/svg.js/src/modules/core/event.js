import { delimiter } from './regex.js'
import { makeInstance } from '../../utils/adopter.js'
import { globals } from '../../utils/window.js'

let listenerId = 0
export const windowEvents = {}

export function getEvents(instance) {
  let n = instance.getEventHolder()

  // We dont want to save events in global space
  if (n === globals.window) n = windowEvents
  if (!n.events) n.events = {}
  return n.events
}

export function getEventTarget(instance) {
  return instance.getEventTarget()
}

export function clearEvents(instance) {
  let n = instance.getEventHolder()
  if (n === globals.window) n = windowEvents
  if (n.events) n.events = {}
}

// Add event binder in the SVG namespace
export function on(node, events, listener, binding, options) {
  const l = listener.bind(binding || node)
  const instance = makeInstance(node)
  const bag = getEvents(instance)
  const n = getEventTarget(instance)

  // events can be an array of events or a string of events
  events = Array.isArray(events) ? events : events.split(delimiter)

  // add id to listener
  if (!listener._svgjsListenerId) {
    listener._svgjsListenerId = ++listenerId
  }

  events.forEach(function (event) {
    const ev = event.split('.')[0]
    const ns = event.split('.')[1] || '*'

    // ensure valid object
    bag[ev] = bag[ev] || {}
    bag[ev][ns] = bag[ev][ns] || {}

    // reference listener
    bag[ev][ns][listener._svgjsListenerId] = l

    // add listener
    n.addEventListener(ev, l, options || false)
  })
}

// Add event unbinder in the SVG namespace
export function off(node, events, listener, options) {
  const instance = makeInstance(node)
  const bag = getEvents(instance)
  const n = getEventTarget(instance)

  // listener can be a function or a number
  if (typeof listener === 'function') {
    listener = listener._svgjsListenerId
    if (!listener) return
  }

  // events can be an array of events or a string or undefined
  events = Array.isArray(events) ? events : (events || '').split(delimiter)

  events.forEach(function (event) {
    const ev = event && event.split('.')[0]
    const ns = event && event.split('.')[1]
    let namespace, l

    if (listener) {
      // remove listener reference
      if (bag[ev] && bag[ev][ns || '*']) {
        // removeListener
        n.removeEventListener(
          ev,
          bag[ev][ns || '*'][listener],
          options || false
        )

        delete bag[ev][ns || '*'][listener]
      }
    } else if (ev && ns) {
      // remove all listeners for a namespaced event
      if (bag[ev] && bag[ev][ns]) {
        for (l in bag[ev][ns]) {
          off(n, [ev, ns].join('.'), l)
        }

        delete bag[ev][ns]
      }
    } else if (ns) {
      // remove all listeners for a specific namespace
      for (event in bag) {
        for (namespace in bag[event]) {
          if (ns === namespace) {
            off(n, [event, ns].join('.'))
          }
        }
      }
    } else if (ev) {
      // remove all listeners for the event
      if (bag[ev]) {
        for (namespace in bag[ev]) {
          off(n, [ev, namespace].join('.'))
        }

        delete bag[ev]
      }
    } else {
      // remove all listeners on a given node
      for (event in bag) {
        off(n, event)
      }

      clearEvents(instance)
    }
  })
}

export function dispatch(node, event, data, options) {
  const n = getEventTarget(node)

  // Dispatch event
  if (event instanceof globals.window.Event) {
    n.dispatchEvent(event)
  } else {
    event = new globals.window.CustomEvent(event, {
      detail: data,
      cancelable: true,
      ...options
    })
    n.dispatchEvent(event)
  }
  return event
}
