import { filter } from '../utils/utils.js'

// IE11: children does not work for svg nodes
export default function children(node) {
  return filter(node.childNodes, function (child) {
    return child.nodeType === 1
  })
}
