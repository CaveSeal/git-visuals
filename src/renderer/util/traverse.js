import isObject from 'lodash.isobject'

function traverse (obj, fn, cxt) {
  const args = Array.prototype.slice.call(arguments, 3)

  const path = args[0] || []
  cxt = cxt || { ignore: [] }

  for (let key in obj) {
    if (cxt.ignore.includes(key)) continue
    fn(obj[key], key, [...path])
    if (obj[key] && isObject(obj[key])) {
      traverse(obj[key], fn, cxt, [...path, key])
    }
  }
}

export default traverse
