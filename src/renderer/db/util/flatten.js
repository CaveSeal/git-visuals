import flat from 'flat'
import toPairs from 'lodash.topairs'

function flatten (obj, opts = {}) {
  let result = flat(obj, opts)

  if (opts.pairs) {
    result = toPairs(result)
  }
  return result
}

export default flatten
