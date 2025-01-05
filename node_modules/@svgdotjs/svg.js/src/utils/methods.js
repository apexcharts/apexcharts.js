const methods = {}
const names = []

export function registerMethods(name, m) {
  if (Array.isArray(name)) {
    for (const _name of name) {
      registerMethods(_name, m)
    }
    return
  }

  if (typeof name === 'object') {
    for (const _name in name) {
      registerMethods(_name, name[_name])
    }
    return
  }

  addMethodNames(Object.getOwnPropertyNames(m))
  methods[name] = Object.assign(methods[name] || {}, m)
}

export function getMethodsFor(name) {
  return methods[name] || {}
}

export function getMethodNames() {
  return [...new Set(names)]
}

export function addMethodNames(_names) {
  names.push(..._names)
}
