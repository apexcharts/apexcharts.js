export const globals = {
  window: typeof window === 'undefined' ? null : window,
  document: typeof document === 'undefined' ? null : document
}

export function registerWindow(win = null, doc = null) {
  globals.window = win
  globals.document = doc
}

const save = {}

export function saveWindow() {
  save.window = globals.window
  save.document = globals.document
}

export function restoreWindow() {
  globals.window = save.window
  globals.document = save.document
}

export function withWindow(win, fn) {
  saveWindow()
  registerWindow(win, win.document)
  fn(win, win.document)
  restoreWindow()
}

export function getWindow() {
  return globals.window
}
