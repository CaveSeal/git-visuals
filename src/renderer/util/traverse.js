function traverse (obj, fn, ignore) {
  const args = Array.prototype.slice.call(arguments, 3)

  for (let key in obj) {
    if (!ignore.includes(key)) {
      fn(obj[key], key, args[0])
      if (obj[key] && typeof obj[key] === 'object') {
        traverse(obj[key], fn, ignore, key)
      }
    }
  }
}

export default traverse
