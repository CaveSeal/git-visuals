import isPlainObject from 'lodash.isplainobject'

function traverse (obj, fn) {
  const args = Array.prototype.slice.call(arguments, 2)

  const path = args[0] || []

  for (let key in obj) {
    fn(obj[key], key, [...path])
    if (obj[key] && isPlainObject(obj[key])) {
      traverse(obj[key], fn, [...path, key])
    }
  }
}

export default traverse
